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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { Database } from "@/types/supabase"
import { format } from "date-fns"
import { useToast } from "@/components/ui/use-toast"
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription"
import { Package } from "lucide-react"

type Sale = Database["public"]["Tables"]["sales"]["Row"]

interface ExtendedSale extends Sale {
  inventory_item: {
    title: string
    bin_location: string | null
  }
  platform: {
    name: string
  }
}

export function PendingShipmentsList() {
  const [pendingShipments, setPendingShipments] = useState<ExtendedSale[]>([])
  const [filteredShipments, setFilteredShipments] = useState<ExtendedSale[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  const fetchPendingShipments = useCallback(async () => {
    try {
      const { data: sales, error } = await supabase
        .from("sales")
        .select(`
          *,
          inventory_item:inventory_items(title, bin_location),
          platform:platforms(name)
        `)
        .eq("inventory_item.status", "pending_shipment")
        .order("sale_date", { ascending: false })

      if (error) throw error

      // Filter out any sales where the inventory item is null
      const validSales = (sales || []).filter(sale => sale.inventory_item)
      setPendingShipments(validSales)
    } catch (error) {
      console.error("Error fetching pending shipments:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPendingShipments()
  }, [fetchPendingShipments])

  useEffect(() => {
    let result = [...pendingShipments]

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      result = result.filter(sale => 
        sale.inventory_item?.title.toLowerCase().includes(search) ||
        sale.platform?.name.toLowerCase().includes(search) ||
        sale.inventory_item?.bin_location?.toLowerCase().includes(search)
      )
    }

    setFilteredShipments(result)
  }, [pendingShipments, searchTerm])

  useRealtimeSubscription("sales", fetchPendingShipments)
  useRealtimeSubscription("inventory_items", fetchPendingShipments)

  const markAsShipped = async (saleId: string, inventoryItemId: string) => {
    try {
      const { error } = await supabase
        .from("inventory_items")
        .update({ status: "shipped" })
        .eq("id", inventoryItemId)

      if (error) throw error

      toast({
        title: "Item marked as shipped",
        description: "The item has been successfully marked as shipped.",
      })
      await fetchPendingShipments()
    } catch (error) {
      console.error("Error marking item as shipped:", error)
      toast({
        title: "Error",
        description: "Failed to mark item as shipped. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div>Loading pending shipments...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Input
          placeholder="Search pending shipments..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sale Date</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Sale Price</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredShipments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Package className="h-8 w-8" />
                    <p>No pending shipments</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredShipments.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>
                    {format(new Date(sale.sale_date), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="font-medium">
                    {sale.inventory_item?.title}
                  </TableCell>
                  <TableCell>{sale.platform?.name}</TableCell>
                  <TableCell>{sale.inventory_item?.bin_location || "—"}</TableCell>
                  <TableCell>${sale.sale_price.toFixed(2)}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => markAsShipped(sale.id, sale.inventory_item_id)}
                    >
                      Mark as Shipped
                    </Button>
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