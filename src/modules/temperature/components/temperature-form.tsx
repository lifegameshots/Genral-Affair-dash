'use client'

import { useTransition, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { submitTemperatureComplaint } from '../actions'

interface TemperatureFormProps {
  userFloor: number | null
}

export function TemperatureForm({ userFloor }: TemperatureFormProps) {
  const [isPending, startTransition] = useTransition()
  const [feeling, setFeeling] = useState<'hot' | 'cold' | null>(null)
  const [memo, setMemo] = useState('')

  function handleSubmit(selectedFeeling: 'hot' | 'cold') {
    const floor = userFloor
    if (!floor) {
      toast.error('층수 정보가 없습니다. 프로필에서 층수를 설정해주세요.')
      return
    }
    startTransition(async () => {
      const result = await submitTemperatureComplaint({
        floor,
        feeling: selectedFeeling,
        memo: memo || null,
      })
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(selectedFeeling === 'hot' ? '덥다고 신고했습니다 🥵' : '춥다고 신고했습니다 🥶')
        setMemo('')
        setFeeling(null)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* One-touch buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          disabled={isPending}
          onClick={() => handleSubmit('hot')}
          className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-red-100 bg-red-50 hover:border-red-300 hover:bg-red-100 transition-all disabled:opacity-50"
        >
          <span className="text-5xl">🥵</span>
          <span className="text-base font-semibold text-red-700">덥다</span>
          {userFloor && <span className="text-xs text-red-400">{userFloor}층 온도 민원</span>}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => handleSubmit('cold')}
          className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-blue-100 bg-blue-50 hover:border-blue-300 hover:bg-blue-100 transition-all disabled:opacity-50"
        >
          <span className="text-5xl">🥶</span>
          <span className="text-base font-semibold text-blue-700">춥다</span>
          {userFloor && <span className="text-xs text-blue-400">{userFloor}층 온도 민원</span>}
        </button>
      </div>

      {!userFloor && (
        <p className="text-sm text-amber-600 bg-amber-50 rounded-lg p-3 text-center">
          ⚠️ 층수 정보가 없습니다. 프로필에서 층수를 설정해주세요.
        </p>
      )}

      <div>
        <Label htmlFor="memo">메모 (선택)</Label>
        <Textarea
          id="memo"
          placeholder="추가 의견을 입력해주세요"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          className="mt-1"
          rows={2}
        />
      </div>
    </div>
  )
}
