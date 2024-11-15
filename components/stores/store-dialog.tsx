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
import { useUser } from "@/lib/auth"

type Store = Database["public"]["Tables"]["stores"]["Row"]

const storeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  location: z.string().optional(),
  notes: z.string().optional(),
})

interface StoreDialogProps {
  store?: Store
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function StoreDialog({
  store,
  open,
  onOpenChange,
  onSuccess,
}: StoreDialogProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { userId } = useUser()
  const isEditing = !!store

  const form = useForm<z.infer<typeof storeSchema>>({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      name: store?.name || "",
      location: store?.location || "",
      notes: store?.notes || "",
    },
  })

  async function onSubmit(values: z.infer<typeof storeSchema>) {
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
          .from("stores")
          .update(values)
          .eq("id", store.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from("stores")
          .insert({
            ...values,
            user_id: userId,
          })

        if (error) throw error
      }

      toast({
        title: isEditing ? "Store updated" : "Store created",
        description: `Successfully ${isEditing ? "updated" : "created"} ${values.name}`,
      })
      onSuccess()
    } catch (error) {
      console.error("Error saving store:", error)
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} store. Please try again.`,
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
          <DialogTitle>{isEditing ? "Edit Store" : "Add Store"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the store details."
              : "Add a new store where you source inventory."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Store Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Goodwill, Target" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 123 Main St, City, State" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional information about this store..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {isEditing ? "Update" : "Add"} Store
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}