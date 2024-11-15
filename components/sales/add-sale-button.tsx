"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useState } from "react"
import { SaleDialog } from "./sale-dialog"

export function AddSaleButton() {
  const [showDialog, setShowDialog] = useState(false)

  return (
    <>
      <Button onClick={() => setShowDialog(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Sale
      </Button>

      <SaleDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        onSuccess={() => setShowDialog(false)}
      />
    </>
  )
}