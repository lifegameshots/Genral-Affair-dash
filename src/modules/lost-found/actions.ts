'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function reportLostItem(data: {
  item_name: string
  category: string
  lost_floor: number | null
  lost_location: string | null
  description: string | null
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const { error } = await supabase.from('lost_items').insert({
    reporter_id: user.id,
    item_name: data.item_name,
    category: data.category,
    lost_floor: data.lost_floor,
    lost_location: data.lost_location,
    description: data.description,
    status: 'reported',
  })

  if (error) return { error: '등록에 실패했습니다.' }
  revalidatePath('/lost-found')
  return { success: true }
}

export async function reportFoundItem(data: {
  item_name: string
  category: string
  found_floor: number
  found_location: string | null
  storage_location: string | null
  description: string | null
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const { error } = await supabase.from('found_items').insert({
    reporter_id: user.id,
    item_name: data.item_name,
    category: data.category,
    found_floor: data.found_floor,
    found_location: data.found_location,
    storage_location: data.storage_location,
    description: data.description,
    status: 'registered',
  })

  if (error) return { error: '등록에 실패했습니다.' }
  revalidatePath('/lost-found')
  return { success: true }
}

export async function updateFoundItemStatus(id: string, status: string, matched_lost_id?: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('found_items')
    .update({ status, ...(matched_lost_id ? { claimed_by: matched_lost_id } : {}) })
    .eq('id', id)

  if (error) return { error: '업데이트 실패' }
  revalidatePath('/admin/lost-found')
  return { success: true }
}

export async function updateLostItemStatus(id: string, status: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('lost_items')
    .update({ status })
    .eq('id', id)

  if (error) return { error: '업데이트 실패' }
  revalidatePath('/admin/lost-found')
  return { success: true }
}
