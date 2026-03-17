'use client'

import { useTransition, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { reportFoundItem } from '../actions'

export function FoundForm() {
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({
    item_name: '',
    category: 'other',
    found_floor: '',
    found_location: '',
    storage_location: '',
    description: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.item_name.trim() || !form.found_floor) {
      toast.error('물건 이름과 발견 층수를 입력해주세요.')
      return
    }
    startTransition(async () => {
      const result = await reportFoundItem({
        item_name: form.item_name,
        category: form.category,
        found_floor: parseInt(form.found_floor),
        found_location: form.found_location || null,
        storage_location: form.storage_location || null,
        description: form.description || null,
      })
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('습득물 신고가 등록되었습니다.')
        setForm({ item_name: '', category: 'other', found_floor: '', found_location: '', storage_location: '', description: '' })
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
          placeholder="예: 검정 지갑, USB"
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
          <Label htmlFor="found_floor">발견 층 *</Label>
          <Input
            id="found_floor"
            name="found_floor"
            type="number"
            min={1}
            max={41}
            placeholder="예: 10"
            value={form.found_floor}
            onChange={handleChange}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="found_location">발견 위치</Label>
          <Input
            id="found_location"
            name="found_location"
            placeholder="예: 화장실 앞, 탕비실"
            value={form.found_location}
            onChange={handleChange}
            className="mt-1"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="storage_location">보관 위치</Label>
        <Input
          id="storage_location"
          name="storage_location"
          placeholder="예: 총무팀 서랍, 경비실"
          value={form.storage_location}
          onChange={handleChange}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="description">상세 설명</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="물건 외형 특징 등을 입력해주세요"
          value={form.description}
          onChange={handleChange}
          className="mt-1"
          rows={3}
        />
      </div>
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? '등록 중...' : '습득물 신고 등록'}
      </Button>
    </form>
  )
}
