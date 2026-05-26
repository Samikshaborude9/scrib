import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useStore'
import { ArrowRight, Menu, X, Pencil } from 'lucide-react'

// ─── Liquid Glass Card ─────────────────────────────────────────────────────────
function LiquidCard() {
  return (
    <div className="w-[220px] px-6 py-5 translate-y-[-50px] bg-[rgba(255,255,255,0.01)] bg-blend-luminosity backdrop-blur-[4px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.10),0_8px_32px_rgba(0,0,0,0.4)] rounded-2xl border border-white/10 relative overflow-hidden">
      {/* inner glow top edge */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />

      <div className="text-[11px] text-brand-accent font-jakarta font-bold tracking-[2px] mb-2.5">
        [ 2025 ]
      </div>
      <div className="text-base text-white font-semibold leading-tight mb-2 font-syne">
        Taught by{' '}
        <span className="italic text-brand-accent">real</span>{' '}
        players
      </div>
      <div className="text-[11px] text-white/55 leading-relaxed">
        Jump in. Draw something. Beat everyone.
      </div>

      {/* floating pencil icon */}
      <div className="absolute bottom-3.5 right-3.5 w-8 h-8 rounded-full bg-brand-accent/15 flex items-center justify-center border border-brand-accent/30">
        <Pencil size={14} color="#5ed29c" />
      </div>
    </div>
  )
}

// ─── Nav ───────────────────────────────────────────────────────────────────────
const NAV_LINKS = ['ROOMS', 'HOW TO PLAY', 'LEADERBOARD', 'ABOUT']

function Nav({ onEnter }: { onEnter: () => void }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-10 py-6">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-accent flex items-center justify-center">
            <Pencil size={16} color="#070b0a" strokeWidth={2.5} />
          </div>
          <span className="font-syne font-extrabold text-[20px] text-white tracking-[-0.5px]">
            Scribble
          </span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex gap-9 items-center">
          {NAV_LINKS.map(link => (
            <a key={link} href="#" className="font-jakarta text-[12px] font-semibold tracking-[1.5px] text-white/60 no-underline transition-colors duration-200 hover:text-brand-accent">
              {link}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <button onClick={onEnter} className="font-jakarta text-[12px] font-bold tracking-[1px] bg-brand-accent text-brand-dark border-none rounded-full px-[22px] py-[10px] cursor-pointer flex items-center gap-1.5 transition-opacity duration-200 hover:opacity-85">
            PLAY NOW <ArrowRight size={14} />
          </button>
          {/* Hamburger */}
          <button onClick={() => setOpen(true)} className="bg-transparent border-none text-white cursor-pointer p-1 flex md:hidden">
            <Menu size={22} />
          </button>
        </div>
      </header>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-[100] bg-brand-dark flex flex-col p-8">
          <div className="flex justify-between items-center mb-12">
            <span className="font-syne font-extrabold text-[20px] text-white">Scribble</span>
            <button onClick={() => setOpen(false)} className="bg-transparent border-none text-white cursor-pointer">
              <X size={24} />
            </button>
          </div>
          <nav className="flex flex-col gap-8">
            {NAV_LINKS.map(link => (
              <a key={link} href="#" onClick={() => setOpen(false)} className="font-jakarta text-[28px] font-bold text-white/70 no-underline">
                {link}
              </a>
            ))}
          </nav>
          <button onClick={() => { setOpen(false); onEnter() }} className="mt-auto font-jakarta text-[14px] font-bold bg-brand-accent text-brand-dark border-none rounded-full px-7 py-4 cursor-pointer">
            PLAY NOW →
          </button>
        </div>
      )}
    </>
  )
}

// ─── Main Landing ──────────────────────────────────────────────────────────────
export default function Landing(): JSX.Element {
  const token = useAuthStore(s => s.token)
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoReady, setVideoReady] = useState(false)

  function handleEnter() {
    if (token) navigate('/lobby')
    else navigate('/login')
  }

  useEffect(() => {
    // Dynamically load hls.js
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest/dist/hls.min.js'
    script.onload = () => {
      const Hls = (window as any).Hls
      const video = videoRef.current
      if (!video) return
      const src = 'https://stream.mux.com/tLkHO1qZoaaQOUeVWo8hEBeGQfySP02EPS02BmnNFyXys.m3u8'
      if (Hls.isSupported()) {
        const hls = new Hls({ enableWorker: false })
        hls.loadSource(src)
        hls.attachMedia(video)
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => { })
          setVideoReady(true)
        })
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src
        video.play().catch(() => { })
        setVideoReady(true)
      } else {
        // Fallback to mp4
        video.src = 'https://res.cloudinary.com/dfonotyfb/video/upload/v1775585556/dds3_1_rqhg7x.mp4'
        video.play().catch(() => { })
        setVideoReady(true)
      }
    }
    document.head.appendChild(script)
  }, [])

  return (
    <div className="relative w-full h-screen overflow-hidden bg-brand-dark">

      {/* ── Video background ── */}
      <video ref={videoRef} autoPlay loop muted playsInline
        className={`absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-[1.5s] ease-in-out ${videoReady ? 'opacity-60' : 'opacity-0'}`}
      />

      {/* ── Left gradient ── */}
      <div className="absolute inset-0 z-[1] bg-[linear-gradient(to_right,#070b0a_0%,transparent_60%)] pointer-events-none" />
      {/* ── Bottom gradient ── */}
      <div className="absolute inset-0 z-[1] bg-[linear-gradient(to_top,#070b0a_0%,transparent_50%)] pointer-events-none" />
      {/* ── Overall dark veil ── */}
      <div className="absolute inset-0 z-[1] bg-[rgba(7,11,10,0.35)] pointer-events-none" />

      {/* ── Vertical grid lines ── */}
      <div className="hidden md:block absolute inset-0 z-[2] pointer-events-none">
        {[25, 50, 75].map(pct => (
          <div key={pct} className="absolute top-0 bottom-0 w-[1px] bg-white/5" style={{ left: `${pct}%` }} />
        ))}
      </div>

      {/* ── Central cyan glow ── */}
      <div className="animate-glowPulse absolute top-[8%] left-1/2 -translate-x-1/2 z-[2] pointer-events-none">
        <svg width="700" height="160" viewBox="0 0 700 160" fill="none">
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="25" result="blur" />
            </filter>
          </defs>
          <ellipse cx="350" cy="80" rx="300" ry="55" fill="url(#glowGrad)" filter="url(#glow)" />
          <defs>
            <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1aff9c" stopOpacity="0.55" />
              <stop offset="60%" stopColor="#0d6e56" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#070b0a" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      {/* ── Nav ── */}
      <Nav onEnter={handleEnter} />

      {/* ── Hero content ── */}
      <div className="absolute inset-0 z-10 flex flex-col items-start justify-center px-10 md:px-20 max-w-[900px]">

        {/* Liquid glass card */}
        <div className="hidden md:block animate-cardFloat">
          <LiquidCard />
        </div>

        {/* Eyebrow */}
        <p className="animate-fadeUp [animation-delay:100ms] font-jakarta font-bold text-[11px] tracking-[3px] text-brand-accent uppercase m-0 mb-4">
          Career-Ready Gaming
        </p>

        {/* Main headline */}
        <h1 className="animate-fadeUp [animation-delay:250ms] font-syne font-extrabold text-[38px] md:text-[72px] leading-[1.02] tracking-[-2px] text-white m-0 mb-6 uppercase">
          DRAW. GUESS.<br />
          <span className="text-white/85">WIN</span>
          <span className="text-brand-accent">.</span>
        </h1>

        {/* Description */}
        <p className="animate-fadeUp [animation-delay:400ms] font-jakarta text-[14px] leading-[1.7] text-white/65 max-w-[480px] m-0 mb-9">
          Real-time multiplayer drawing battles. One player draws, everyone guesses.
          Fast rounds, sharp wit, and a canvas that rewards creativity over perfection.
        </p>

        {/* CTA row */}
        <div className="animate-fadeUp [animation-delay:550ms] flex gap-4 items-center flex-wrap">
          <button onClick={handleEnter} className="font-jakarta font-bold text-[13px] tracking-[1.5px] bg-brand-accent text-brand-dark border-none rounded-full py-[14px] px-[32px] cursor-pointer flex items-center gap-2 uppercase shadow-[0_0_40px_rgba(94,210,156,0.25)] transition-all duration-200 hover:shadow-[0_0_60px_rgba(94,210,156,0.45)] hover:scale-[1.03]">
            Get Started <ArrowRight size={16} />
          </button>

          <button onClick={handleEnter} className="font-jakarta font-semibold text-[13px] bg-transparent text-white/65 border border-white/15 rounded-full py-[14px] px-[28px] cursor-pointer transition-all duration-200 hover:text-white hover:border-white/35">
            Watch Demo
          </button>
        </div>

        {/* Stats row */}
        <div className="animate-fadeUp [animation-delay:550ms] flex gap-10 mt-12 pt-8 border-t border-white/10">
          {[['10K+', 'Active Players'], ['500+', 'Daily Rooms'], ['80+', 'Word Categories']].map(([num, label]) => (
            <div key={label}>
              <div className="font-syne font-extrabold text-[22px] text-white">{num}</div>
              <div className="font-jakarta text-[11px] text-white/45 tracking-[1px] mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Scroll hint ── */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
        <div className="w-[1px] h-12 bg-gradient-to-b from-brand-accent/60 to-transparent" style={{ animation: 'fadeUp 1s ease infinite alternate' }} />
      </div>
    </div>
  )
}
