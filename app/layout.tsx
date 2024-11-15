import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from "@/components/ui/toaster"
import { Providers } from "./providers"
import { AuthCheck } from '@/components/auth/auth-check'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Reseller Inventory Management',
  description: 'Manage your reselling business inventory, sales, and expenses',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <AuthCheck>
            {children}
          </AuthCheck>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}