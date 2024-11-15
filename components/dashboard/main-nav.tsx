"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname()

  return (
    <nav
      className={cn("flex items-center space-x-4 lg:space-x-6", className)}
      {...props}
    >
      <Link
        href="/dashboard"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === "/dashboard" 
            ? "text-primary" 
            : "text-muted-foreground"
        )}
      >
        Overview
      </Link>
      <Link
        href="/dashboard/inventory"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === "/dashboard/inventory"
            ? "text-primary"
            : "text-muted-foreground"
        )}
      >
        Inventory
      </Link>
      <Link
        href="/dashboard/sales"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === "/dashboard/sales"
            ? "text-primary"
            : "text-muted-foreground"
        )}
      >
        Sales
      </Link>
      <Link
        href="/dashboard/pending-shipments"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === "/dashboard/pending-shipments"
            ? "text-primary"
            : "text-muted-foreground"
        )}
      >
        Pending Shipments
      </Link>
      <Link
        href="/dashboard/platforms"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === "/dashboard/platforms"
            ? "text-primary"
            : "text-muted-foreground"
        )}
      >
        Platforms
      </Link>
      <Link
        href="/dashboard/stores"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === "/dashboard/stores"
            ? "text-primary"
            : "text-muted-foreground"
        )}
      >
        Stores
      </Link>
      <Link
        href="/dashboard/categories"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === "/dashboard/categories"
            ? "text-primary"
            : "text-muted-foreground"
        )}
      >
        Categories
      </Link>
      <Link
        href="/dashboard/expenses"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === "/dashboard/expenses"
            ? "text-primary"
            : "text-muted-foreground"
        )}
      >
        Expenses
      </Link>
      <Link
        href="/dashboard/analytics"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === "/dashboard/analytics"
            ? "text-primary"
            : "text-muted-foreground"
        )}
      >
        Analytics
      </Link>
    </nav>
  )
}