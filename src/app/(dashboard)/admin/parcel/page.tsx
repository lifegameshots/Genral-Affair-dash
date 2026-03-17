import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { registerParcel, notifyParcel, reminderParcel } from '@/modules/parcel/actions'
import { formatDate } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

const carriers = ['CJ대한통운', '롯데택배', 'GS포스트박스', '우체국', '한진택배', '쿠팡로켓', '기타']

const statusBadge: Record<string, 'info' | 'warning' | 'success'> = {
  stored: 'info', notified: 'warning', claimed: 'success',
}

const statusLabel: Record<string, string> = {
  stored: '보관중', notified: '알림발송', claimed: '수령완료',
}

export default async function AdminParcelPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: activeParcels }, { data: claimedParcels }] = await Promise.all([
    supabase
      .from('parcels')
      .select('id, recipient_name, carrier, tracking_number, storage_location, status, reminder_count, created_at')
      .in('status', ['stored', 'notified'])
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('parcels')
      .select('id, recipient_name, carrier, tracking_number, storage_location, status, claimed_at, created_at')
      .eq('status', 'claimed')
      .order('claimed_at', { ascending: false })
      .limit(20),
  ])

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-gray-900">택배 관리</h1>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">보관중 택배</TabsTrigger>
          <TabsTrigger value="register">택배 등록</TabsTrigger>
          <TabsTrigger value="history">수령 이력</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>수신인</TableHead>
                    <TableHead>택배사</TableHead>
                    <TableHead>운송장번호</TableHead>
                    <TableHead>보관위치</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>독촉횟수</TableHead>
                    <TableHead>도착일</TableHead>
                    <TableHead>액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(activeParcels ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-gray-400 py-6">보관중인 택배가 없습니다</TableCell>
                    </TableRow>
                  ) : (
                    activeParcels!.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium text-sm">{p.recipient_name}</TableCell>
                        <TableCell className="text-sm">{p.carrier ?? '-'}</TableCell>
                        <TableCell className="text-xs font-mono">{p.tracking_number ?? '-'}</TableCell>
                        <TableCell className="text-sm">{p.storage_location}</TableCell>
                        <TableCell>
                          <Badge variant={statusBadge[p.status] ?? 'secondary'}>{statusLabel[p.status] ?? p.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-center">{p.reminder_count}</TableCell>
                        <TableCell className="text-xs text-gray-500">{formatDate(p.created_at)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {p.status === 'stored' && (
                              <form action={async () => { 'use server'; await notifyParcel(p.id) }}>
                                <button type="submit" className="text-xs text-blue-600 hover:underline whitespace-nowrap">알림발송</button>
                              </form>
                            )}
                            {p.status === 'notified' && (
                              <form action={async () => { 'use server'; await reminderParcel(p.id) }}>
                                <button type="submit" className="text-xs text-amber-600 hover:underline whitespace-nowrap">독촉</button>
                              </form>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="register" className="mt-4">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="text-base">택배 입고 등록</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={async (fd) => {
                'use server'
                const recipient_name = fd.get('recipient_name') as string
                const carrier = fd.get('carrier') as string
                const tracking_number = fd.get('tracking_number') as string
                const storage_location = fd.get('storage_location') as string
                if (!recipient_name || !storage_location) return
                await registerParcel({
                  recipient_name,
                  carrier: carrier || null,
                  tracking_number: tracking_number || null,
                  storage_location,
                })
              }} className="space-y-4">
                <div>
                  <Label htmlFor="recipient_name">수신인 이름 *</Label>
                  <Input id="recipient_name" name="recipient_name" placeholder="홍길동" className="mt-1" />
                </div>
                <div>
                  <Label>택배사</Label>
                  <select
                    name="carrier"
                    className="mt-1 h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">선택 안함</option>
                    {carriers.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <Label htmlFor="tracking_number">운송장 번호</Label>
                  <Input id="tracking_number" name="tracking_number" placeholder="1234567890" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="storage_location">보관 위치 *</Label>
                  <Input id="storage_location" name="storage_location" placeholder="예: 총무팀 서랍 A" className="mt-1" />
                </div>
                <Button type="submit" className="w-full">등록</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>수신인</TableHead>
                    <TableHead>택배사</TableHead>
                    <TableHead>보관위치</TableHead>
                    <TableHead>수령일</TableHead>
                    <TableHead>도착일</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(claimedParcels ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-400 py-6">수령 이력이 없습니다</TableCell>
                    </TableRow>
                  ) : (
                    claimedParcels!.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium text-sm">{p.recipient_name}</TableCell>
                        <TableCell className="text-sm">{p.carrier ?? '-'}</TableCell>
                        <TableCell className="text-sm">{p.storage_location}</TableCell>
                        <TableCell className="text-xs text-gray-500">{p.claimed_at ? formatDate(p.claimed_at) : '-'}</TableCell>
                        <TableCell className="text-xs text-gray-500">{formatDate(p.created_at)}</TableCell>
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
