'use client'

import { useTransition, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createFacilityRequest } from '../actions'

const categories = [
  { value: 'lighting', label: '조명' },
  { value: 'furniture', label: '가구' },
  { value: 'door', label: '문/도어' },
  { value: 'plumbing', label: '배관' },
  { value: 'electrical', label: '전기' },
  { value: 'cleaning', label: '청소' },
  { value: 'other', label: '기타' },
]

export function FacilityForm() {
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({
    category: 'other',
    floor: '',
    location_detail: '',
    description: '',
    urgency: 'normal',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.floor || !form.location_detail.trim() || !form.description.trim()) {
      toast.error('층수, 위치, 설명을 모두 입력해주세요.')
      return
    }
    startTransition(async () => {
      const result = await createFacilityRequest({
        category: form.category,
        floor: parseInt(form.floor),
        location_detail: form.location_detail,
        description: form.description,
        urgency: form.urgency,
      })
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('수리 요청이 등록되었습니다.')
        setForm({ category: 'other', floor: '', location_detail: '', description: '', urgency: 'normal' })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>카테고리</Label>
        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          className="mt-1 h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {categories.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fac-floor">층수 *</Label>
          <Input
            id="fac-floor"
            name="floor"
            type="number"
            min={1}
            max={41}
            placeholder="예: 15"
            value={form.floor}
            onChange={handleChange}
            className="mt-1"
          />
        </div>
        <div>
          <Label>긴급도</Label>
          <select
            name="urgency"
            value={form.urgency}
            onChange={handleChange}
            className="mt-1 h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="normal">일반</option>
            <option value="urgent">긴급</option>
          </select>
        </div>
      </div>
      <div>
        <Label htmlFor="fac-location">위치 상세 *</Label>
        <Input
          id="fac-location"
          name="location_detail"
          placeholder="예: 화장실 입구, 회의실 B, 복도 중간"
          value={form.location_detail}
          onChange={handleChange}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="fac-description">증상 설명 *</Label>
        <Textarea
          id="fac-description"
          name="description"
          placeholder="고장 증상이나 수리가 필요한 이유를 자세히 설명해주세요"
          value={form.description}
          onChange={handleChange}
          className="mt-1"
          rows={4}
        />
      </div>
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? '등록 중...' : '수리 요청 등록'}
      </Button>
    </form>
  )
}
