"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Overview } from "@/components/dashboard/overview"
import { RecentSales } from "@/components/dashboard/recent-sales"
import { supabase } from "@/lib/supabase"
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription"

interface DashboardStats {
  totalRevenue: number
  activeListings: number
  totalSales: number
  activeInventory: number
  monthlyGrowth: number
  listingGrowth: number
  salesGrowth: number
  inventoryGrowth: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    activeListings: 0,
    totalSales: 0,
    activeInventory: 0,
    monthlyGrowth: 0,
    listingGrowth: 0,
    salesGrowth: 0,
    inventoryGrowth: 0,
  })
  const [loading, setLoading] = useState(true)

  const fetchDashboardStats = async () => {
    try {
      // Get current month's revenue
      const { data: currentRevenue } = await supabase
        .from("sales")
        .select("sale_price")
        .gte("sale_date", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())

      // Get last month's revenue
      const { data: lastRevenue } = await supabase
        .from("sales")
        .select("sale_price")
        .gte("sale_date", new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString())
        .lt("sale_date", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())

      // Get inventory counts
      const { data: inventory } = await supabase
        .from("inventory_items")
        .select("status")

      const currentTotal = currentRevenue?.reduce((sum, sale) => sum + (sale.sale_price || 0), 0) || 0
      const lastTotal = lastRevenue?.reduce((sum, sale) => sum + (sale.sale_price || 0), 0) || 0
      const monthlyGrowth = lastTotal ? ((currentTotal - lastTotal) / lastTotal) * 100 : 0

      const listedItems = inventory?.filter(item => item.status === "listed").length || 0
      const totalItems = inventory?.length || 0

      setStats({
        totalRevenue: currentTotal,
        activeListings: listedItems,
        totalSales: inventory?.filter(item => item.status === "sold").length || 0,
        activeInventory: totalItems,
        monthlyGrowth,
        listingGrowth: 0, // Calculate based on historical data if available
        salesGrowth: 0, // Calculate based on historical data if available
        inventoryGrowth: 0, // Calculate based on historical data if available
      })
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  useRealtimeSubscription("sales", fetchDashboardStats)
  useRealtimeSubscription("inventory_items", fetchDashboardStats)

  if (loading) {
    return <div>Loading dashboard...</div>
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.monthlyGrowth >= 0 ? "+" : ""}
              {stats.monthlyGrowth.toFixed(1)}% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Listings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.activeListings}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.listingGrowth >= 0 ? "+" : ""}
              {stats.listingGrowth} since last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalSales}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.salesGrowth >= 0 ? "+" : ""}
              {stats.salesGrowth}% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Inventory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.activeInventory}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.inventoryGrowth >= 0 ? "+" : ""}
              {stats.inventoryGrowth} since last month
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <Overview />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentSales />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}