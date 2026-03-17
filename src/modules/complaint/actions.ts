'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createComplaint(data: {
  category: string
  title: string
  description: string
  is_anonymous: boolean
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const { error } = await supabase.from('complaints').insert({
    reporter_id: user.id,
    is_anonymous: data.is_anonymous,
    category: data.category,
    title: data.title,
    description: data.description,
    attachments: [],
    status: 'submitted',
  })

  if (error) return { error: '등록에 실패했습니다.' }
  revalidatePath('/complaint')
  return { success: true }
}

export async function updateComplaintStatus(id: string, status: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('complaints')
    .update({ status })
    .eq('id', id)
  if (error) return { error: '업데이트 실패' }
  revalidatePath('/admin/complaint')
  return { success: true }
}

export async function respondToComplaint(id: string, response: string, status: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('complaints')
    .update({ response, status, responded_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: '답변 등록 실패' }
  revalidatePath('/admin/complaint')
  return { success: true }
}

export async function assignComplaint(id: string, assigned_to: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('complaints')
    .update({ assigned_to })
    .eq('id', id)
  if (error) return { error: '배정 실패' }
  revalidatePath('/admin/complaint')
  return { success: true }
}
