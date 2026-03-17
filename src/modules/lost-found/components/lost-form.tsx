'use client'

import { useTransition, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { reportLostItem } from '../actions'

export function LostForm() {
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({
    item_name: '',
    category: 'other',
    lost_floor: '',
    lost_location: '',
    description: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.item_name.trim()) {
      toast.error('물건 이름을 입력해주세요.')
      return
    }
    startTransition(async () => {
      const result = await reportLostItem({
        item_name: form.item_name,
        category: form.category,
        lost_floor: form.lost_floor ? parseInt(form.lost_floor) : null,
        lost_location: form.lost_location || null,
        description: form.description || null,
      })
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('분실 신고가 등록되었습니다.')
        setForm({ item_name: '', category: 'other', lost_floor: '', lost_location: '', description: '' })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="item_name">물건 이름 *</Label>
        <Input
          id="item_name"
          name="item_name"
          placeholder="예: 검정 지갑, 에어팟 케이스"
          value={form.item_name}
          onChange={handleChange}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="category">카테고리</Label>
        <select
          id="category"
          name="category"
          value={form.category}
          onChange={handleChange}
          className="mt-1 h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="electronics">전자기기</option>
          <option value="clothing">의류/잡화</option>
          <option value="wallet_card">지갑/카드</option>
          <option value="other">기타</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="lost_floor">분실 층</Label>
          <Input
            id="lost_floor"
            name="lost_floor"
            type="number"
            min={1}
            max={41}
            placeholder="예: 5"
            value={form.lost_floor}
            onChange={handleChange}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="lost_location">분실 위치</Label>
          <Input
            id="lost_location"
            name="lost_location"
            placeholder="예: 회의실 A, 엘리베이터"
            value={form.lost_location}
            onChange={handleChange}
            className="mt-1"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="description">상세 설명</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="물건의 특징, 분실 시간 등 자세히 입력해주세요"
          value={form.description}
          onChange={handleChange}
          className="mt-1"
          rows={3}
        />
      </div>
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? '등록 중...' : '분실 신고 등록'}
      </Button>
    </form>
  )
}
