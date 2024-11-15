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
import { StoreDialog } from "./store-dialog"
import { supabase } from "@/lib/supabase"
import { Database } from "@/types/supabase"
import { useToast } from "@/components/ui/use-toast"

type Store = Database["public"]["Tables"]["stores"]["Row"]

interface StoreActionsProps {
  store: Store
  onUpdate: () => void
}

export function StoreActions({ store, onUpdate }: StoreActionsProps) {
  const [showEditDialog, setShowEditDialog] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("stores")
        .delete()
        .eq("id", store.id)

      if (error) throw error

      toast({
        title: "Store deleted",
        description: "The store has been successfully deleted.",
      })
      onUpdate()
    } catch (error) {
      console.error("Error deleting store:", error)
      toast({
        title: "Error",
        description: "Failed to delete the store. Please try again.",
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

      <StoreDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        store={store}
        onSuccess={() => {
          setShowEditDialog(false)
          onUpdate()
        }}
      />
    </>
  )
}