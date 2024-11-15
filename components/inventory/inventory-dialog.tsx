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
import { Textarea } from "@/components/ui/textarea"
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

type InventoryItem = Database["public"]["Tables"]["inventory_items"]["Row"]
type Store = Database["public"]["Tables"]["stores"]["Row"]
type Category = Database["public"]["Tables"]["categories"]["Row"]

const inventorySchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  purchase_date: z.string().optional(),
  purchase_price: z.number().min(0, "Price must be 0 or greater").optional(),
  store_id: z.string().optional(),
  category_id: z.string().optional(),
  status: z.enum(["in_stock", "listed", "pending_shipment", "shipped", "returned"]),
  bin_location: z.string().optional(),
})

interface InventoryDialogProps {
  item?: InventoryItem
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function InventoryDialog({
  item,
  open,
  onOpenChange,
  onSuccess,
}: InventoryDialogProps) {
  const [loading, setLoading] = useState(false)
  const [stores, setStores] = useState<Store[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const { toast } = useToast()
  const { userId } = useUser()
  const isEditing = !!item

  const form = useForm<z.infer<typeof inventorySchema>>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      title: item?.title || "",
      description: item?.description || "",
      purchase_date: item?.purchase_date
        ? format(new Date(item.purchase_date), "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd"),
      purchase_price: item?.purchase_price || undefined,
      store_id: item?.store_id || undefined,
      category_id: item?.category_id || undefined,
      status: item?.status || "in_stock",
      bin_location: item?.bin_location || "",
    },
  })

  useEffect(() => {
    async function fetchData() {
      if (!userId) return;
      
      try {
        const [storesResponse, categoriesResponse] = await Promise.all([
          supabase
            .from("stores")
            .select("*")
            .eq("user_id", userId)
            .order("name"),
          supabase
            .from("categories")
            .select("*")
            .eq("user_id", userId)
            .order("name"),
        ])

        if (storesResponse.error) throw storesResponse.error
        if (categoriesResponse.error) throw categoriesResponse.error

        setStores(storesResponse.data || [])
        setCategories(categoriesResponse.data || [])
      } catch (error) {
        console.error("Error fetching data:", error)
      }
    }

    if (open) {
      fetchData()
    }
  }, [open, userId])

  async function onSubmit(values: z.infer<typeof inventorySchema>) {
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
      if (isEditing) {
        const { error } = await supabase
          .from("inventory_items")
          .update(values)
          .eq("id", item.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from("inventory_items")
          .insert({
            ...values,
            user_id: userId,
          })

        if (error) throw error
      }

      toast({
        title: isEditing ? "Item updated" : "Item created",
        description: `Successfully ${isEditing ? "updated" : "added"} ${values.title}`,
      })
      onSuccess()
    } catch (error) {
      console.error("Error saving inventory item:", error)
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} item. Please try again.`,
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
          <DialogTitle>{isEditing ? "Edit Item" : "Add Item"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the inventory item details."
              : "Add a new item to your inventory."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Item name or description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional details about the item..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="purchase_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purchase Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="purchase_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purchase Price ($)</FormLabel>
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
              name="store_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Store</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a store" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {stores.map((store) => (
                        <SelectItem key={store.id} value={store.id}>
                          {store.name}
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
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
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
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!isEditing}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="in_stock">In Stock</SelectItem>
                      <SelectItem value="listed">Listed</SelectItem>
                      <SelectItem value="pending_shipment">Pending Shipment</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="returned">Returned</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bin_location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bin Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Storage location (e.g., A1, B2)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {isEditing ? "Update" : "Add"} Item
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}