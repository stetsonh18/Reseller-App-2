"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useState } from "react"
import { ExpenseDialog } from "./expense-dialog"

export function AddExpenseButton() {
  const [showDialog, setShowDialog] = useState(false)

  return (
    <>
      <Button onClick={() => setShowDialog(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Expense
      </Button>

      <ExpenseDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        onSuccess={() => setShowDialog(false)}
      />
    </>
  )
}