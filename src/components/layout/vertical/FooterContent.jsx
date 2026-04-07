'use client'

// Next Imports
import Link from 'next/link'

// Third-party Imports
import classnames from 'classnames'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'

// Util Imports
import { verticalLayoutClasses } from '@layouts/utils/layoutClasses'

const FooterContent = () => {
  // Hooks
  const { isBreakpointReached } = useVerticalNav()

  return (
    <div
      className={classnames(verticalLayoutClasses.footerContent, 'flex items-center justify-between flex-wrap gap-4')}
    >
      <p className="text-center">
       {`© ${new Date().getFullYear()},`} iTaxPro, All rights reserved.
       
        Developed by iTechnologies Pvt Ltd, Bhutan
        
        Aligned with Bhutan GST regulations issued by DRC
      </p>

    </div>
  )
}

export default FooterContent
