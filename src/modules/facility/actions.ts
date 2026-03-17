'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createFacilityRequest(data: {
  category: string
  floor: number
  location_detail: string
  description: string
  urgency: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const { error } = await supabase.from('facility_requests').insert({
    requester_id: user.id,
    category: data.category,
    floor: data.floor,
    location_detail: data.location_detail,
    description: data.description,
    urgency: data.urgency,
    status: 'submitted',
  })

  if (error) return { error: '요청 등록에 실패했습니다.' }
  revalidatePath('/facility')
  return { success: true }
}

export async function updateFacilityStatus(id: string, status: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('facility_requests')
    .update({ status })
    .eq('id', id)
  if (error) return { error: '업데이트 실패' }
  revalidatePath('/admin/facility')
  return { success: true }
}

export async function assignFacilityVendor(id: string, vendor: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('facility_requests')
    .update({ vendor, status: 'vendor_assigned' })
    .eq('id', id)
  if (error) return { error: '외주 배정 실패' }
  revalidatePath('/admin/facility')
  return { success: true }
}
