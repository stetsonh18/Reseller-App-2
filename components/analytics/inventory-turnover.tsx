"use client"

import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { useAnalyticsStore } from "@/stores/analytics-store"

interface TurnoverMetrics {
  totalInventory: number
  soldItems: number
  averageDaysToSell: number
  turnoverRate: number
}

export function InventoryTurnover() {
  const [metrics, setMetrics] = useState<TurnoverMetrics>({
    totalInventory: 0,
    soldItems: 0,
    averageDaysToSell: 0,
    turnoverRate: 0,
  })
  const [loading, setLoading] = useState(true)
  const { dateRange } = useAnalyticsStore()

  useEffect(() => {
    async function fetchTurnoverMetrics() {
      if (!dateRange.from || !dateRange.to) return

      try {
        // Get inventory counts
        const { data: inventory } = await supabase
          .from("inventory_items")
          .select("status, created_at")

        // Get sales data
        const { data: sales } = await supabase
          .from("sales")
          .select(`
            sale_date,
            inventory_item:inventory_items(
              created_at
            )
          `)
          .gte("sale_date", dateRange.from.toISOString())
          .lte("sale_date", dateRange.to.toISOString())

        const totalInventory = inventory?.length || 0
        const soldItems = sales?.length || 0

        // Calculate average days to sell
        const daysToSell = sales?.map(sale => {
          const createdAt = new Date(sale.inventory_item?.created_at || 0)
          const saleDate = new Date(sale.sale_date)
          return Math.floor((saleDate.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
        }).filter(days => days >= 0) || []

        const averageDaysToSell = daysToSell.length
          ? daysToSell.reduce((sum, days) => sum + days, 0) / daysToSell.length
          : 0

        // Calculate turnover rate (annualized)
        const daysInPeriod = Math.floor((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))
        const turnoverRate = totalInventory
          ? (soldItems / totalInventory) * (365 / daysInPeriod)
          : 0

        setMetrics({
          totalInventory,
          soldItems,
          averageDaysToSell,
          turnoverRate,
        })
      } catch (error) {
        console.error("Error fetching turnover metrics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTurnoverMetrics()
  }, [dateRange])

  if (loading) {
    return <div>Loading inventory turnover data...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory Turnover</CardTitle>
        <CardDescription>
          Analysis of inventory movement and efficiency
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Total Inventory
            </p>
            <p className="text-2xl font-bold">
              {metrics.totalInventory}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Items Sold
            </p>
            <p className="text-2xl font-bold">
              {metrics.soldItems}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Avg. Days to Sell
            </p>
            <p className="text-2xl font-bold">
              {metrics.averageDaysToSell.toFixed(1)}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Annual Turnover Rate
            </p>
            <p className="text-2xl font-bold">
              {metrics.turnoverRate.toFixed(1)}x
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}