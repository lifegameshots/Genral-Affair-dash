import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { updateEquipmentRequestStatus } from '@/modules/equipment/actions'
import { formatDate } from '@/lib/utils'

const statusOptions = [
  { value: 'submitted', label: '접수됨' },
  { value: 'reviewing', label: '검토중' },
  { value: 'scheduled', label: '일정확정' },
  { value: 'in_progress', label: '처리중' },
  { value: 'completed', label: '완료' },
]

const statusBadge: Record<string, 'info' | 'warning' | 'success' | 'secondary'> = {
  submitted: 'info', reviewing: 'warning', scheduled: 'info', in_progress: 'warning', completed: 'success',
}

const urgencyBadge: Record<string, 'destructive' | 'secondary'> = {
  urgent: 'destructive', normal: 'secondary',
}

const requestTypeLabel: Record<string, string> = {
  inspection: '점검', replacement: '교체', purchase: '구매',
  software_purchase: 'SW구입', network_inspection: '네트워크',
}

const assetTypeLabel: Record<string, string> = {
  pc: 'PC', monitor: '모니터', laptop: '노트북', keyboard: '키보드',
  mouse: '마우스', headset: '헤드셋', other: '기타',
}

const assetStatusLabel: Record<string, string> = {
  in_use: '사용중', in_stock: '재고', under_repair: '수리중', disposed: '폐기',
}

export default async function AdminEquipmentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: requests }, { data: assets }] = await Promise.all([
    supabase
      .from('equipment_requests')
      .select('id, title, request_type, urgency, status, floor, created_at, requester_id')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('assets')
      .select('id, asset_number, type, model, status, assigned_to, purchased_at')
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-gray-900">전산장비 관리</h1>

      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests">요청 대기열</TabsTrigger>
          <TabsTrigger value="assets">자산 DB</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>제목</TableHead>
                    <TableHead>유형</TableHead>
                    <TableHead>긴급도</TableHead>
                    <TableHead>층</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>날짜</TableHead>
                    <TableHead>변경</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(requests ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-400 py-6">요청이 없습니다</TableCell>
                    </TableRow>
                  ) : (
                    requests!.map((req) => (
                      <TableRow key={req.id}>
                        <TableCell className="font-medium text-sm max-w-xs truncate">{req.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{requestTypeLabel[req.request_type] ?? req.request_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={urgencyBadge[req.urgency] ?? 'secondary'}>
                            {req.urgency === 'urgent' ? '긴급' : '일반'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{req.floor ? `${req.floor}층` : '-'}</TableCell>
                        <TableCell>
                          <Badge variant={statusBadge[req.status] ?? 'secondary'}>
                            {statusOptions.find(o => o.value === req.status)?.label ?? req.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">{formatDate(req.created_at)}</TableCell>
                        <TableCell>
                          <form action={async (fd) => {
                            'use server'
                            await updateEquipmentRequestStatus(req.id, fd.get('status') as string)
                          }}>
                            <select
                              name="status"
                              defaultValue={req.status}
                              className="h-8 rounded border border-gray-200 bg-white px-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              {statusOptions.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                              ))}
                            </select>
                            <button type="submit" className="ml-1 text-xs text-blue-600 hover:underline">저장</button>
                          </form>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>자산번호</TableHead>
                    <TableHead>유형</TableHead>
                    <TableHead>모델</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>구매일</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(assets ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-400 py-6">자산 데이터가 없습니다</TableCell>
                    </TableRow>
                  ) : (
                    assets!.map((asset) => (
                      <TableRow key={asset.id}>
                        <TableCell className="font-mono text-sm">{asset.asset_number}</TableCell>
                        <TableCell className="text-sm">{assetTypeLabel[asset.type] ?? asset.type}</TableCell>
                        <TableCell className="text-sm">{asset.model ?? '-'}</TableCell>
                        <TableCell>
                          <Badge variant={asset.status === 'in_use' ? 'info' : asset.status === 'under_repair' ? 'warning' : asset.status === 'disposed' ? 'secondary' : 'success'}>
                            {assetStatusLabel[asset.status] ?? asset.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">{asset.purchased_at ? formatDate(asset.purchased_at) : '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
