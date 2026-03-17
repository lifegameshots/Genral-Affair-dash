import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import type { UserRole } from '@/types/database'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile for role and name
  const { data: profile } = await supabase
    .from('users')
    .select('name, role, avatar_url, email')
    .eq('id', user.id)
    .single()

  const userRole: UserRole = (profile?.role as UserRole) ?? 'employee'
  const userName: string = profile?.name ?? user.email ?? ''
  const userEmail: string = profile?.email ?? user.email ?? ''
  const avatarUrl: string | null = profile?.avatar_url ?? null

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar
        userRole={userRole}
        userName={userName}
        userEmail={userEmail}
        avatarUrl={avatarUrl}
      />
      <main className="flex-1 overflow-auto min-w-0">
        {children}
      </main>
    </div>
  )
}
