"use client"

import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { supabase } from "@/lib/supabase"
import { useAnalyticsStore } from "@/stores/analytics-store"
import { Badge } from "@/components/ui/badge"

interface PlatformMetrics {
  id: string
  name: string
  totalSales: number
  totalProfit: number
  averagePrice: number
  profitMargin: number
  orderCount: number
}

export function PlatformPerformance() {
  const [metrics, setMetrics] = useState<PlatformMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const { dateRange } = useAnalyticsStore()

  useEffect(() => {
    async function fetchPlatformMetrics() {
      if (!dateRange.from || !dateRange.to) return

      try {
        const { data: sales, error } = await supabase
          .from("sales")
          .select(`
            sale_price,
            profit,
            platform:platforms(id, name)
          `)
          .gte("sale_date", dateRange.from.toISOString())
          .lte("sale_date", dateRange.to.toISOString())

        if (error) throw error

        const platformMetrics = sales.reduce((acc: Record<string, any>, sale) => {
          const platformId = sale.platform?.id
          const platformName = sale.platform?.name

          if (!platformId || !platformName) return acc

          if (!acc[platformId]) {
            acc[platformId] = {
              id: platformId,
              name: platformName,
              totalSales: 0,
              totalProfit: 0,
              orderCount: 0,
              averagePrice: 0,
              profitMargin: 0,
            }
          }

          acc[platformId].totalSales += sale.sale_price || 0
          acc[platformId].totalProfit += sale.profit || 0
          acc[platformId].orderCount += 1

          return acc
        }, {})

        // Calculate averages and percentages
        const metricsArray = Object.values(platformMetrics)
          .map((platform: any) => ({
            ...platform,
            averagePrice: platform.totalSales / platform.orderCount,
            profitMargin: (platform.totalProfit / platform.totalSales) * 100,
          }))
          .sort((a: any, b: any) => b.totalSales - a.totalSales)

        setMetrics(metricsArray)
      } catch (error) {
        console.error("Error fetching platform metrics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPlatformMetrics()
  }, [dateRange])

  if (loading) {
    return <div>Loading platform performance data...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Performance</CardTitle>
        <CardDescription>
          Compare performance metrics across different selling platforms
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Platform</TableHead>
              <TableHead className="text-right">Orders</TableHead>
              <TableHead className="text-right">Total Sales</TableHead>
              <TableHead className="text-right">Avg. Price</TableHead>
              <TableHead className="text-right">Profit Margin</TableHead>
              <TableHead className="text-right">Total Profit</TableHead>
              <TableHead>Performance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {metrics.map((platform) => (
              <TableRow key={platform.id}>
                <TableCell className="font-medium">{platform.name}</TableCell>
                <TableCell className="text-right">{platform.orderCount}</TableCell>
                <TableCell className="text-right">
                  ${platform.totalSales.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  ${platform.averagePrice.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  <span className={platform.profitMargin < 0 ? "text-red-500" : "text-green-500"}>
                    {platform.profitMargin.toFixed(1)}%
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span className={platform.totalProfit < 0 ? "text-red-500" : "text-green-500"}>
                    ${platform.totalProfit.toFixed(2)}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={platform.profitMargin >= 15 ? "default" : platform.profitMargin >= 10 ? "secondary" : "destructive"}>
                    {platform.profitMargin >= 15 ? "High" : platform.profitMargin >= 10 ? "Medium" : "Low"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}