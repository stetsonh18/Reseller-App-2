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
import { PlatformDialog } from "./platform-dialog"
import { supabase } from "@/lib/supabase"
import { Database } from "@/types/supabase"
import { useToast } from "@/components/ui/use-toast"

type Platform = Database["public"]["Tables"]["platforms"]["Row"]

interface PlatformActionsProps {
  platform: Platform
  onUpdate: () => void
}

export function PlatformActions({ platform, onUpdate }: PlatformActionsProps) {
  const [showEditDialog, setShowEditDialog] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("platforms")
        .delete()
        .eq("id", platform.id)

      if (error) throw error

      toast({
        title: "Platform deleted",
        description: "The platform has been successfully deleted.",
      })
      onUpdate()
    } catch (error) {
      console.error("Error deleting platform:", error)
      toast({
        title: "Error",
        description: "Failed to delete the platform. Please try again.",
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

      <PlatformDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        platform={platform}
        onSuccess={() => {
          setShowEditDialog(false)
          onUpdate()
        }}
      />
    </>
  )
}