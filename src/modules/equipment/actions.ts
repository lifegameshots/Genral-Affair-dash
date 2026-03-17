'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createEquipmentRequest(data: {
  request_type: string
  title: string
  description: string
  urgency: string
  floor: number | null
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const { error } = await supabase.from('equipment_requests').insert({
    requester_id: user.id,
    request_type: data.request_type,
    title: data.title,
    description: data.description,
    urgency: data.urgency,
    floor: data.floor,
    status: 'submitted',
    attachments: [],
  })

  if (error) return { error: '요청 등록에 실패했습니다.' }
  revalidatePath('/equipment')
  return { success: true }
}

export async function updateEquipmentRequestStatus(id: string, status: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('equipment_requests')
    .update({ status })
    .eq('id', id)
  if (error) return { error: '업데이트 실패' }
  revalidatePath('/admin/equipment')
  return { success: true }
}

export async function assignEquipmentRequest(id: string, assigned_to: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('equipment_requests')
    .update({ assigned_to })
    .eq('id', id)
  if (error) return { error: '배정 실패' }
  revalidatePath('/admin/equipment')
  return { success: true }
}
