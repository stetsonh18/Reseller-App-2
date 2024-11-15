"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"

interface RecentSale {
  id: string
  sale_date: string
  sale_price: number
  inventory_item: {
    title: string
  }
  platform: {
    name: string
  }
}

export function RecentSales() {
  const [sales, setSales] = useState<RecentSale[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRecentSales() {
      try {
        const { data, error } = await supabase
          .from("sales")
          .select(`
            id,
            sale_date,
            sale_price,
            inventory_item:inventory_items(title),
            platform:platforms(name)
          `)
          .order("sale_date", { ascending: false })
          .limit(5)

        if (error) throw error
        setSales(data)
      } catch (error) {
        console.error("Error fetching recent sales:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentSales()
  }, [])

  if (loading) {
    return <div>Loading recent sales...</div>
  }

  return (
    <div className="space-y-8">
      {sales.map((sale) => (
        <div key={sale.id} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarFallback>
              {sale.inventory_item?.title?.substring(0, 2).toUpperCase() || "??"}
            </AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">
              {sale.inventory_item?.title || "Unknown Item"}
            </p>
            <p className="text-sm text-muted-foreground">
              via {sale.platform?.name || "Unknown Platform"}
            </p>
          </div>
          <div className="ml-auto text-sm font-medium">
            +${sale.sale_price.toFixed(2)}
          </div>
        </div>
      ))}
    </div>
  )
}