"use client"

import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { populateDatabase } from "@/scripts/populate-db"
import { useUser } from "@/lib/auth"
import { useState } from "react"

export default function PopulatePage() {
  const { toast } = useToast()
  const { userId } = useUser()
  const [loading, setLoading] = useState(false)

  const handlePopulate = async () => {
    if (!userId) {
      toast({
        title: "Error",
        description: "You must be logged in to populate the database.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      await populateDatabase(userId)
      toast({
        title: "Success",
        description: "Database has been populated with demo data!"
      })
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "Failed to populate database. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Populate Database</h2>
      </div>
      <div className="rounded-md border p-6">
        <h3 className="text-lg font-medium mb-4">Add Demo Data</h3>
        <p className="text-muted-foreground mb-6">
          Click the button below to populate your database with sample data including stores,
          platforms, categories, inventory items, and sales records.
        </p>
        <Button onClick={handlePopulate} disabled={loading}>
          {loading ? "Populating..." : "Populate Database"}
        </Button>
      </div>
    </div>
  )
}