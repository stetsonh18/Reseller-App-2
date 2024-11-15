"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"
import { useState } from "react"
import { CategoryDialog } from "./category-dialog"
import { supabase } from "@/lib/supabase"
import { Database } from "@/types/supabase"
import { useToast } from "@/components/ui/use-toast"

type Category = Database["public"]["Tables"]["categories"]["Row"]

interface CategoryActionsProps {
  category: Category
  onUpdate: () => void
}

export function CategoryActions({ category, onUpdate }: CategoryActionsProps) {
  const [showEditDialog, setShowEditDialog] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    try {
      // Check if category has child categories
      const { data: children, error: childrenError } = await supabase
        .from("categories")
        .select("id")
        .eq("parent_id", category.id)
        .limit(1)

      if (childrenError) throw childrenError

      if (children && children.length > 0) {
        toast({
          title: "Cannot delete category",
          description: "Please delete or reassign all subcategories first.",
          variant: "destructive",
        })
        return
      }

      // Check if category is used by any inventory items
      const { data: items, error: itemsError } = await supabase
        .from("inventory_items")
        .select("id")
        .eq("category_id", category.id)
        .limit(1)

      if (itemsError) throw itemsError

      if (items && items.length > 0) {
        toast({
          title: "Cannot delete category",
          description: "Please reassign all inventory items first.",
          variant: "destructive",
        })
        return
      }

      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", category.id)

      if (error) throw error

      toast({
        title: "Category deleted",
        description: "The category has been successfully deleted.",
      })
      onUpdate()
    } catch (error) {
      console.error("Error deleting category:", error)
      toast({
        title: "Error",
        description: "Failed to delete the category. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDelete} className="text-red-600">
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CategoryDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        category={category}
        onSuccess={() => {
          setShowEditDialog(false)
          onUpdate()
        }}
      />
    </>
  )
}