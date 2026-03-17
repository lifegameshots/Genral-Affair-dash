'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { timeAgo } from '@/lib/utils'
import { markNotificationRead } from '@/modules/notification/actions'
import type { Notification } from '@/types/database'

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const supabase = createClient()

    async function fetchNotifications() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (data) {
        setNotifications(data as Notification[])
        setUnreadCount(data.filter((n) => !n.is_read).length)
      }
    }

    fetchNotifications()
  }, [])

  const typeIcon: Record<string, string> = {
    parcel_arrival: '📦',
    parcel_reminder: '📦',
    request_status: '📋',
    temperature: '🌡️',
    complaint_response: '💬',
    system: '🔔',
  }

  async function handleRead(id: string) {
    await markNotificationRead(id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    )
    setUnreadCount((c) => Math.max(0, c - 1))
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-4 h-4 text-gray-500" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          {/* Dropdown */}
          <div className="absolute left-0 bottom-full mb-2 w-72 bg-white rounded-xl shadow-lg border border-gray-100 z-20 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
              <span className="text-sm font-semibold text-gray-900">알림</span>
              {unreadCount > 0 && (
                <span className="text-xs text-blue-600">{unreadCount}개 미읽음</span>
              )}
            </div>
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-400">알림이 없습니다</div>
            ) : (
              <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${!n.is_read ? 'bg-blue-50/50' : ''}`}
                    onClick={() => handleRead(n.id)}
                  >
                    <span className="text-lg mt-0.5 shrink-0">{typeIcon[n.type] ?? '🔔'}</span>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm ${!n.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'} truncate`}>
                        {n.title}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5 truncate">{n.message}</div>
                      <div className="text-[11px] text-gray-400 mt-1">{timeAgo(n.created_at)}</div>
                    </div>
                    {!n.is_read && (
                      <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="px-4 py-2.5 border-t border-gray-50">
              <Link
                href="/notifications"
                className="text-xs text-blue-600 hover:underline"
                onClick={() => setIsOpen(false)}
              >
                전체 알림 보기 →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
