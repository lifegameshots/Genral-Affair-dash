'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Building2, Loader2, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  function switchMode(next: 'login' | 'signup') {
    setMode(next)
    setError(null)
    setSuccess(null)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const supabase = createClient()

    if (mode === 'login') {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) {
        setError(
          authError.message === 'Invalid login credentials'
            ? '이메일 또는 비밀번호가 올바르지 않습니다.'
            : '로그인 중 오류가 발생했습니다. 다시 시도해 주세요.'
        )
        setLoading(false)
        return
      }
      router.push('/dashboard')
      router.refresh()
    } else {
      if (!name.trim()) {
        setError('이름을 입력해주세요.')
        setLoading(false)
        return
      }
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      })
      if (authError) {
        setError(authError.message === 'User already registered'
          ? '이미 가입된 이메일입니다.'
          : '가입 중 오류가 발생했습니다.')
        setLoading(false)
        return
      }
      // Insert into public.users
      if (data.user) {
        await supabase.from('users').upsert({
          id: data.user.id,
          email: data.user.email!,
          name: name.trim(),
          role: 'employee',
        })
      }
      setSuccess('가입이 완료됐습니다! 이메일 인증 후 로그인하거나, 인증이 꺼져 있으면 바로 로그인하세요.')
      setLoading(false)
      switchMode('login')
    }
  }

  return (
    <div className="w-full max-w-md px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 mb-4 shadow-lg shadow-blue-200">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">GA Portal</h1>
          <p className="text-sm text-gray-500 mt-1">총무 업무 통합 포털</p>
        </div>

        {/* Mode tabs */}
        <div className="flex rounded-lg border border-gray-200 p-1 mb-6">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'login' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            로그인
          </button>
          <button
            type="button"
            onClick={() => switchMode('signup')}
            className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'signup' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            회원가입
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div className="space-y-1.5">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">이름</label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                disabled={loading}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">이메일</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
              disabled={loading}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">비밀번호</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? '6자 이상 입력하세요' : '비밀번호를 입력하세요'}
                className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold transition hover:bg-blue-700 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm mt-2"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" />{mode === 'login' ? '로그인 중...' : '가입 중...'}</>
            ) : (
              mode === 'login' ? '로그인' : '회원가입'
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          계정 문의는 IT 지원팀에 연락하세요.
        </p>
      </div>
      <p className="text-center text-xs text-gray-400 mt-4">© 2025 NM Group. All rights reserved.</p>
    </div>
  )
}
