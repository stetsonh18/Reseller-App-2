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

type Expense = Database["public"]["Tables"]["expenses"]["Row"]

const expenseCategories = [
  "Shipping",
  "Supplies",
  "Platform Fees",
  "Marketing",
  "Travel",
  "Storage",
  "Equipment",
  "Software",
  "Other",
] as const

const expenseSchema = z.object({
  date: z.string(),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  category: z.enum(expenseCategories),
  description: z.string().optional(),
  receipt_url: z.string().url("Please enter a valid URL").optional().or(z.literal('')),
})

interface ExpenseDialogProps {
  expense?: Expense
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ExpenseDialog({
  expense,
  open,
  onOpenChange,
  onSuccess,
}: ExpenseDialogProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { userId } = useUser()
  const isEditing = !!expense

  const form = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: expense ? format(new Date(expense.date), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      amount: expense?.amount || 0,
      category: (expense?.category as typeof expenseCategories[number]) || "Other",
      description: expense?.description || "",
      receipt_url: expense?.receipt_url || "",
    },
  })

  async function onSubmit(values: z.infer<typeof expenseSchema>) {
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
      const dataToSave = {
        ...values,
        receipt_url: values.receipt_url || null,
        user_id: userId,
      }

      if (isEditing) {
        const { error } = await supabase
          .from("expenses")
          .update(dataToSave)
          .eq("id", expense.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from("expenses")
          .insert(dataToSave)

        if (error) throw error
      }

      toast({
        title: isEditing ? "Expense updated" : "Expense created",
        description: `Successfully ${isEditing ? "updated" : "recorded"} expense of $${values.amount}`,
      })
      onSuccess()
    } catch (error) {
      console.error("Error saving expense:", error)
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} expense. Please try again.`,
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
          <DialogTitle>{isEditing ? "Edit Expense" : "Add Expense"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the expense details."
              : "Record a new business expense."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount ($)</FormLabel>
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
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {expenseCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional details about this expense..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="receipt_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Receipt URL (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://example.com/receipt.pdf"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {isEditing ? "Update" : "Add"} Expense
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}