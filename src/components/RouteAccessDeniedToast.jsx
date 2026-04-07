'use client'

import { useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'

/**
 * Shows a message when middleware redirected here with ?access_denied=1, then cleans the URL.
 */
export default function RouteAccessDeniedToast() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    if (searchParams.get('access_denied') !== '1') return
    handled.current = true
    toast.error("You can't access that route. Please use the menu for pages you're allowed to view.")
    router.replace('/dashboard', { scroll: false })
  }, [searchParams, router])

  return null
}
