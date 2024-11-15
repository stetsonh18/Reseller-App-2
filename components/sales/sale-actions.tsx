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
import { SaleDialog } from "./sale-dialog"
import { ReturnDialog } from "./return-dialog"
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

type Sale = Database["public"]["Tables"]["sales"]["Row"]

interface SaleActionsProps {
  sale: Sale
  onUpdate: () => void
}

export function SaleActions({ sale, onUpdate }: SaleActionsProps) {
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showReturnDialog, setShowReturnDialog] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    try {
      // First, update the inventory item status back to "in_stock"
      const { error: inventoryError } = await supabase
        .from("inventory_items")
        .update({ status: "in_stock" })
        .eq("id", sale.inventory_item_id)

      if (inventoryError) throw inventoryError

      // Then delete the sale
      const { error } = await supabase
        .from("sales")
        .delete()
        .eq("id", sale.id)

      if (error) throw error

      toast({
        title: "Sale deleted",
        description: "The sale has been successfully deleted.",
      })
      onUpdate()
    } catch (error) {
      console.error("Error deleting sale:", error)
      toast({
        title: "Error",
        description: "Failed to delete the sale. Please try again.",
        variant: "destructive",
      })
    } finally {
      setShowDeleteDialog(false)
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
          <DropdownMenuItem onClick={() => setShowReturnDialog(true)}>
            Process Return
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600"
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SaleDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        sale={sale}
        onSuccess={() => {
          setShowEditDialog(false)
          onUpdate()
        }}
      />

      <ReturnDialog
        open={showReturnDialog}
        onOpenChange={setShowReturnDialog}
        sale={sale}
        onSuccess={() => {
          setShowReturnDialog(false)
          onUpdate()
        }}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              sale record and mark the item as back in stock.
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
    </>
  )
}