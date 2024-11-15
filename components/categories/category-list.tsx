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
import { CategoryActions } from "./category-actions"
import { supabase } from "@/lib/supabase"
import { Database } from "@/types/supabase"
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription"

type Category = Database["public"]["Tables"]["categories"]["Row"]

interface CategoryWithParent extends Category {
  parent?: Category
}

type SortField = "name" | "parent"
type SortDirection = "asc" | "desc"

export function CategoryList() {
  const [categories, setCategories] = useState<CategoryWithParent[]>([])
  const [filteredCategories, setFilteredCategories] = useState<CategoryWithParent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<SortField>("name")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select(`
          *,
          parent:parent_id(
            id,
            name
          )
        `)
        .order("name")

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error("Error fetching categories:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  useEffect(() => {
    let result = [...categories]

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      result = result.filter(category => 
        category.name.toLowerCase().includes(search) ||
        category.parent?.name?.toLowerCase().includes(search)
      )
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0
      
      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name)
          break
        case "parent":
          comparison = (a.parent?.name || "").localeCompare(b.parent?.name || "")
          break
      }

      return sortDirection === "asc" ? comparison : -comparison
    })

    setFilteredCategories(result)
  }, [categories, searchTerm, sortField, sortDirection])

  useRealtimeSubscription("categories", fetchCategories)

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  if (loading) {
    return <div>Loading categories...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Input
          placeholder="Search categories..."
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
                Category Name {sortField === "name" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort("parent")}
              >
                Parent Category {sortField === "parent" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  No categories found
                </TableCell>
              </TableRow>
            ) : (
              filteredCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>{category.parent?.name || "—"}</TableCell>
                  <TableCell className="text-right">
                    <CategoryActions 
                      category={category} 
                      onUpdate={fetchCategories}
                    />
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