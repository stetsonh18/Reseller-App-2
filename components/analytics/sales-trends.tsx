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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { supabase } from "@/lib/supabase"
import { format, eachDayOfInterval, startOfDay, endOfDay } from "date-fns"
import { useAnalyticsStore } from "@/stores/analytics-store"

interface DailySales {
  date: string
  sales: number
  profit: number
}

export function SalesTrends() {
  const [data, setData] = useState<DailySales[]>([])
  const [loading, setLoading] = useState(true)
  const { dateRange } = useAnalyticsStore()

  useEffect(() => {
    async function fetchSalesTrends() {
      if (!dateRange.from || !dateRange.to) return

      try {
        const days = eachDayOfInterval({
          start: startOfDay(dateRange.from),
          end: endOfDay(dateRange.to),
        })

        const { data: sales, error } = await supabase
          .from("sales")
          .select("sale_date, sale_price, profit")
          .gte("sale_date", dateRange.from.toISOString())
          .lte("sale_date", dateRange.to.toISOString())
          .order("sale_date")

        if (error) throw error

        const dailyData = days.map((day) => {
          const daysSales = sales?.filter(
            (sale) => format(new Date(sale.sale_date), "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
          )

          return {
            date: format(day, "MMM dd"),
            sales: daysSales?.reduce((sum, sale) => sum + (sale.sale_price || 0), 0) || 0,
            profit: daysSales?.reduce((sum, sale) => sum + (sale.profit || 0), 0) || 0,
          }
        })

        setData(dailyData)
      } catch (error) {
        console.error("Error fetching sales trends:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSalesTrends()
  }, [dateRange])

  if (loading) {
    return <div>Loading sales trends...</div>
  }

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Sales Trends</CardTitle>
        <CardDescription>Daily sales and profit over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                formatter={(value: number) => [`$${value.toFixed(2)}`, ""]}
              />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                name="Sales"
              />
              <Line
                type="monotone"
                dataKey="profit"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                dot={false}
                name="Profit"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}