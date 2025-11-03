import React from 'react'

const LiquidBackground = ({ children, className = '' }) => {
  return (
    <div className={`min-h-screen relative overflow-hidden bg-white ${className}`}>
      {/* animated liquid blobs */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 select-none">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}

export default LiquidBackground



