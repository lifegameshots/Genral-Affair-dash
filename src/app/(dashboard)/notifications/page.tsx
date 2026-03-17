import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { timeAgo } from '@/lib/utils'
import { markAllNotificationsRead, markNotificationRead } from '@/modules/notification/actions'
import type { Notification } from '@/types/database'
import { Bell } from 'lucide-react'

const typeIcon: Record<string, string> = {
  parcel_arrival: '📦',
  parcel_reminder: '📦',
  request_status: '📋',
  temperature: '🌡️',
  complaint_response: '💬',
  system: '🔔',
}

const typeLabel: Record<string, string> = {
  parcel_arrival: '택배 도착',
  parcel_reminder: '택배 독촉',
  request_status: '요청 상태 변경',
  temperature: '온도 알림',
  complaint_response: '불편사항 답변',
  system: '시스템',
}

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const unreadCount = (notifications ?? []).filter((n) => !n.is_read).length

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-gray-700" />
          <h1 className="text-xl font-bold text-gray-900">알림</h1>
          {unreadCount > 0 && (
            <Badge variant="info">{unreadCount}개 미읽음</Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <form action={async () => { 'use server'; await markAllNotificationsRead() }}>
            <Button type="submit" variant="outline" size="sm" className="text-xs">
              전체 읽음 처리
            </Button>
          </form>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {(notifications ?? []).length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">알림이 없습니다</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {(notifications as Notification[]).map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-4 p-4 ${!n.is_read ? 'bg-blue-50/50' : ''}`}
                >
                  <span className="text-xl mt-0.5 shrink-0">{typeIcon[n.type] ?? '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-[10px] py-0">
                        {typeLabel[n.type] ?? n.type}
                      </Badge>
                      {!n.is_read && (
                        <Badge variant="info" className="text-[10px] py-0">미읽음</Badge>
                      )}
                    </div>
                    <div className={`text-sm ${!n.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                      {n.title}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{n.message}</div>
                    <div className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</div>
                  </div>
                  {!n.is_read && (
                    <form action={async () => { 'use server'; await markNotificationRead(n.id) }}>
                      <button
                        type="submit"
                        className="text-xs text-blue-600 hover:underline whitespace-nowrap shrink-0"
                      >
                        읽음
                      </button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
