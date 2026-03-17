import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { updateFacilityStatus, assignFacilityVendor } from '@/modules/facility/actions'
import { formatDate } from '@/lib/utils'

const statusOptions = [
  { value: 'submitted', label: '접수됨' },
  { value: 'vendor_assigned', label: '외주배정' },
  { value: 'in_repair', label: '수리중' },
  { value: 'completed', label: '완료' },
]

const statusBadge: Record<string, 'info' | 'warning' | 'success' | 'secondary'> = {
  submitted: 'info', vendor_assigned: 'warning', in_repair: 'warning', completed: 'success',
}

const categoryLabel: Record<string, string> = {
  lighting: '조명', furniture: '가구', door: '문/도어',
  plumbing: '배관', electrical: '전기', cleaning: '청소', other: '기타',
}

export default async function AdminFacilityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: requests } = await supabase
    .from('facility_requests')
    .select('id, category, floor, location_detail, description, urgency, status, vendor, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-gray-900">시설 수리 관리</h1>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>카테고리</TableHead>
                <TableHead>위치</TableHead>
                <TableHead>증상</TableHead>
                <TableHead>긴급도</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>외주</TableHead>
                <TableHead>날짜</TableHead>
                <TableHead>관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(requests ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-400 py-6">요청이 없습니다</TableCell>
                </TableRow>
              ) : (
                requests!.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{categoryLabel[req.category] ?? req.category}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{req.floor}층 {req.location_detail}</TableCell>
                    <TableCell className="text-sm text-gray-600 max-w-xs truncate">{req.description}</TableCell>
                    <TableCell>
                      <Badge variant={req.urgency === 'urgent' ? 'destructive' : 'secondary'}>
                        {req.urgency === 'urgent' ? '긴급' : '일반'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadge[req.status] ?? 'secondary'}>
                        {statusOptions.find(o => o.value === req.status)?.label ?? req.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{req.vendor ?? '-'}</TableCell>
                    <TableCell className="text-xs text-gray-500">{formatDate(req.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {/* Status change */}
                        <form action={async (fd) => {
                          'use server'
                          await updateFacilityStatus(req.id, fd.get('status') as string)
                        }}>
                          <select
                            name="status"
                            defaultValue={req.status}
                            className="h-7 rounded border border-gray-200 bg-white px-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
                          >
                            {statusOptions.map(o => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                          <button type="submit" className="text-xs text-blue-600 hover:underline w-full text-right">변경</button>
                        </form>
                        {/* Vendor assign */}
                        <form action={async (fd) => {
                          'use server'
                          const vendor = fd.get('vendor') as string
                          if (!vendor?.trim()) return
                          await assignFacilityVendor(req.id, vendor)
                        }} className="flex gap-1">
                          <input
                            name="vendor"
                            defaultValue={req.vendor ?? ''}
                            placeholder="외주업체명"
                            className="h-7 flex-1 rounded border border-gray-200 bg-white px-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-0"
                          />
                          <button type="submit" className="h-7 px-1.5 text-xs text-white bg-blue-600 rounded hover:bg-blue-700 whitespace-nowrap">배정</button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
