import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { updateTemperatureComplaintStatus, setTargetTemperature } from '@/modules/temperature/actions'
import { formatDateTime } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

const statusOptions = [
  { value: 'submitted', label: '접수됨' },
  { value: 'acknowledged', label: '확인됨' },
  { value: 'resolved', label: '해결됨' },
]

export default async function AdminTemperaturePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: complaints } = await supabase
    .from('temperature_complaints')
    .select('id, reporter_id, floor, feeling, memo, status, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  // Aggregate by floor for heatmap
  const floorData: Record<number, { hot: number; cold: number }> = {}
  for (const c of complaints ?? []) {
    if (!floorData[c.floor]) floorData[c.floor] = { hot: 0, cold: 0 }
    if (c.feeling === 'hot') floorData[c.floor].hot++
    else floorData[c.floor].cold++
  }

  const maxCount = Math.max(...Object.values(floorData).map(d => Math.max(d.hot, d.cold)), 1)

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-gray-900">온도 민원 관리</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Heatmap */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-gray-800">층별 온도 민원 히트맵</CardTitle>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-400 inline-block" /> 덥다</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-400 inline-block" /> 춥다</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 41 }, (_, i) => 41 - i).map((floor) => {
                const counts = floorData[floor] ?? { hot: 0, cold: 0 }
                const hotIntensity = counts.hot / maxCount
                const coldIntensity = counts.cold / maxCount
                const dominant = counts.hot >= counts.cold ? 'hot' : 'cold'
                const intensity = dominant === 'hot' ? hotIntensity : coldIntensity
                const total = counts.hot + counts.cold
                return (
                  <div
                    key={floor}
                    className="relative flex items-center justify-center rounded text-[10px] font-medium h-8 cursor-default"
                    style={{
                      backgroundColor: total > 0
                        ? dominant === 'hot'
                          ? `rgba(239, 68, 68, ${0.2 + intensity * 0.7})`
                          : `rgba(59, 130, 246, ${0.2 + intensity * 0.7})`
                        : '#f3f4f6',
                      color: intensity > 0.5 ? 'white' : '#6b7280',
                    }}
                    title={`${floor}층: 덥다 ${counts.hot}건, 춥다 ${counts.cold}건`}
                  >
                    {floor}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Set target temperature */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-gray-800">목표 온도 입력</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={async (fd) => {
              'use server'
              const floor = parseInt(fd.get('floor') as string)
              const target_temp = parseFloat(fd.get('target_temp') as string)
              if (isNaN(floor) || isNaN(target_temp)) return
              await setTargetTemperature({ floor, target_temp, zone: null })
            }} className="space-y-3">
              <div>
                <Label htmlFor="temp-floor">층수</Label>
                <Input id="temp-floor" name="floor" type="number" min={1} max={41} placeholder="예: 10" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="target_temp">목표 온도 (°C)</Label>
                <Input id="target_temp" name="target_temp" type="number" step={0.5} placeholder="예: 22.5" className="mt-1" />
              </div>
              <Button type="submit" className="w-full">설정</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Complaints list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-gray-800">민원 목록</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>층</TableHead>
                <TableHead>유형</TableHead>
                <TableHead>메모</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>접수</TableHead>
                <TableHead>변경</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(complaints ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-400 py-6">민원이 없습니다</TableCell>
                </TableRow>
              ) : (
                complaints!.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.floor}층</TableCell>
                    <TableCell>
                      <span className="text-lg">{c.feeling === 'hot' ? '🥵' : '🥶'}</span>
                      <span className="ml-1 text-sm">{c.feeling === 'hot' ? '덥다' : '춥다'}</span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 max-w-xs truncate">{c.memo ?? '-'}</TableCell>
                    <TableCell>
                      <Badge variant={c.status === 'resolved' ? 'success' : c.status === 'acknowledged' ? 'info' : 'secondary'}>
                        {statusOptions.find(o => o.value === c.status)?.label ?? c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">{formatDateTime(c.created_at)}</TableCell>
                    <TableCell>
                      <form action={async (fd) => {
                        'use server'
                        await updateTemperatureComplaintStatus(c.id, fd.get('status') as string)
                      }}>
                        <select
                          name="status"
                          defaultValue={c.status}
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
    </div>
  )
}
