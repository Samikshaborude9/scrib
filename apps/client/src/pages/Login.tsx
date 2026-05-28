import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useAuthStore } from '../store/useStore'
import { login } from '../services/auth-service'

export default function Login() {
  const navigate = useNavigate()
  const setAuth  = useAuthStore(s => s.setAuth)

  const [form, setForm]     = useState({ email: '', password: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await login(form)
      setAuth(data.user, data.token)
      navigate('/lobby')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070b0a] px-4 font-['Inter']">

      {/* background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px]" viewBox="0 0 700 220" fill="none">
          <defs>
            <filter id="g1"><feGaussianBlur stdDeviation="30"/></filter>
            <linearGradient id="gl1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#0a2e22"/>
              <stop offset="50%"  stopColor="#1de9b6"/>
              <stop offset="100%" stopColor="#0a2e22"/>
            </linearGradient>
          </defs>
          <ellipse cx="350" cy="120" rx="300" ry="60" fill="url(#gl1)" filter="url(#g1)" opacity=".35"/>
        </svg>
        {['25%','50%','75%'].map(left => (
          <div key={left} className="absolute inset-y-0 w-px bg-white/[0.04]" style={{ left }}/>
        ))}
      </div>

      {/* card */}
      <div className="relative w-full max-w-[400px] rounded-2xl border border-white/[0.08] bg-white/[0.025] backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.07)]">

        {/* header */}
        <div className="flex items-center justify-between px-7 pt-6">
          <span className="font-['Plus_Jakarta_Sans'] font-extrabold text-xl text-white">
            Code<span className="text-[#5ed29c]">Nest</span>
          </span>
          <span className="text-[10px] tracking-[.15em] uppercase text-white/25">Sign in</span>
        </div>

        {/* title */}
        <div className="px-7 pt-5 pb-1">
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-sm text-white/40 mt-1">Log in to continue playing</p>
        </div>

        {/* form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-7 pt-5 pb-7">

          {error && (
            <div className="text-xs text-[#ff6b6b] bg-[rgba(255,107,107,0.08)] border border-[rgba(255,107,107,0.2)] rounded-lg px-3 py-2.5">
              {error}
            </div>
          )}

          {/* email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold tracking-[.14em] uppercase text-white/45">
              Email
            </label>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full bg-white/[.04] border border-white/10 rounded-[10px] px-3.5 py-[11px] text-sm text-white placeholder:text-white/20 outline-none focus:border-[rgba(94,210,156,0.45)] focus:bg-[rgba(94,210,156,0.04)] transition-colors"
            />
          </div>

          {/* password */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold tracking-[.14em] uppercase text-white/45">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-[11px] text-white/35 hover:text-[#5ed29c] transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full bg-white/[.04] border border-white/10 rounded-[10px] px-3.5 py-[11px] text-sm text-white placeholder:text-white/20 outline-none focus:border-[rgba(94,210,156,0.45)] focus:bg-[rgba(94,210,156,0.04)] transition-colors"
            />
          </div>

          {/* submit */}
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-full bg-[#5ed29c] text-[#070b0a] text-[13px] font-bold uppercase tracking-[.1em] border-none cursor-pointer hover:opacity-90 disabled:opacity-50 transition-opacity mt-1"
          >
            <ArrowRight size={15} strokeWidth={2.5}/>
            {loading ? 'Logging in…' : 'Log in'}
          </button>

          {/* divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/[.08]"/>
            <span className="text-[11px] text-white/20">or continue with</span>
            <div className="flex-1 h-px bg-white/[.08]"/>
          </div>

          {/* google */}
          <button
            type="button"
            className="flex items-center justify-center gap-2.5 w-full py-2.5 rounded-[10px] bg-white/[.04] border border-white/[.08] text-[13px] font-semibold text-white/70 hover:bg-white/[.07] transition-colors cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* switch */}
          <p className="text-center text-xs text-white/30">
            No account?{' '}
            <Link to="/signup" className="text-[#5ed29c] font-semibold hover:underline">
              Sign up free
            </Link>
          </p>

        </form>
      </div>
    </div>
  )
}