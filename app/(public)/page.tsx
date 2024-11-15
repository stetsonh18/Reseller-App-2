import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Package } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <nav className="absolute top-0 right-0 p-6">
        <Link href="/auth/login">
          <Button variant="outline">
            Login
          </Button>
        </Link>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <Package className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
            Reseller Inventory Management
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
            Streamline your reselling business with our comprehensive inventory management system.
            Track sales, manage inventory, and analyze your performance across multiple platforms.
          </p>
          <div className="mt-10 flex items-center justify-center">
            <Link href="/auth/signup">
              <Button size="lg">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}