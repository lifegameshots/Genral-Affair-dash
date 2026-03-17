'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitTemperatureComplaint(data: {
  floor: number
  feeling: 'hot' | 'cold'
  memo: string | null
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const { error } = await supabase.from('temperature_complaints').insert({
    reporter_id: user.id,
    floor: data.floor,
    feeling: data.feeling,
    memo: data.memo,
    status: 'submitted',
  })

  if (error) return { error: '민원 등록에 실패했습니다.' }
  revalidatePath('/temperature')
  return { success: true }
}

export async function updateTemperatureComplaintStatus(id: string, status: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('temperature_complaints')
    .update({ status })
    .eq('id', id)
  if (error) return { error: '업데이트 실패' }
  revalidatePath('/admin/temperature')
  return { success: true }
}

export async function setTargetTemperature(data: {
  floor: number
  target_temp: number
  zone: string | null
}) {
  const supabase = await createClient()
  const { error } = await supabase.from('temperature_readings').insert({
    floor: data.floor,
    zone: data.zone,
    target_temp: data.target_temp,
    current_temp: null,
    recorded_at: new Date().toISOString(),
  })
  if (error) return { error: '온도 설정 실패' }
  revalidatePath('/admin/temperature')
  return { success: true }
}
