'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function claimParcel(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const { error } = await supabase
    .from('parcels')
    .update({ status: 'claimed', claimed_at: new Date().toISOString() })
    .eq('id', id)
    .eq('recipient_id', user.id)

  if (error) return { error: '수령 처리에 실패했습니다.' }
  revalidatePath('/parcel')
  return { success: true }
}

export async function registerParcel(data: {
  recipient_name: string
  carrier: string | null
  tracking_number: string | null
  storage_location: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  // Try to find recipient by name
  const { data: recipientUser } = await supabase
    .from('users')
    .select('id')
    .eq('name', data.recipient_name)
    .single()

  const { error } = await supabase.from('parcels').insert({
    recipient_id: recipientUser?.id ?? null,
    recipient_name: data.recipient_name,
    carrier: data.carrier,
    tracking_number: data.tracking_number,
    storage_location: data.storage_location,
    registered_by: user.id,
    status: 'stored',
    reminder_count: 0,
  })

  if (error) return { error: '택배 등록에 실패했습니다.' }
  revalidatePath('/admin/parcel')
  return { success: true }
}

export async function notifyParcel(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('parcels')
    .update({ status: 'notified' })
    .eq('id', id)
  if (error) return { error: '알림 처리 실패' }
  revalidatePath('/admin/parcel')
  return { success: true }
}

export async function reminderParcel(id: string) {
  const supabase = await createClient()
  // Increment reminder_count
  const { data: parcel } = await supabase
    .from('parcels')
    .select('reminder_count')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('parcels')
    .update({ reminder_count: (parcel?.reminder_count ?? 0) + 1 })
    .eq('id', id)
  if (error) return { error: '독촉 처리 실패' }
  revalidatePath('/admin/parcel')
  return { success: true }
}
