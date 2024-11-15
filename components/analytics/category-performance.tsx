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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface CategoryMetrics {
  id: string
  name: string
  totalSales: number
  totalProfit: number
  itemCount: number
  profitMargin: number
  percentageOfSales: number
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

export function CategoryPerformance() {
  const [metrics, setMetrics] = useState<CategoryMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const { dateRange } = useAnalyticsStore()

  useEffect(() => {
    async function fetchCategoryMetrics() {
      if (!dateRange.from || !dateRange.to) return

      try {
        const { data: sales, error } = await supabase
          .from("sales")
          .select(`
            sale_price,
            profit,
            inventory_item:inventory_items(
              category:categories(id, name)
            )
          `)
          .gte("sale_date", dateRange.from.toISOString())
          .lte("sale_date", dateRange.to.toISOString())

        if (error) throw error

        // Get inventory counts
        const { data: inventory } = await supabase
          .from("inventory_items")
          .select(`
            category:categories(id)
          `)

        const categoryMetrics = sales.reduce((acc: Record<string, any>, sale) => {
          const categoryId = sale.inventory_item?.category?.id
          const categoryName = sale.inventory_item?.category?.name

          if (!categoryId || !categoryName) return acc

          if (!acc[categoryId]) {
            acc[categoryId] = {
              id: categoryId,
              name: categoryName,
              totalSales: 0,
              totalProfit: 0,
              itemCount: 0,
              profitMargin: 0,
              percentageOfSales: 0,
            }
          }

          acc[categoryId].totalSales += sale.sale_price || 0
          acc[categoryId].totalProfit += sale.profit || 0

          return acc
        }, {})

        // Add inventory counts
        inventory?.forEach((item) => {
          const categoryId = item.category?.id
          if (categoryId && categoryMetrics[categoryId]) {
            categoryMetrics[categoryId].itemCount += 1
          }
        })

        // Calculate totals and percentages
        const totalSales = Object.values(categoryMetrics).reduce(
          (sum: number, cat: any) => sum + cat.totalSales,
          0
        )

        const metricsArray = Object.values(categoryMetrics)
          .map((category: any) => ({
            ...category,
            profitMargin: (category.totalProfit / category.totalSales) * 100,
            percentageOfSales: (category.totalSales / totalSales) * 100,
          }))
          .sort((a: any, b: any) => b.totalSales - a.totalSales)

        setMetrics(metricsArray)
      } catch (error) {
        console.error("Error fetching category metrics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCategoryMetrics()
  }, [dateRange])

  if (loading) {
    return <div>Loading category performance data...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Performance</CardTitle>
        <CardDescription>
          Analysis of sales and profitability by category
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics}
                  dataKey="totalSales"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => 
                    `${name}: ${(percent * 100).toFixed(1)}%`
                  }
                >
                  {metrics.map((_, index) => (
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">Sales</TableHead>
                <TableHead className="text-right">Margin</TableHead>
                <TableHead className="text-right">Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">
                    {category.name}
                  </TableCell>
                  <TableCell className="text-right">
                    {category.itemCount}
                  </TableCell>
                  <TableCell className="text-right">
                    ${category.totalSales.toFixed(2)}
                    <div className="text-xs text-muted-foreground">
                      {category.percentageOfSales.toFixed(1)}% of total
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={category.profitMargin < 0 ? "text-red-500" : "text-green-500"}>
                      {category.profitMargin.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={category.totalProfit < 0 ? "text-red-500" : "text-green-500"}>
                      ${category.totalProfit.toFixed(2)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}