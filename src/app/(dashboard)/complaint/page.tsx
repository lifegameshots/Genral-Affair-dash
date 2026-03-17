import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ComplaintForm } from '@/modules/complaint/components/complaint-form'
import { formatDate } from '@/lib/utils'
import { MessageSquare } from 'lucide-react'

const statusMap: Record<string, { label: string; variant: 'info' | 'warning' | 'success' | 'destructive' | 'secondary' }> = {
  submitted: { label: '접수됨', variant: 'info' },
  reviewing: { label: '검토중', variant: 'warning' },
  in_progress: { label: '처리중', variant: 'warning' },
  completed: { label: '완료', variant: 'success' },
  rejected: { label: '반려', variant: 'destructive' },
}

const categoryLabel: Record<string, string> = {
  facility: '시설',
  living_environment: '생활환경',
  welfare: '복지',
  it: 'IT',
  other: '기타',
}

export default async function ComplaintPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: myComplaints } = await supabase
    .from('complaints')
    .select('id, category, title, description, is_anonymous, status, response, responded_at, created_at')
    .eq('reporter_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <MessageSquare className="w-5 h-5 text-gray-700" />
        <h1 className="text-xl font-bold text-gray-900">불편사항 건의</h1>
      </div>

      <Tabs defaultValue="new">
        <TabsList>
          <TabsTrigger value="new">건의 등록</TabsTrigger>
          <TabsTrigger value="history">내 건의 이력</TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">불편사항 / 건의사항 등록</CardTitle>
            </CardHeader>
            <CardContent>
              <ComplaintForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <div className="space-y-3">
            {(myComplaints ?? []).length === 0 ? (
              <Card>
                <CardContent className="text-center py-8 text-sm text-gray-400">
                  건의 이력이 없습니다
                </CardContent>
              </Card>
            ) : (
              myComplaints!.map((c) => {
                const st = statusMap[c.status] ?? { label: c.status, variant: 'secondary' as const }
                return (
                  <Card key={c.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">{categoryLabel[c.category] ?? c.category}</Badge>
                          {c.is_anonymous && <Badge variant="secondary" className="text-xs">익명</Badge>}
                          <Badge variant={st.variant}>{st.label}</Badge>
                        </div>
                        <span className="text-xs text-gray-400 shrink-0">{formatDate(c.created_at)}</span>
                      </div>
                      <div className="text-sm font-semibold text-gray-900 mb-1">{c.title}</div>
                      <div className="text-sm text-gray-600 whitespace-pre-wrap">{c.description}</div>
                      {c.response && (
                        <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-100">
                          <div className="text-xs font-semibold text-green-700 mb-1">담당자 답변</div>
                          <div className="text-sm text-green-800">{c.response}</div>
                          {c.responded_at && (
                            <div className="text-xs text-green-500 mt-1">{formatDate(c.responded_at)}</div>
                          )}
                        </div>
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
