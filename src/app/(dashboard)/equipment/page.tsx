import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EquipmentForm } from '@/modules/equipment/components/equipment-form'
import { formatDate } from '@/lib/utils'
import { Package } from 'lucide-react'

const statusMap: Record<string, { label: string; variant: 'info' | 'warning' | 'success' | 'secondary' }> = {
  submitted: { label: '접수됨', variant: 'info' },
  reviewing: { label: '검토중', variant: 'warning' },
  scheduled: { label: '일정확정', variant: 'info' },
  in_progress: { label: '처리중', variant: 'warning' },
  completed: { label: '완료', variant: 'success' },
}

const requestTypeLabel: Record<string, string> = {
  inspection: '점검',
  replacement: '교체',
  purchase: '구매',
  software_purchase: 'SW구입',
  network_inspection: '네트워크점검',
}

export default async function EquipmentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: myRequests } = await supabase
    .from('equipment_requests')
    .select('id, title, request_type, urgency, status, floor, created_at')
    .eq('requester_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Package className="w-5 h-5 text-gray-700" />
        <h1 className="text-xl font-bold text-gray-900">전산장비</h1>
      </div>

      <Tabs defaultValue="new">
        <TabsList>
          <TabsTrigger value="new">요청 등록</TabsTrigger>
          <TabsTrigger value="history">내 요청 이력</TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">전산장비 요청</CardTitle>
            </CardHeader>
            <CardContent>
              <EquipmentForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              {(myRequests ?? []).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">요청 이력이 없습니다</p>
              ) : (
                <div className="space-y-2">
                  {myRequests!.map((req) => {
                    const st = statusMap[req.status] ?? { label: req.status, variant: 'secondary' as const }
                    return (
                      <div key={req.id} className="flex items-center justify-between gap-2 py-3 border-b border-gray-50 last:border-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-800 truncate">{req.title}</span>
                            {req.urgency === 'urgent' && (
                              <Badge variant="destructive" className="text-[10px] py-0">긴급</Badge>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {requestTypeLabel[req.request_type] ?? req.request_type}
                            {req.floor ? ` · ${req.floor}층` : ''}
                            {' · '}{formatDate(req.created_at)}
                          </div>
                        </div>
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
