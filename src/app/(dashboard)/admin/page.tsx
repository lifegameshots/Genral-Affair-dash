import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TrendChart } from '@/components/admin/trend-chart'
import { timeAgo } from '@/lib/utils'
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // KPI data
  const [
    { count: pendingCount },
    { count: inProgressCount },
    { count: completedTodayCount },
    { data: urgentRequests },
    { data: staffData },
  ] = await Promise.all([
    // Pending (submitted/reviewing) across all modules
    supabase
      .from('equipment_requests')
      .select('*', { count: 'exact', head: true })
      .in('status', ['submitted', 'reviewing']),
    // In progress
    supabase
      .from('equipment_requests')
      .select('*', { count: 'exact', head: true })
      .in('status', ['in_progress', 'scheduled']),
    // Completed today
    supabase
      .from('equipment_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('updated_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    // Urgent requests (equipment_requests with urgent urgency not completed)
    supabase
      .from('equipment_requests')
      .select('id, title, urgency, status, floor, created_at, requester_id')
      .eq('urgency', 'urgent')
      .not('status', 'eq', 'completed')
      .order('created_at', { ascending: false })
      .limit(10),
    // Staff workload: operators
    supabase
      .from('users')
      .select('id, name, department')
      .in('role', ['operator', 'admin'])
      .limit(10),
  ])

  // Facility urgent requests
  const { data: facilityUrgent } = await supabase
    .from('facility_requests')
    .select('id, category, floor, location_detail, urgency, status, created_at')
    .eq('urgency', 'urgent')
    .not('status', 'eq', 'completed')
    .order('created_at', { ascending: false })
    .limit(5)

  // Complaints unresolved
  const { count: complaintPendingCount } = await supabase
    .from('complaints')
    .select('*', { count: 'exact', head: true })
    .in('status', ['submitted', 'reviewing'])

  // Facility pending
  const { count: facilityPendingCount } = await supabase
    .from('facility_requests')
    .select('*', { count: 'exact', head: true })
    .in('status', ['submitted', 'vendor_assigned'])

  // 7-day trend data (simplified - count created_at per day for last 7 days)
  const days: { date: string; complaints: number; equipment: number; facility: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })
    const start = new Date(d.setHours(0, 0, 0, 0)).toISOString()
    const end = new Date(d.setHours(23, 59, 59, 999)).toISOString()

    const [{ count: c }, { count: e }, { count: f }] = await Promise.all([
      supabase.from('complaints').select('*', { count: 'exact', head: true })
        .gte('created_at', start).lte('created_at', end),
      supabase.from('equipment_requests').select('*', { count: 'exact', head: true })
        .gte('created_at', start).lte('created_at', end),
      supabase.from('facility_requests').select('*', { count: 'exact', head: true })
        .gte('created_at', start).lte('created_at', end),
    ])
    days.push({ date: dateStr, complaints: c ?? 0, equipment: e ?? 0, facility: f ?? 0 })
  }

  // Staff workload: count assignments
  const staffWorkload = await Promise.all(
    (staffData ?? []).map(async (staff) => {
      const { count: assigned } = await supabase
        .from('equipment_requests')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', staff.id)
        .not('status', 'eq', 'completed')
      return { ...staff, assigned: assigned ?? 0 }
    })
  )

  const totalPending = (pendingCount ?? 0) + (complaintPendingCount ?? 0) + (facilityPendingCount ?? 0)
  const slaRate = totalPending > 0
    ? Math.round(((completedTodayCount ?? 0) / Math.max(totalPending + (completedTodayCount ?? 0), 1)) * 100)
    : 100

  const urgentAll = [
    ...(urgentRequests ?? []).map(r => ({ id: r.id, title: r.title, type: '전산장비', status: r.status, floor: r.floor, created_at: r.created_at })),
    ...(facilityUrgent ?? []).map(r => ({ id: r.id, title: `${r.category} (${r.floor}층 ${r.location_detail})`, type: '시설수리', status: r.status, floor: r.floor, created_at: r.created_at })),
  ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  const statusLabels: Record<string, { label: string; variant: 'info' | 'warning' | 'success' | 'destructive' | 'secondary' }> = {
    submitted: { label: '접수됨', variant: 'info' },
    reviewing: { label: '검토중', variant: 'warning' },
    in_progress: { label: '처리중', variant: 'warning' },
    scheduled: { label: '일정확정', variant: 'info' },
    completed: { label: '완료', variant: 'success' },
    vendor_assigned: { label: '외주배정', variant: 'secondary' },
    in_repair: { label: '수리중', variant: 'warning' },
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">운영 현황</h1>
        <p className="text-sm text-gray-500 mt-0.5">전체 민원 및 요청 현황을 관리합니다</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                <ClipboardList className="w-4 h-4 text-orange-600" />
              </div>
              <span className="text-xs text-gray-500 font-medium">미처리 요청</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{totalPending}</div>
            <div className="text-xs text-gray-400 mt-1">접수 + 검토 중</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-xs text-gray-500 font-medium">처리중</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{(inProgressCount ?? 0)}</div>
            <div className="text-xs text-gray-400 mt-1">진행 중인 요청</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-xs text-gray-500 font-medium">완료(오늘)</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{completedTodayCount ?? 0}</div>
            <div className="text-xs text-gray-400 mt-1">오늘 처리 완료</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-violet-600" />
              </div>
              <span className="text-xs text-gray-500 font-medium">SLA 준수율</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{slaRate}%</div>
            <div className="text-xs text-gray-400 mt-1">오늘 기준</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trend Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-800">카테고리별 요청 추이 (최근 7일)</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendChart data={days} />
          </CardContent>
        </Card>

        {/* Staff Workload */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-800">담당자별 업무 현황</CardTitle>
          </CardHeader>
          <CardContent>
            {staffWorkload.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">담당자가 없습니다</p>
            ) : (
              <div className="space-y-3">
                {staffWorkload.map((staff) => (
                  <div key={staff.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{staff.name}</div>
                      <div className="text-xs text-gray-400">{staff.department ?? '-'}</div>
                    </div>
                    <Badge variant={staff.assigned > 5 ? 'warning' : staff.assigned > 0 ? 'info' : 'secondary'}>
                      {staff.assigned}건
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Urgent Requests */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <CardTitle className="text-sm font-semibold text-gray-800">긴급 요청</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {urgentAll.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">긴급 요청이 없습니다</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>내용</TableHead>
                  <TableHead>유형</TableHead>
                  <TableHead>층</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>접수</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {urgentAll.map((req) => {
                  const st = statusLabels[req.status] ?? { label: req.status, variant: 'secondary' as const }
                  return (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium text-sm max-w-xs truncate">{req.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{req.type}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{req.floor ? `${req.floor}층` : '-'}</TableCell>
                      <TableCell>
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">{timeAgo(req.created_at)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
