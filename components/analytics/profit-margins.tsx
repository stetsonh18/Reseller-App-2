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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { supabase } from "@/lib/supabase"
import { useAnalyticsStore } from "@/stores/analytics-store"

interface PlatformMargins {
  name: string
  margin: number
  sales: number
  profit: number
}

export function ProfitMargins() {
  const [data, setData] = useState<PlatformMargins[]>([])
  const [loading, setLoading] = useState(true)
  const [overallMargin, setOverallMargin] = useState(0)
  const { dateRange } = useAnalyticsStore()

  useEffect(() => {
    async function fetchProfitMargins() {
      if (!dateRange.from || !dateRange.to) return

      try {
        const { data: sales, error } = await supabase
          .from("sales")
          .select(`
            sale_price,
            profit,
            platform:platforms(name)
          `)
          .gte("sale_date", dateRange.from.toISOString())
          .lte("sale_date", dateRange.to.toISOString())

        if (error) throw error

        const platformStats = sales.reduce((acc: Record<string, any>, sale) => {
          const platformName = sale.platform?.name || "Unknown"
          
          if (!acc[platformName]) {
            acc[platformName] = {
              name: platformName,
              sales: 0,
              profit: 0,
              margin: 0,
            }
          }

          acc[platformName].sales += sale.sale_price || 0
          acc[platformName].profit += sale.profit || 0

          return acc
        }, {})

        let totalSales = 0
        let totalProfit = 0

        const margins = Object.values(platformStats)
          .map((platform: any) => {
            totalSales += platform.sales
            totalProfit += platform.profit
            
            return {
              ...platform,
              margin: (platform.profit / platform.sales) * 100,
              sales: Number(platform.sales.toFixed(2)),
              profit: Number(platform.profit.toFixed(2)),
            }
          })
          .sort((a: any, b: any) => b.margin - a.margin)

        setData(margins)
        setOverallMargin(totalSales ? (totalProfit / totalSales) * 100 : 0)
      } catch (error) {
        console.error("Error fetching profit margins:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfitMargins()
  }, [dateRange])

  if (loading) {
    return <div>Loading profit margins...</div>
  }

  return (
    <Card className="col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Profit Margins by Platform</CardTitle>
            <CardDescription>Analysis of profit margins across different selling platforms</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {overallMargin.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">
              Overall Margin
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(1)}%`, "Margin"]}
              />
              <Bar
                dataKey="margin"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 space-y-2">
          <div className="grid grid-cols-3 gap-4">
            {data.map((platform) => (
              <div
                key={platform.name}
                className="rounded-lg border p-3 text-sm"
              >
                <div className="font-medium">{platform.name}</div>
                <div className="mt-1 flex items-center justify-between text-muted-foreground">
                  <span>Sales: ${platform.sales}</span>
                  <span className={platform.margin < 0 ? "text-red-500" : "text-green-500"}>
                    {platform.margin.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}