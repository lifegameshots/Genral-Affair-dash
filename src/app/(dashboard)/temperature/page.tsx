import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TemperatureForm } from '@/modules/temperature/components/temperature-form'
import { Thermometer } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

const statusMap: Record<string, { label: string; variant: 'info' | 'success' | 'secondary' }> = {
  submitted: { label: '접수됨', variant: 'info' },
  acknowledged: { label: '확인됨', variant: 'info' },
  resolved: { label: '해결됨', variant: 'success' },
}

export default async function TemperaturePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('floor')
    .eq('id', user.id)
    .single()

  const userFloor = profile?.floor ?? null

  // Get current temperature for user's floor
  let currentTemp: { current_temp: number | null; target_temp: number | null } | null = null
  if (userFloor) {
    const { data: tempData } = await supabase
      .from('temperature_readings')
      .select('current_temp, target_temp')
      .eq('floor', userFloor)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single()
    currentTemp = tempData
  }

  // My complaints
  const { data: myComplaints } = await supabase
    .from('temperature_complaints')
    .select('id, floor, feeling, memo, status, created_at')
    .eq('reporter_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Thermometer className="w-5 h-5 text-gray-700" />
        <h1 className="text-xl font-bold text-gray-900">온도 민원</h1>
      </div>

      {/* Current temperature display */}
      {userFloor && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 mb-1">{userFloor}층 현재 온도</div>
                <div className="text-4xl font-bold text-gray-900">
                  {currentTemp?.current_temp != null ? `${currentTemp.current_temp}°C` : '—'}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  목표: {currentTemp?.target_temp != null ? `${currentTemp.target_temp}°C` : '설정 없음'}
                </div>
              </div>
              <div className="text-6xl">🌡️</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Complaint form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">온도 민원 접수</CardTitle>
        </CardHeader>
        <CardContent>
          <TemperatureForm userFloor={userFloor} />
        </CardContent>
      </Card>

      {/* My history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-gray-800">내 민원 이력</CardTitle>
        </CardHeader>
        <CardContent>
          {(myComplaints ?? []).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">민원 이력이 없습니다</p>
          ) : (
            <div className="space-y-2">
              {myComplaints!.map((c) => {
                const st = statusMap[c.status] ?? { label: c.status, variant: 'secondary' as const }
                return (
                  <div key={c.id} className="flex items-center justify-between gap-2 py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{c.feeling === 'hot' ? '🥵' : '🥶'}</span>
                      <div>
                        <div className="text-sm font-medium text-gray-800">
                          {c.floor}층 · {c.feeling === 'hot' ? '덥다' : '춥다'}
                        </div>
                        {c.memo && <div className="text-xs text-gray-400">{c.memo}</div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={st.variant}>{st.label}</Badge>
                      <span className="text-xs text-gray-400">{formatDateTime(c.created_at)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
