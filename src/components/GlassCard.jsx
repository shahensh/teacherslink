import React from 'react'

const GlassCard = ({ children, className = '', padding = 'p-8' }) => {
  return (
    <div className={`relative rounded-2xl border border-white/40 bg-white/25 backdrop-blur-xl shadow-[0_12px_45px_rgba(0,0,0,0.12)] ${padding} ${className}`}>
      {/* Subtle inner highlight for glass feel */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl" style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.15) 40%, rgba(255,255,255,0.08) 100%)',
        maskImage: 'radial-gradient(120% 120% at 50% 0%, black 30%, transparent 70%)',
        WebkitMaskImage: 'radial-gradient(120% 120% at 50% 0%, black 30%, transparent 70%)'
      }} />
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}

export default GlassCard



