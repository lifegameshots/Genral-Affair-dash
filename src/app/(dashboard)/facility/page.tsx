import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FacilityForm } from '@/modules/facility/components/facility-form'
import { formatDate } from '@/lib/utils'
import { Wrench } from 'lucide-react'

const statusMap: Record<string, { label: string; variant: 'info' | 'warning' | 'success' | 'secondary' }> = {
  submitted: { label: '접수됨', variant: 'info' },
  vendor_assigned: { label: '외주배정', variant: 'warning' },
  in_repair: { label: '수리중', variant: 'warning' },
  completed: { label: '완료', variant: 'success' },
}

const categoryLabel: Record<string, string> = {
  lighting: '조명', furniture: '가구', door: '문/도어',
  plumbing: '배관', electrical: '전기', cleaning: '청소', other: '기타',
}

export default async function FacilityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: myRequests } = await supabase
    .from('facility_requests')
    .select('id, category, floor, location_detail, description, urgency, status, vendor, created_at')
    .eq('requester_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Wrench className="w-5 h-5 text-gray-700" />
        <h1 className="text-xl font-bold text-gray-900">시설 수리 요청</h1>
      </div>

      <Tabs defaultValue="new">
        <TabsList>
          <TabsTrigger value="new">요청 등록</TabsTrigger>
          <TabsTrigger value="history">내 요청 이력</TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">시설 수리 요청</CardTitle>
            </CardHeader>
            <CardContent>
              <FacilityForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <div className="space-y-3">
            {(myRequests ?? []).length === 0 ? (
              <Card>
                <CardContent className="text-center py-8 text-sm text-gray-400">
                  요청 이력이 없습니다
                </CardContent>
              </Card>
            ) : (
              myRequests!.map((req) => {
                const st = statusMap[req.status] ?? { label: req.status, variant: 'secondary' as const }
                return (
                  <Card key={req.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">{categoryLabel[req.category] ?? req.category}</Badge>
                          {req.urgency === 'urgent' && <Badge variant="destructive" className="text-xs">긴급</Badge>}
                          <Badge variant={st.variant}>{st.label}</Badge>
                        </div>
                        <span className="text-xs text-gray-400 shrink-0">{formatDate(req.created_at)}</span>
                      </div>
                      <div className="text-sm font-medium text-gray-800">
                        {req.floor}층 · {req.location_detail}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">{req.description}</div>
                      {req.vendor && (
                        <div className="mt-2 text-xs text-gray-500">외주: {req.vendor}</div>
                      )}
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
