import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Search,
  Package,
  Thermometer,
  MessageSquare,
  PackageOpen,
  Wrench,
  Bell,
  ChevronRight,
  ClipboardList,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { timeAgo, formatDate } from '@/lib/utils'
import type { Announcement, EquipmentRequest, Parcel } from '@/types/database'

const quickActions = [
  {
    label: '분실 신고',
    description: '분실물을 신고하거나 습득물을 조회하세요',
    href: '/lost-found',
    icon: Search,
    color: 'bg-violet-50 text-violet-600',
    border: 'border-violet-100',
  },
  {
    label: '장비 요청',
    description: '전산 장비 점검·교체·구매를 요청하세요',
    href: '/equipment',
    icon: Package,
    color: 'bg-blue-50 text-blue-600',
    border: 'border-blue-100',
  },
  {
    label: '온도 민원',
    description: '사무실 온도가 불편하면 신고하세요',
    href: '/temperature',
    icon: Thermometer,
    color: 'bg-orange-50 text-orange-600',
    border: 'border-orange-100',
  },
  {
    label: '불편 건의',
    description: '시설·복지·생활 관련 의견을 남기세요',
    href: '/complaint',
    icon: MessageSquare,
    color: 'bg-green-50 text-green-600',
    border: 'border-green-100',
  },
  {
    label: '택배 조회',
    description: '보관 중인 택배를 확인하고 수령하세요',
    href: '/parcel',
    icon: PackageOpen,
    color: 'bg-amber-50 text-amber-600',
    border: 'border-amber-100',
  },
  {
    label: '시설 수리',
    description: '조명·가구·배관 등 수리를 요청하세요',
    href: '/facility',
    icon: Wrench,
    color: 'bg-rose-50 text-rose-600',
    border: 'border-rose-100',
  },
]

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline' | 'info' }> = {
  submitted: { label: '접수됨', variant: 'info' },
  reviewing: { label: '검토중', variant: 'warning' },
  in_progress: { label: '처리중', variant: 'warning' },
  completed: { label: '완료', variant: 'success' },
  rejected: { label: '반려', variant: 'destructive' },
  stored: { label: '보관중', variant: 'info' },
  notified: { label: '알림 발송', variant: 'warning' },
  claimed: { label: '수령 완료', variant: 'success' },
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch user profile
  const { data: profile } = await supabase
    .from('users')
    .select('name, floor, department')
    .eq('id', user.id)
    .single()

  const userName = profile?.name ?? user.email ?? '사용자'
  const userFloor = profile?.floor

  // Fetch in-progress requests (equipment + facility)
  const { data: activeRequests } = await supabase
    .from('equipment_requests')
    .select('id, title, status, created_at')
    .eq('requester_id', user.id)
    .not('status', 'eq', 'completed')
    .order('created_at', { ascending: false })
    .limit(5)

  // Fetch parcels for user
  const { data: myParcels } = await supabase
    .from('parcels')
    .select('id, recipient_name, carrier, status, created_at')
    .eq('recipient_id', user.id)
    .in('status', ['stored', 'notified'])
    .order('created_at', { ascending: false })
    .limit(3)

  // Fetch floor temperature if user has floor
  let floorTemp: { current_temp: number | null; target_temp: number | null } | null = null
  if (userFloor) {
    const { data: tempData } = await supabase
      .from('temperature_readings')
      .select('current_temp, target_temp')
      .eq('floor', userFloor)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single()
    floorTemp = tempData
  }

  // Fetch recent announcements
  const { data: announcements } = await supabase
    .from('announcements')
    .select('id, title, content, is_pinned, published_at, created_at')
    .not('published_at', 'is', null)
    .order('is_pinned', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(5)

  const inProgressCount = (activeRequests ?? []).length
  const parcelCount = (myParcels ?? []).length

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            안녕하세요, {userName}님 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            오늘도 좋은 하루 되세요.
            {userFloor ? ` · ${userFloor}층 근무` : ''}
            {profile?.department ? ` · ${profile.department}` : ''}
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon={<ClipboardList className="w-5 h-5 text-blue-600" />}
          label="진행 중인 요청"
          value={String(inProgressCount)}
          sub={inProgressCount > 0 ? '처리 대기' : '없음'}
          bgColor="bg-blue-50"
        />
        <StatCard
          icon={<PackageOpen className="w-5 h-5 text-amber-600" />}
          label="미수령 택배"
          value={String(parcelCount)}
          sub={parcelCount > 0 ? '수령 필요' : '없음'}
          bgColor="bg-amber-50"
        />
        <StatCard
          icon={<Thermometer className="w-5 h-5 text-orange-500" />}
          label={userFloor ? `${userFloor}층 온도` : '내 층 온도'}
          value={floorTemp?.current_temp != null ? `${floorTemp.current_temp}°C` : '—'}
          sub={floorTemp?.target_temp != null ? `목표 ${floorTemp.target_temp}°C` : '데이터 없음'}
          bgColor="bg-orange-50"
        />
        <StatCard
          icon={<Bell className="w-5 h-5 text-violet-600" />}
          label="공지사항"
          value={String((announcements ?? []).length)}
          sub="최근 게시"
          bgColor="bg-violet-50"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">빠른 서비스</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.href}
                href={action.href}
                className={`flex items-start gap-3 p-4 rounded-xl border bg-white ${action.border} hover:shadow-sm hover:border-blue-200 transition-all group`}
              >
                <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${action.color} shrink-0 mt-0.5`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {action.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    {action.description}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 ml-auto shrink-0 mt-1 transition-colors" />
              </Link>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* My Active Requests */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-gray-800">내 진행 중인 요청</CardTitle>
              <Link
                href="/equipment"
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                전체 보기 <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {(activeRequests ?? []).length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">진행 중인 요청이 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {(activeRequests as Pick<EquipmentRequest, 'id' | 'title' | 'status' | 'created_at'>[]).map((req) => {
                  const st = statusMap[req.status] ?? { label: req.status, variant: 'secondary' as const }
                  return (
                    <div key={req.id} className="flex items-center justify-between gap-2 py-1.5">
                      <span className="text-sm text-gray-700 truncate flex-1">{req.title}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={st.variant}>{st.label}</Badge>
                        <span className="text-xs text-gray-400">{timeAgo(req.created_at)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Parcels */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-gray-800">미수령 택배</CardTitle>
              <Link
                href="/parcel"
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                전체 보기 <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {(myParcels ?? []).length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">미수령 택배가 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {(myParcels as Pick<Parcel, 'id' | 'recipient_name' | 'carrier' | 'status' | 'created_at'>[]).map((parcel) => {
                  const st = statusMap[parcel.status] ?? { label: parcel.status, variant: 'secondary' as const }
                  return (
                    <div key={parcel.id} className="flex items-center justify-between gap-2 py-1.5">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-gray-700 truncate block">
                          {parcel.carrier ?? '택배'}
                        </span>
                        <span className="text-xs text-gray-400">{formatDate(parcel.created_at)}</span>
                      </div>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Announcements */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-800">공지사항</CardTitle>
        </CardHeader>
        <CardContent>
          {(announcements ?? []).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">등록된 공지사항이 없습니다.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {(announcements as Pick<Announcement, 'id' | 'title' | 'is_pinned' | 'published_at' | 'created_at'>[]).map((ann) => (
                <div key={ann.id} className="flex items-start gap-3 py-3">
                  {ann.is_pinned && (
                    <span className="shrink-0 mt-0.5 text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                      고정
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{ann.title}</p>
                  </div>
                  <span className="shrink-0 text-xs text-gray-400">
                    {timeAgo(ann.published_at ?? ann.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
  bgColor: string
}

function StatCard({ icon, label, value, sub, bgColor }: StatCardProps) {
  return (
    <div className={`rounded-xl p-4 ${bgColor} border border-white/50`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium text-gray-600">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{sub}</div>
    </div>
  )
}
