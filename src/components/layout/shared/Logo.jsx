'use client'

// Component Imports
// Logo image with "iTaxPro" text below in orange (sidebar & shared use)

const Logo = ({ color }) => {
  return (
    <div className='flex flex-row items-center justify-start gap-2 min-bs-[24px]'>
      <img src='/logo.jpeg' alt='iTaxPro' className='h-16 w-auto max-w-[220px] object-contain block shrink-0' />
      <span
        className='text-lg font-semibold tracking-tight whitespace-nowrap'
        style={{ color: color ?? '#ed6c02' }}
      >
        iTaxPro
      </span>
    </div>
  )
}

export default Logo
