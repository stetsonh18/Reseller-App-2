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
import { useUser } from "@/lib/auth"

type Category = Database["public"]["Tables"]["categories"]["Row"]

const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  parent_id: z.string().nullable(),
})

interface CategoryDialogProps {
  category?: Category
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CategoryDialog({
  category,
  open,
  onOpenChange,
  onSuccess,
}: CategoryDialogProps) {
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const { toast } = useToast()
  const { userId } = useUser()
  const isEditing = !!category

  const form = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name || "",
      parent_id: category?.parent_id || null,
    },
  })

  useEffect(() => {
    async function fetchCategories() {
      if (!userId) return;
      
      try {
        const { data, error } = await supabase
          .from("categories")
          .select("*")
          .eq("user_id", userId)
          .order("name")

        if (error) throw error
        // Filter out the current category and its children to prevent circular references
        const filteredCategories = isEditing
          ? data.filter((cat) => cat.id !== category.id)
          : data
        setCategories(filteredCategories)
      } catch (error) {
        console.error("Error fetching categories:", error)
      }
    }

    if (open) {
      fetchCategories()
    }
  }, [open, category, isEditing, userId])

  async function onSubmit(values: z.infer<typeof categorySchema>) {
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
          .from("categories")
          .update(values)
          .eq("id", category.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from("categories")
          .insert({
            ...values,
            user_id: userId,
          })

        if (error) throw error
      }

      toast({
        title: isEditing ? "Category updated" : "Category created",
        description: `Successfully ${isEditing ? "updated" : "created"} ${values.name}`,
      })
      onSuccess()
    } catch (error) {
      console.error("Error saving category:", error)
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} category. Please try again.`,
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
          <DialogTitle>{isEditing ? "Edit Category" : "Add Category"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the category details."
              : "Add a new category for organizing your inventory."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Electronics, Clothing" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="parent_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a parent category (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {isEditing ? "Update" : "Add"} Category
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}