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

interface TopSeller {
  title: string
  total_sales: number
  total_profit: number
  profit_margin: number
  units_sold: number
  avg_sale_price: number
}

export function TopSellers() {
  const [topSellers, setTopSellers] = useState<TopSeller[]>([])
  const [loading, setLoading] = useState(true)
  const { dateRange } = useAnalyticsStore()

  useEffect(() => {
    async function fetchTopSellers() {
      if (!dateRange.from || !dateRange.to) return

      try {
        const { data: sales, error } = await supabase
          .from("sales")
          .select(`
            sale_price,
            profit,
            inventory_item:inventory_items(title)
          `)
          .gte("sale_date", dateRange.from.toISOString())
          .lte("sale_date", dateRange.to.toISOString())

        if (error) throw error

        const itemStats = sales.reduce((acc: Record<string, any>, sale) => {
          const itemTitle = sale.inventory_item?.title || "Unknown"
          
          if (!acc[itemTitle]) {
            acc[itemTitle] = {
              title: itemTitle,
              total_sales: 0,
              total_profit: 0,
              units_sold: 0,
              avg_sale_price: 0,
              profit_margin: 0,
            }
          }

          acc[itemTitle].total_sales += sale.sale_price || 0
          acc[itemTitle].total_profit += sale.profit || 0
          acc[itemTitle].units_sold += 1
          acc[itemTitle].avg_sale_price = acc[itemTitle].total_sales / acc[itemTitle].units_sold
          acc[itemTitle].profit_margin = (acc[itemTitle].total_profit / acc[itemTitle].total_sales) * 100

          return acc
        }, {})

        const topItems = Object.values(itemStats)
          .sort((a: any, b: any) => b.total_sales - a.total_sales)
          .slice(0, 10)
          .map((item: any) => ({
            ...item,
            total_sales: Number(item.total_sales.toFixed(2)),
            total_profit: Number(item.total_profit.toFixed(2)),
            avg_sale_price: Number(item.avg_sale_price.toFixed(2)),
            profit_margin: Number(item.profit_margin.toFixed(1)),
          }))

        setTopSellers(topItems)
      } catch (error) {
        console.error("Error fetching top sellers:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTopSellers()
  }, [dateRange])

  if (loading) {
    return <div>Loading top sellers...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Selling Items</CardTitle>
        <CardDescription>Your best performing items by revenue</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Units Sold</TableHead>
              <TableHead className="text-right">Avg. Price</TableHead>
              <TableHead className="text-right">Total Sales</TableHead>
              <TableHead className="text-right">Profit Margin</TableHead>
              <TableHead className="text-right">Total Profit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topSellers.map((item) => (
              <TableRow key={item.title}>
                <TableCell className="font-medium">{item.title}</TableCell>
                <TableCell className="text-right">{item.units_sold}</TableCell>
                <TableCell className="text-right">
                  ${item.avg_sale_price}
                </TableCell>
                <TableCell className="text-right">
                  ${item.total_sales}
                </TableCell>
                <TableCell className="text-right">
                  <span className={item.profit_margin < 0 ? "text-red-500" : "text-green-500"}>
                    {item.profit_margin}%
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span className={item.total_profit < 0 ? "text-red-500" : "text-green-500"}>
                    ${item.total_profit}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}