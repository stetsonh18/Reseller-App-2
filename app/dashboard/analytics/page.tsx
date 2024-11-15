"use client"

import { SalesTrends } from "@/components/analytics/sales-trends"
import { SalesBreakdown } from "@/components/analytics/sales-breakdown"
import { TopSellers } from "@/components/analytics/top-sellers"
import { ProfitMargins } from "@/components/analytics/profit-margins"
import { AnalyticsDateRange } from "@/components/analytics/analytics-date-range"
import { InventoryTurnover } from "@/components/analytics/inventory-turnover"
import { PlatformPerformance } from "@/components/analytics/platform-performance"
import { CategoryPerformance } from "@/components/analytics/category-performance"

export default function AnalyticsPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
        <AnalyticsDateRange />
      </div>
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <SalesTrends />
        <SalesBreakdown />
      </div>
      <InventoryTurnover />
      <PlatformPerformance />
      <CategoryPerformance />
      <ProfitMargins />
      <TopSellers />
    </div>
  )
}