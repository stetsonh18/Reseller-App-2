"use client"

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { LoadingSpinner } from '@/components/ui/loading'

export function AuthCheck({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading) {
      const isProtectedRoute = pathname.startsWith('/dashboard')
      const isAuthRoute = pathname.startsWith('/auth')

      if (isProtectedRoute && !user) {
        router.push(`/auth/login?redirectedFrom=${encodeURIComponent(pathname)}`)
      } else if (isAuthRoute && user) {
        router.push('/dashboard')
      }
    }
  }, [user, loading, router, pathname])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  const isProtectedRoute = pathname.startsWith('/dashboard')
  if (isProtectedRoute && !user) {
    return null
  }

  return <>{children}</>
}