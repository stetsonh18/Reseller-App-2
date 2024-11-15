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
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { InventoryActions } from "./inventory-actions"
import { supabase } from "@/lib/supabase"
import { Database } from "@/types/supabase"
import { format } from "date-fns"
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription"

type InventoryItem = Database["public"]["Tables"]["inventory_items"]["Row"]

interface ExtendedInventoryItem extends InventoryItem {
  store: { name: string } | null
  category: { name: string } | null
}

const statusColors = {
  in_stock: "default",
  listed: "warning",
  pending_shipment: "warning",
  shipped: "success",
  returned: "destructive",
} as const

type SortField = "title" | "purchase_date" | "purchase_price" | "status"
type SortDirection = "asc" | "desc"

export function InventoryList() {
  const [items, setItems] = useState<ExtendedInventoryItem[]>([])
  const [filteredItems, setFilteredItems] = useState<ExtendedInventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [hideShipped, setHideShipped] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortField, setSortField] = useState<SortField>("purchase_date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  const fetchInventory = useCallback(async () => {
    try {
      let query = supabase
        .from("inventory_items")
        .select(`
          *,
          store:stores(name),
          category:categories(name)
        `)

      if (hideShipped) {
        query = query.neq('status', 'shipped')
      }

      const { data, error } = await query

      if (error) throw error
      setItems(data || [])
    } catch (error) {
      console.error("Error fetching inventory:", error)
    } finally {
      setLoading(false)
    }
  }, [hideShipped])

  useEffect(() => {
    fetchInventory()
  }, [fetchInventory])

  useEffect(() => {
    let result = [...items]

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      result = result.filter(item => 
        item.title.toLowerCase().includes(search) ||
        item.description?.toLowerCase().includes(search) ||
        item.bin_location?.toLowerCase().includes(search) ||
        item.store?.name.toLowerCase().includes(search) ||
        item.category?.name.toLowerCase().includes(search)
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter(item => item.status === statusFilter)
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0
      
      switch (sortField) {
        case "title":
          comparison = a.title.localeCompare(b.title)
          break
        case "purchase_date":
          comparison = new Date(a.purchase_date || 0).getTime() - new Date(b.purchase_date || 0).getTime()
          break
        case "purchase_price":
          comparison = (a.purchase_price || 0) - (b.purchase_price || 0)
          break
        case "status":
          comparison = a.status.localeCompare(b.status)
          break
      }

      return sortDirection === "asc" ? comparison : -comparison
    })

    setFilteredItems(result)
  }, [items, searchTerm, statusFilter, sortField, sortDirection])

  useRealtimeSubscription("inventory_items", fetchInventory)

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  if (loading) {
    return <div>Loading inventory...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <Input
            placeholder="Search inventory..."
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
              <SelectItem value="in_stock">In Stock</SelectItem>
              <SelectItem value="listed">Listed</SelectItem>
              <SelectItem value="pending_shipment">Pending Shipment</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="returned">Returned</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="hide-shipped"
            checked={hideShipped}
            onCheckedChange={setHideShipped}
          />
          <Label htmlFor="hide-shipped">Hide shipped items</Label>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort("title")}
              >
                Title {sortField === "title" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort("purchase_date")}
              >
                Purchase Date {sortField === "purchase_date" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort("purchase_price")}
              >
                Purchase Price {sortField === "purchase_price" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead>Store</TableHead>
              <TableHead>Category</TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort("status")}
              >
                Status {sortField === "status" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No items found
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell>
                    {item.purchase_date
                      ? format(new Date(item.purchase_date), "MMM d, yyyy")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {item.purchase_price
                      ? `$${item.purchase_price.toFixed(2)}`
                      : "—"}
                  </TableCell>
                  <TableCell>{item.store?.name || "—"}</TableCell>
                  <TableCell>{item.category?.name || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={statusColors[item.status as keyof typeof statusColors]}>
                      {item.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.bin_location || "—"}</TableCell>
                  <TableCell className="text-right">
                    <InventoryActions item={item} onUpdate={fetchInventory} />
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