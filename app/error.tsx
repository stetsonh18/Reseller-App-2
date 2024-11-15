"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Error } from "@/components/ui/error"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex h-screen flex-col items-center justify-center space-y-4">
      <Error
        title="Something went wrong!"
        message="An error occurred while loading this page."
      />
      <Button onClick={() => reset()}>Try again</Button>
    </div>
  )
}