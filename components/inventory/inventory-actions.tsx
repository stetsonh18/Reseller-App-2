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
import { InventoryDialog } from "./inventory-dialog"
import { supabase } from "@/lib/supabase"
import { Database } from "@/types/supabase"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type InventoryItem = Database["public"]["Tables"]["inventory_items"]["Row"]

interface InventoryActionsProps {
  item: InventoryItem
  onUpdate: () => void
}

export function InventoryActions({ item, onUpdate }: InventoryActionsProps) {
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("inventory_items")
        .delete()
        .eq("id", item.id)

      if (error) throw error

      toast({
        title: "Item deleted",
        description: "The inventory item has been successfully deleted.",
      })
      onUpdate()
    } catch (error) {
      console.error("Error deleting inventory item:", error)
      toast({
        title: "Error",
        description: "Failed to delete the inventory item. Please try again.",
        variant: "destructive",
      })
    } finally {
      setShowDeleteDialog(false)
    }
  }

  const handleMarkAsListed = async () => {
    try {
      const { error } = await supabase
        .from("inventory_items")
        .update({ status: "listed" })
        .eq("id", item.id)

      if (error) throw error

      toast({
        title: "Item listed",
        description: "The item has been marked as listed.",
      })
      onUpdate()
    } catch (error) {
      console.error("Error marking item as listed:", error)
      toast({
        title: "Error",
        description: "Failed to mark item as listed. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex justify-end">
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
          {item.status === "in_stock" && (
            <DropdownMenuItem onClick={handleMarkAsListed}>
              Mark as Listed
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600"
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <InventoryDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        item={item}
        onSuccess={() => {
          setShowEditDialog(false)
          onUpdate()
        }}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              inventory item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}