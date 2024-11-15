"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SaleActions } from "./sale-actions"
import { supabase } from "@/lib/supabase"
import { Database } from "@/types/supabase"
import { format } from "date-fns"
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription"

type Sale = Database["public"]["Tables"]["sales"]["Row"]

interface ExtendedSale extends Sale {
  inventory_item: {
    title: string
    status: string
  }
  platform: {
    name: string
  }
}

const statusColors: Record<string, "default" | "warning" | "success" | "destructive"> = {
  pending_shipment: "warning",
  shipped: "success",
  returned: "destructive",
}

type SortField = "sale_date" | "sale_price" | "profit" | "status"
type SortDirection = "asc" | "desc"

export function SalesList() {
  const [sales, setSales] = useState<ExtendedSale[]>([])
  const [filteredSales, setFilteredSales] = useState<ExtendedSale[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortField, setSortField] = useState<SortField>("sale_date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  const fetchSales = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("sales")
        .select(`
          *,
          inventory_item:inventory_items(title, status),
          platform:platforms(name)
        `)
        .in("inventory_item.status", ["pending_shipment", "shipped", "returned"])
        .order("sale_date", { ascending: false })

      if (error) throw error

      // Filter out any sales where the inventory item is null
      const validSales = (data || []).filter(sale => sale.inventory_item)
      setSales(validSales)
    } catch (error) {
      console.error("Error fetching sales:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSales()
  }, [fetchSales])

  useEffect(() => {
    let result = [...sales]

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      result = result.filter(sale => 
        sale.inventory_item?.title.toLowerCase().includes(search) ||
        sale.platform?.name.toLowerCase().includes(search)
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter(sale => sale.inventory_item?.status === statusFilter)
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0
      
      switch (sortField) {
        case "sale_date":
          comparison = new Date(a.sale_date).getTime() - new Date(b.sale_date).getTime()
          break
        case "sale_price":
          comparison = a.sale_price - b.sale_price
          break
        case "profit":
          comparison = (a.profit || 0) - (b.profit || 0)
          break
        case "status":
          comparison = (a.inventory_item?.status || "").localeCompare(b.inventory_item?.status || "")
          break
      }

      return sortDirection === "asc" ? comparison : -comparison
    })

    setFilteredSales(result)
  }, [sales, searchTerm, statusFilter, sortField, sortDirection])

  useRealtimeSubscription("sales", fetchSales)

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  if (loading) {
    return <div>Loading sales...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <Input
            placeholder="Search sales..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending_shipment">Pending Shipment</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="returned">Returned</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort("sale_date")}
              >
                Date {sortField === "sale_date" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort("sale_price")}
              >
                Sale Price {sortField === "sale_price" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead>Shipping</TableHead>
              <TableHead>Fees</TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort("profit")}
              >
                Profit {sortField === "profit" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort("status")}
              >
                Status {sortField === "status" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No sales found
                </TableCell>
              </TableRow>
            ) : (
              filteredSales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>
                    {format(new Date(sale.sale_date), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="font-medium">
                    {sale.inventory_item?.title || "—"}
                  </TableCell>
                  <TableCell>{sale.platform?.name || "—"}</TableCell>
                  <TableCell>${sale.sale_price.toFixed(2)}</TableCell>
                  <TableCell>
                    {sale.shipping_collected ? (
                      <span className="text-sm">
                        +${sale.shipping_collected.toFixed(2)}
                        {sale.shipping_cost && (
                          <span className="text-muted-foreground">
                            {" "}
                            / -${sale.shipping_cost.toFixed(2)}
                          </span>
                        )}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {(sale.platform_fees || sale.transaction_fees) ? (
                      <span className="text-sm text-muted-foreground">
                        {sale.platform_fees ? `-$${sale.platform_fees.toFixed(2)}` : ""}
                        {sale.platform_fees && sale.transaction_fees ? " / " : ""}
                        {sale.transaction_fees ? `-$${sale.transaction_fees.toFixed(2)}` : ""}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={sale.profit && sale.profit < 0 ? "text-red-500" : "text-green-500"}>
                      ${sale.profit?.toFixed(2) || "0.00"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusColors[sale.inventory_item?.status || ""] || "default"}>
                      {sale.inventory_item?.status?.replace("_", " ") || "unknown"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <SaleActions sale={sale} onUpdate={fetchSales} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}