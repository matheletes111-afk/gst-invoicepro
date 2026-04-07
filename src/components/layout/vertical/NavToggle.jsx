'use client'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'

const NavToggle = () => {
  // Hooks
  const { toggleVerticalNav } = useVerticalNav()

  const handleClick = () => {
    toggleVerticalNav()
  }

  return (
    <i
      className='ri-menu-line text-xl cursor-pointer'
      onClick={handleClick}
      aria-label='Toggle navigation'
      role='button'
    />
  )
}

export default NavToggle
