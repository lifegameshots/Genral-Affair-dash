import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LostForm } from '@/modules/lost-found/components/lost-form'
import { FoundForm } from '@/modules/lost-found/components/found-form'
import { formatDate } from '@/lib/utils'
import { Search } from 'lucide-react'

const lostStatusMap: Record<string, { label: string; variant: 'info' | 'success' | 'secondary' | 'warning' }> = {
  reported: { label: '신고됨', variant: 'info' },
  matched: { label: '매칭됨', variant: 'warning' },
  claimed: { label: '찾았음', variant: 'success' },
  closed: { label: '종료', variant: 'secondary' },
}

const foundStatusMap: Record<string, { label: string; variant: 'info' | 'success' | 'secondary' | 'warning' }> = {
  registered: { label: '등록됨', variant: 'info' },
  matched: { label: '매칭됨', variant: 'warning' },
  claimed: { label: '수령완료', variant: 'success' },
  disposed: { label: '폐기됨', variant: 'secondary' },
}

const categoryLabel: Record<string, string> = {
  electronics: '전자기기',
  clothing: '의류/잡화',
  wallet_card: '지갑/카드',
  other: '기타',
}

export default async function LostFoundPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: myLostItems }, { data: myFoundItems }] = await Promise.all([
    supabase
      .from('lost_items')
      .select('id, item_name, category, lost_floor, lost_location, status, created_at')
      .eq('reporter_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('found_items')
      .select('id, item_name, category, found_floor, found_location, storage_location, status, created_at')
      .eq('reporter_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Search className="w-5 h-5 text-gray-700" />
        <h1 className="text-xl font-bold text-gray-900">분실물</h1>
      </div>

      <Tabs defaultValue="lost">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="lost">분실 신고</TabsTrigger>
          <TabsTrigger value="found">습득물 신고</TabsTrigger>
          <TabsTrigger value="history">내 신고 이력</TabsTrigger>
        </TabsList>

        <TabsContent value="lost" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">분실물 신고</CardTitle>
            </CardHeader>
            <CardContent>
              <LostForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="found" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">습득물 신고</CardTitle>
            </CardHeader>
            <CardContent>
              <FoundForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4 space-y-4">
          {/* Lost items history */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-gray-800">내 분실 신고</CardTitle>
            </CardHeader>
            <CardContent>
              {(myLostItems ?? []).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">신고 이력이 없습니다</p>
              ) : (
                <div className="space-y-2">
                  {myLostItems!.map((item) => {
                    const st = lostStatusMap[item.status] ?? { label: item.status, variant: 'secondary' as const }
                    return (
                      <div key={item.id} className="flex items-center justify-between gap-2 py-2 border-b border-gray-50 last:border-0">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-800">{item.item_name}</div>
                          <div className="text-xs text-gray-400">
                            {categoryLabel[item.category] ?? item.category}
                            {item.lost_floor ? ` · ${item.lost_floor}층` : ''}
                            {item.lost_location ? ` · ${item.lost_location}` : ''}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant={st.variant}>{st.label}</Badge>
                          <span className="text-xs text-gray-400">{formatDate(item.created_at)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Found items history */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-gray-800">내 습득물 신고</CardTitle>
            </CardHeader>
            <CardContent>
              {(myFoundItems ?? []).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">신고 이력이 없습니다</p>
              ) : (
                <div className="space-y-2">
                  {myFoundItems!.map((item) => {
                    const st = foundStatusMap[item.status] ?? { label: item.status, variant: 'secondary' as const }
                    return (
                      <div key={item.id} className="flex items-center justify-between gap-2 py-2 border-b border-gray-50 last:border-0">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-800">{item.item_name}</div>
                          <div className="text-xs text-gray-400">
                            {categoryLabel[item.category] ?? item.category}
                            {item.found_floor ? ` · ${item.found_floor}층` : ''}
                            {item.storage_location ? ` · 보관: ${item.storage_location}` : ''}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant={st.variant}>{st.label}</Badge>
                          <span className="text-xs text-gray-400">{formatDate(item.created_at)}</span>
                        </div>
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
