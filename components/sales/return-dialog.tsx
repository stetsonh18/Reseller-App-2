"use client"

import { useState } from "react"
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
import { supabase } from "@/lib/supabase"
import { Database } from "@/types/supabase"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"

type Sale = Database["public"]["Tables"]["sales"]["Row"]

const returnSchema = z.object({
  return_date: z.string(),
  refund_amount: z.number().min(0, "Refund amount must be 0 or greater"),
  return_shipping_cost: z.number().min(0, "Return shipping cost must be 0 or greater").optional(),
  restocking_fee: z.number().min(0, "Restocking fee must be 0 or greater").optional(),
  reason: z.string().min(1, "Please provide a reason for the return"),
})

interface ReturnDialogProps {
  sale: Sale
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ReturnDialog({
  sale,
  open,
  onOpenChange,
  onSuccess,
}: ReturnDialogProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof returnSchema>>({
    resolver: zodResolver(returnSchema),
    defaultValues: {
      return_date: format(new Date(), "yyyy-MM-dd"),
      refund_amount: sale.sale_price,
      return_shipping_cost: 0,
      restocking_fee: 0,
      reason: "",
    },
  })

  async function onSubmit(values: z.infer<typeof returnSchema>) {
    setLoading(true)
    try {
      // Calculate the updated profit
      const updatedProfit = -(values.refund_amount + (values.return_shipping_cost || 0))

      // Update the sale record with return information
      const { error: saleError } = await supabase
        .from("sales")
        .update({
          profit: updatedProfit,
          return_date: values.return_date,
          return_reason: values.reason,
          refund_amount: values.refund_amount,
          return_shipping_cost: values.return_shipping_cost,
          restocking_fee: values.restocking_fee,
        })
        .eq("id", sale.id)

      if (saleError) throw saleError

      // Update the inventory item status to returned
      const { error: inventoryError } = await supabase
        .from("inventory_items")
        .update({ status: "returned" })
        .eq("id", sale.inventory_item_id)

      if (inventoryError) throw inventoryError

      toast({
        title: "Return processed",
        description: "The return has been successfully processed.",
      })
      onSuccess()
    } catch (error) {
      console.error("Error processing return:", error)
      toast({
        title: "Error",
        description: "Failed to process return. Please try again.",
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
          <DialogTitle>Process Return</DialogTitle>
          <DialogDescription>
            Enter the return details and process the refund.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="return_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Return Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="refund_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Refund Amount ($)</FormLabel>
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
              name="return_shipping_cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Return Shipping Cost ($)</FormLabel>
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
              name="restocking_fee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Restocking Fee ($)</FormLabel>
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
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Return Reason</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter the reason for return..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                Process Return
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}