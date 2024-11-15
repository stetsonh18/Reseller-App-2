"use client"

import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { Database } from "@/types/supabase"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { useUser } from "@/lib/auth"

type Sale = Database["public"]["Tables"]["sales"]["Row"]
type Platform = Database["public"]["Tables"]["platforms"]["Row"]
type InventoryItem = Database["public"]["Tables"]["inventory_items"]["Row"]

const saleSchema = z.object({
  inventory_item_id: z.string().min(1, "Please select an item"),
  platform_id: z.string().min(1, "Please select a platform"),
  sale_date: z.string(),
  sale_price: z.number().min(0.01, "Sale price must be greater than 0"),
  shipping_collected: z.number().min(0, "Shipping collected must be 0 or greater").optional(),
  shipping_cost: z.number().min(0, "Shipping cost must be 0 or greater").optional(),
  platform_fees: z.number().min(0, "Platform fees must be 0 or greater"),
  transaction_fees: z.number().min(0, "Transaction fees must be 0 or greater"),
})

interface SaleDialogProps {
  sale?: Sale
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function SaleDialog({
  sale,
  open,
  onOpenChange,
  onSuccess,
}: SaleDialogProps) {
  const [loading, setLoading] = useState(false)
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const { toast } = useToast()
  const { userId } = useUser()
  const isEditing = !!sale

  const form = useForm<z.infer<typeof saleSchema>>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      inventory_item_id: sale?.inventory_item_id || "",
      platform_id: sale?.platform_id || "",
      sale_date: sale?.sale_date
        ? format(new Date(sale.sale_date), "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd"),
      sale_price: sale?.sale_price || 0,
      shipping_collected: sale?.shipping_collected || 0,
      shipping_cost: sale?.shipping_cost || 0,
      platform_fees: sale?.platform_fees || 0,
      transaction_fees: sale?.transaction_fees || 0,
    },
  })

  // Watch sale price to auto-calculate suggested fees
  const salePrice = form.watch("sale_price")
  const platformId = form.watch("platform_id")

  useEffect(() => {
    if (platformId && salePrice) {
      const platform = platforms.find(p => p.id === platformId)
      if (platform?.fee_structure) {
        const { baseFee = 0, percentageFee = 0 } = platform.fee_structure as { baseFee: number, percentageFee: number }
        const suggestedPlatformFees = (salePrice * (percentageFee / 100)) + baseFee
        const suggestedTransactionFees = (salePrice * 0.029) + 0.30 // Standard payment processing fee

        form.setValue("platform_fees", Number(suggestedPlatformFees.toFixed(2)))
        form.setValue("transaction_fees", Number(suggestedTransactionFees.toFixed(2)))
      }
    }
  }, [platformId, salePrice, platforms, form])

  useEffect(() => {
    async function fetchData() {
      if (!userId) return;
      
      try {
        const [platformsResponse, itemsResponse] = await Promise.all([
          supabase
            .from("platforms")
            .select("*")
            .eq("user_id", userId)
            .eq("active", true)
            .order("name"),
          supabase
            .from("inventory_items")
            .select("*")
            .eq("user_id", userId)
            .eq("status", isEditing ? "pending_shipment" : "listed") // Only show listed items for new sales
            .order("title"),
        ])

        if (platformsResponse.error) throw platformsResponse.error
        if (itemsResponse.error) throw itemsResponse.error

        setPlatforms(platformsResponse.data || [])
        setInventoryItems(itemsResponse.data || [])
      } catch (error) {
        console.error("Error fetching data:", error)
      }
    }

    if (open) {
      fetchData()
    }
  }, [open, userId, isEditing])

  async function calculateProfit(values: z.infer<typeof saleSchema>) {
    const item = inventoryItems.find(i => i.id === values.inventory_item_id)
    if (!item?.purchase_price) return 0

    const shippingProfit = (values.shipping_collected || 0) - (values.shipping_cost || 0)
    return values.sale_price - item.purchase_price - values.platform_fees - values.transaction_fees + shippingProfit
  }

  async function onSubmit(values: z.infer<typeof saleSchema>) {
    if (!userId) {
      toast({
        title: "Error",
        description: "You must be logged in to perform this action.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const profit = await calculateProfit(values)

      const saleData = {
        ...values,
        user_id: userId,
        profit: profit,
      }

      if (isEditing) {
        const { error } = await supabase
          .from("sales")
          .update(saleData)
          .eq("id", sale.id)

        if (error) throw error
      } else {
        // First, create the sale record
        const { error: saleError } = await supabase
          .from("sales")
          .insert(saleData)

        if (saleError) throw saleError

        // Then, update the inventory item status to pending_shipment
        const { error: inventoryError } = await supabase
          .from("inventory_items")
          .update({ status: "pending_shipment" })
          .eq("id", values.inventory_item_id)

        if (inventoryError) throw inventoryError
      }

      toast({
        title: isEditing ? "Sale updated" : "Sale recorded",
        description: `Successfully ${isEditing ? "updated" : "recorded"} sale for $${values.sale_price}`,
      })
      onSuccess()
    } catch (error) {
      console.error("Error saving sale:", error)
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} sale. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Sale" : "Record Sale"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the sale details."
              : "Record a new sale and mark item as pending shipment."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="inventory_item_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isEditing}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an item" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {inventoryItems.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="platform_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Platform</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a platform" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {platforms.map((platform) => (
                        <SelectItem key={platform.id} value={platform.id}>
                          {platform.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sale_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sale Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sale_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sale Price ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="shipping_collected"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shipping Collected ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="shipping_cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shipping Cost ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="platform_fees"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Platform Fees ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="transaction_fees"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transaction Fees ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {isEditing ? "Update" : "Record"} Sale
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}