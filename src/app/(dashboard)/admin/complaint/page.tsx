import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { updateComplaintStatus, respondToComplaint } from '@/modules/complaint/actions'
import { formatDate } from '@/lib/utils'

const statusOptions = [
  { value: 'submitted', label: '접수됨' },
  { value: 'reviewing', label: '검토중' },
  { value: 'in_progress', label: '처리중' },
  { value: 'completed', label: '완료' },
  { value: 'rejected', label: '반려' },
]

const statusBadge: Record<string, 'info' | 'warning' | 'success' | 'destructive' | 'secondary'> = {
  submitted: 'info', reviewing: 'warning', in_progress: 'warning', completed: 'success', rejected: 'destructive',
}

const categoryLabel: Record<string, string> = {
  facility: '시설', living_environment: '생활환경', welfare: '복지', it: 'IT', other: '기타',
}

export default async function AdminComplaintPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: complaints } = await supabase
    .from('complaints')
    .select('id, reporter_id, is_anonymous, category, title, description, status, response, responded_at, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-gray-900">불편사항 관리</h1>

      <div className="space-y-3">
        {(complaints ?? []).length === 0 ? (
          <Card>
            <CardContent className="text-center py-8 text-sm text-gray-400">건의사항이 없습니다</CardContent>
          </Card>
        ) : (
          complaints!.map((c) => {
            const st = statusBadge[c.status] ?? 'secondary'
            return (
              <Card key={c.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <Badge variant="outline" className="text-xs">{categoryLabel[c.category] ?? c.category}</Badge>
                        {c.is_anonymous && <Badge variant="secondary" className="text-xs">익명</Badge>}
                        <Badge variant={st}>
                          {statusOptions.find(o => o.value === c.status)?.label ?? c.status}
                        </Badge>
                        <span className="text-xs text-gray-400">{formatDate(c.created_at)}</span>
                      </div>
                      <div className="text-sm font-semibold text-gray-900 mb-1">{c.title}</div>
                      <div className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-3">{c.description}</div>
                      {c.response && (
                        <div className="mt-2 p-2 bg-green-50 rounded-lg text-xs text-green-700">
                          <span className="font-semibold">답변:</span> {c.response}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 flex flex-col gap-2 min-w-[160px]">
                      {/* Status change */}
                      <form action={async (fd) => {
                        'use server'
                        await updateComplaintStatus(c.id, fd.get('status') as string)
                      }}>
                        <select
                          name="status"
                          defaultValue={c.status}
                          className="h-8 w-full rounded border border-gray-200 bg-white px-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {statusOptions.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                        <button type="submit" className="mt-1 text-xs text-blue-600 hover:underline w-full text-right">상태 변경</button>
                      </form>
                    </div>
                  </div>

                  {/* Response form */}
                  <form action={async (fd) => {
                    'use server'
                    const response = fd.get('response') as string
                    if (!response?.trim()) return
                    await respondToComplaint(c.id, response, 'completed')
                  }} className="mt-3 flex gap-2">
                    <input
                      name="response"
                      defaultValue={c.response ?? ''}
                      placeholder="답변을 입력하세요..."
                      className="flex-1 h-9 rounded-md border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      className="px-3 h-9 rounded-md bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors shrink-0"
                    >
                      답변 등록
                    </button>
                  </form>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
