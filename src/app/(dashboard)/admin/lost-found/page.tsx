import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { updateFoundItemStatus, updateLostItemStatus } from '@/modules/lost-found/actions'
import { formatDate } from '@/lib/utils'

const categoryLabel: Record<string, string> = {
  electronics: '전자기기',
  clothing: '의류/잡화',
  wallet_card: '지갑/카드',
  other: '기타',
}

const foundStatusOptions = [
  { value: 'registered', label: '등록됨' },
  { value: 'matched', label: '매칭됨' },
  { value: 'claimed', label: '수령완료' },
  { value: 'disposed', label: '폐기됨' },
]

const lostStatusOptions = [
  { value: 'reported', label: '신고됨' },
  { value: 'matched', label: '매칭됨' },
  { value: 'claimed', label: '찾았음' },
  { value: 'closed', label: '종료' },
]

const foundBadge: Record<string, 'info' | 'success' | 'secondary' | 'warning'> = {
  registered: 'info', matched: 'warning', claimed: 'success', disposed: 'secondary',
}
const lostBadge: Record<string, 'info' | 'success' | 'secondary' | 'warning'> = {
  reported: 'info', matched: 'warning', claimed: 'success', closed: 'secondary',
}

// Floor heatmap: count by floor
function FloorHeatmap({ data }: { data: Record<number, { lost: number; found: number }> }) {
  const maxCount = Math.max(...Object.values(data).map(d => d.lost + d.found), 1)
  return (
    <div className="grid grid-cols-7 gap-1">
      {Array.from({ length: 41 }, (_, i) => 41 - i).map((floor) => {
        const counts = data[floor] ?? { lost: 0, found: 0 }
        const total = counts.lost + counts.found
        const intensity = total / maxCount
        return (
          <div
            key={floor}
            className="relative flex items-center justify-center rounded text-[10px] font-medium h-8"
            style={{
              backgroundColor: total > 0
                ? `rgba(59, 130, 246, ${0.15 + intensity * 0.7})`
                : '#f3f4f6',
              color: intensity > 0.5 ? '#1d4ed8' : '#6b7280',
            }}
            title={`${floor}층: 분실 ${counts.lost}건, 습득 ${counts.found}건`}
          >
            {floor}
            {total > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center w-3.5 h-3.5 rounded-full bg-blue-600 text-white text-[8px]">
                {total}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default async function AdminLostFoundPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: foundItems }, { data: lostItems }] = await Promise.all([
    supabase
      .from('found_items')
      .select('id, item_name, category, found_floor, found_location, storage_location, status, created_at')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('lost_items')
      .select('id, item_name, category, lost_floor, lost_location, status, created_at')
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  // Build floor data
  const floorData: Record<number, { lost: number; found: number }> = {}
  for (const item of lostItems ?? []) {
    if (item.lost_floor) {
      if (!floorData[item.lost_floor]) floorData[item.lost_floor] = { lost: 0, found: 0 }
      floorData[item.lost_floor].lost++
    }
  }
  for (const item of foundItems ?? []) {
    if (item.found_floor) {
      if (!floorData[item.found_floor]) floorData[item.found_floor] = { lost: 0, found: 0 }
      floorData[item.found_floor].found++
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-gray-900">분실물 관리</h1>

      {/* Floor Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-gray-800">층별 현황 (진할수록 많음)</CardTitle>
        </CardHeader>
        <CardContent>
          <FloorHeatmap data={floorData} />
        </CardContent>
      </Card>

      <Tabs defaultValue="found">
        <TabsList>
          <TabsTrigger value="found">습득물 관리</TabsTrigger>
          <TabsTrigger value="lost">분실 신고 목록</TabsTrigger>
        </TabsList>

        <TabsContent value="found" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>물건</TableHead>
                    <TableHead>카테고리</TableHead>
                    <TableHead>발견 위치</TableHead>
                    <TableHead>보관 위치</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>날짜</TableHead>
                    <TableHead>변경</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(foundItems ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-400 py-6">데이터가 없습니다</TableCell>
                    </TableRow>
                  ) : (
                    foundItems!.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium text-sm">{item.item_name}</TableCell>
                        <TableCell className="text-sm">{categoryLabel[item.category] ?? item.category}</TableCell>
                        <TableCell className="text-sm">{item.found_floor ? `${item.found_floor}층` : ''}{item.found_location ? ` ${item.found_location}` : ''}</TableCell>
                        <TableCell className="text-sm">{item.storage_location ?? '-'}</TableCell>
                        <TableCell>
                          <Badge variant={foundBadge[item.status] ?? 'secondary'}>
                            {foundStatusOptions.find(o => o.value === item.status)?.label ?? item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">{formatDate(item.created_at)}</TableCell>
                        <TableCell>
                          <form action={async (fd) => {
                            'use server'
                            const status = fd.get('status') as string
                            await updateFoundItemStatus(item.id, status)
                          }}>
                            <select
                              name="status"
                              defaultValue={item.status}
                              className="h-8 rounded border border-gray-200 bg-white px-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              {foundStatusOptions.map(o => (
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

        <TabsContent value="lost" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>물건</TableHead>
                    <TableHead>카테고리</TableHead>
                    <TableHead>분실 위치</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>날짜</TableHead>
                    <TableHead>변경</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(lostItems ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-400 py-6">데이터가 없습니다</TableCell>
                    </TableRow>
                  ) : (
                    lostItems!.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium text-sm">{item.item_name}</TableCell>
                        <TableCell className="text-sm">{categoryLabel[item.category] ?? item.category}</TableCell>
                        <TableCell className="text-sm">{item.lost_floor ? `${item.lost_floor}층` : ''}{item.lost_location ? ` ${item.lost_location}` : ''}</TableCell>
                        <TableCell>
                          <Badge variant={lostBadge[item.status] ?? 'secondary'}>
                            {lostStatusOptions.find(o => o.value === item.status)?.label ?? item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">{formatDate(item.created_at)}</TableCell>
                        <TableCell>
                          <form action={async (fd) => {
                            'use server'
                            const status = fd.get('status') as string
                            await updateLostItemStatus(item.id, status)
                          }}>
                            <select
                              name="status"
                              defaultValue={item.status}
                              className="h-8 rounded border border-gray-200 bg-white px-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              {lostStatusOptions.map(o => (
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
      </Tabs>
    </div>
  )
}
