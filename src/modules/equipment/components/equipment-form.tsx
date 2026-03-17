'use client'

import { useTransition, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createEquipmentRequest } from '../actions'

const requestTypes = [
  { value: 'inspection', label: '점검 요청' },
  { value: 'replacement', label: '교체 요청' },
  { value: 'purchase', label: '구매 요청' },
  { value: 'software_purchase', label: 'SW 구입 문의' },
  { value: 'network_inspection', label: '네트워크 점검' },
]

export function EquipmentForm() {
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({
    request_type: 'inspection',
    title: '',
    description: '',
    urgency: 'normal',
    floor: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) {
      toast.error('제목을 입력해주세요.')
      return
    }
    startTransition(async () => {
      const result = await createEquipmentRequest({
        request_type: form.request_type,
        title: form.title,
        description: form.description,
        urgency: form.urgency,
        floor: form.floor ? parseInt(form.floor) : null,
      })
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('요청이 등록되었습니다.')
        setForm({ request_type: 'inspection', title: '', description: '', urgency: 'normal', floor: '' })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>요청 유형</Label>
        <select
          name="request_type"
          value={form.request_type}
          onChange={handleChange}
          className="mt-1 h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {requestTypes.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="eq-title">제목 *</Label>
        <Input
          id="eq-title"
          name="title"
          placeholder="요청 내용을 간략히 작성하세요"
          value={form.title}
          onChange={handleChange}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="eq-description">상세 설명</Label>
        <Textarea
          id="eq-description"
          name="description"
          placeholder="장비 정보, 증상 등 자세한 내용을 입력하세요"
          value={form.description}
          onChange={handleChange}
          className="mt-1"
          rows={4}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
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
        <div>
          <Label htmlFor="eq-floor">층수</Label>
          <Input
            id="eq-floor"
            name="floor"
            type="number"
            min={1}
            max={41}
            placeholder="예: 10"
            value={form.floor}
            onChange={handleChange}
            className="mt-1"
          />
        </div>
      </div>
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? '등록 중...' : '요청 등록'}
      </Button>
    </form>
  )
}
