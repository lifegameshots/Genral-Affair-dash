'use client'

import { useTransition, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createComplaint } from '../actions'

const categories = [
  { value: 'facility', label: '시설' },
  { value: 'living_environment', label: '생활환경' },
  { value: 'welfare', label: '복지' },
  { value: 'it', label: 'IT' },
  { value: 'other', label: '기타' },
]

export function ComplaintForm() {
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({
    category: 'other',
    title: '',
    description: '',
    is_anonymous: false,
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const target = e.target
    if (target instanceof HTMLInputElement && target.type === 'checkbox') {
      setForm(prev => ({ ...prev, [target.name]: target.checked }))
    } else {
      setForm(prev => ({ ...prev, [target.name]: target.value }))
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.description.trim()) {
      toast.error('제목과 내용을 입력해주세요.')
      return
    }
    startTransition(async () => {
      const result = await createComplaint({
        category: form.category,
        title: form.title,
        description: form.description,
        is_anonymous: form.is_anonymous,
      })
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('건의사항이 등록되었습니다.')
        setForm({ category: 'other', title: '', description: '', is_anonymous: false })
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
      <div>
        <Label htmlFor="complaint-title">제목 *</Label>
        <Input
          id="complaint-title"
          name="title"
          placeholder="건의 제목을 입력하세요"
          value={form.title}
          onChange={handleChange}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="complaint-desc">내용 *</Label>
        <Textarea
          id="complaint-desc"
          name="description"
          placeholder="건의 내용을 자세히 입력하세요"
          value={form.description}
          onChange={handleChange}
          className="mt-1"
          rows={5}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is_anonymous"
          name="is_anonymous"
          checked={form.is_anonymous}
          onChange={handleChange}
          className="rounded border-gray-300 w-4 h-4"
        />
        <Label htmlFor="is_anonymous" className="cursor-pointer">익명으로 제출</Label>
      </div>
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? '등록 중...' : '건의사항 등록'}
      </Button>
    </form>
  )
}
