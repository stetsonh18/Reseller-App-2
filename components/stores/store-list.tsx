"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { StoreActions } from "./store-actions"
import { supabase } from "@/lib/supabase"
import { Database } from "@/types/supabase"
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription"

type Store = Database["public"]["Tables"]["stores"]["Row"]

type SortField = "name" | "location"
type SortDirection = "asc" | "desc"

export function StoreList() {
  const [stores, setStores] = useState<Store[]>([])
  const [filteredStores, setFilteredStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<SortField>("name")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")

  const fetchStores = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .order("name")

      if (error) throw error
      setStores(data || [])
    } catch (error) {
      console.error("Error fetching stores:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStores()
  }, [fetchStores])

  useEffect(() => {
    let result = [...stores]

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      result = result.filter(store => 
        store.name.toLowerCase().includes(search) ||
        store.location?.toLowerCase().includes(search) ||
        store.notes?.toLowerCase().includes(search)
      )
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0
      
      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name)
          break
        case "location":
          comparison = (a.location || "").localeCompare(b.location || "")
          break
      }

      return sortDirection === "asc" ? comparison : -comparison
    })

    setFilteredStores(result)
  }, [stores, searchTerm, sortField, sortDirection])

  useRealtimeSubscription("stores", fetchStores)

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  if (loading) {
    return <div>Loading stores...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Input
          placeholder="Search stores..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort("name")}
              >
                Store Name {sortField === "name" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort("location")}
              >
                Location {sortField === "location" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No stores found
                </TableCell>
              </TableRow>
            ) : (
              filteredStores.map((store) => (
                <TableRow key={store.id}>
                  <TableCell className="font-medium">{store.name}</TableCell>
                  <TableCell>{store.location || "—"}</TableCell>
                  <TableCell>{store.notes || "—"}</TableCell>
                  <TableCell className="text-right">
                    <StoreActions store={store} onUpdate={fetchStores} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}