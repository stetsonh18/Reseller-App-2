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
import { ExpenseDialog } from "./expense-dialog"
import { supabase } from "@/lib/supabase"
import { Database } from "@/types/supabase"
import { useToast } from "@/components/ui/use-toast"

type Expense = Database["public"]["Tables"]["expenses"]["Row"]

interface ExpenseActionsProps {
  expense: Expense
  onUpdate: () => void
}

export function ExpenseActions({ expense, onUpdate }: ExpenseActionsProps) {
  const [showEditDialog, setShowEditDialog] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", expense.id)

      if (error) throw error

      toast({
        title: "Expense deleted",
        description: "The expense has been successfully deleted.",
      })
      onUpdate()
    } catch (error) {
      console.error("Error deleting expense:", error)
      toast({
        title: "Error",
        description: "Failed to delete the expense. Please try again.",
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

      <ExpenseDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        expense={expense}
        onSuccess={() => {
          setShowEditDialog(false)
          onUpdate()
        }}
      />
    </>
  )
}