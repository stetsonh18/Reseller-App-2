"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { supabase } from "@/lib/supabase"
import { startOfYear, eachMonthOfInterval, format } from "date-fns"

interface MonthlySales {
  name: string
  total: number
}

export function Overview() {
  const [data, setData] = useState<MonthlySales[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMonthlySales() {
      try {
        const startDate = startOfYear(new Date())
        const months = eachMonthOfInterval({
          start: startDate,
          end: new Date(),
        })

        const { data: sales, error } = await supabase
          .from("sales")
          .select("sale_date, sale_price")
          .gte("sale_date", startDate.toISOString())
          .order("sale_date")

        if (error) throw error

        const monthlyTotals = months.map((month) => {
          const monthSales = sales?.filter((sale) => {
            const saleDate = new Date(sale.sale_date)
            return (
              saleDate.getMonth() === month.getMonth() &&
              saleDate.getFullYear() === month.getFullYear()
            )
          })

          const total = monthSales?.reduce(
            (sum, sale) => sum + (sale.sale_price || 0),
            0
          )

          return {
            name: format(month, "MMM"),
            total: Number(total.toFixed(2)),
          }
        })

        setData(monthlyTotals)
      } catch (error) {
        console.error("Error fetching monthly sales:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMonthlySales()
  }, [])

  if (loading) {
    return <div>Loading sales data...</div>
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => value}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <Bar
          dataKey="total"
          fill="currentColor"
          radius={[4, 4, 0, 0]}
          className="fill-primary"
        />
      </BarChart>
    </ResponsiveContainer>
  )
}