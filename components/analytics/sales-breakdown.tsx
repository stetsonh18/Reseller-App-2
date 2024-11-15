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
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts"
import { supabase } from "@/lib/supabase"
import { useAnalyticsStore } from "@/stores/analytics-store"

interface SalesData {
  name: string
  value: number
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

export function SalesBreakdown() {
  const [platformData, setPlatformData] = useState<SalesData[]>([])
  const [loading, setLoading] = useState(true)
  const { dateRange } = useAnalyticsStore()

  useEffect(() => {
    async function fetchSalesBreakdown() {
      if (!dateRange.from || !dateRange.to) return

      try {
        const { data: sales, error } = await supabase
          .from("sales")
          .select(`
            sale_price,
            platform:platforms(name)
          `)
          .gte("sale_date", dateRange.from.toISOString())
          .lte("sale_date", dateRange.to.toISOString())

        if (error) throw error

        const platformSales = sales.reduce((acc: Record<string, number>, sale) => {
          const platformName = sale.platform?.name || "Unknown"
          acc[platformName] = (acc[platformName] || 0) + (sale.sale_price || 0)
          return acc
        }, {})

        const formattedData = Object.entries(platformSales)
          .map(([name, value]) => ({
            name,
            value: Number(value.toFixed(2)),
          }))
          .sort((a, b) => b.value - a.value)

        setPlatformData(formattedData)
      } catch (error) {
        console.error("Error fetching sales breakdown:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSalesBreakdown()
  }, [dateRange])

  if (loading) {
    return <div>Loading sales breakdown...</div>
  }

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Sales by Platform</CardTitle>
        <CardDescription>Distribution of sales across platforms</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={platformData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                label={({ name, value }) => `${name}: $${value}`}
              >
                {platformData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`$${value.toFixed(2)}`, "Sales"]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}