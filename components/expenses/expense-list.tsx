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
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ExpenseActions } from "./expense-actions"
import { supabase } from "@/lib/supabase"
import { Database } from "@/types/supabase"
import { format } from "date-fns"
import { FileText } from "lucide-react"
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription"

type Expense = Database["public"]["Tables"]["expenses"]["Row"]

type SortField = "date" | "amount" | "category"
type SortDirection = "asc" | "desc"

const expenseCategories = [
  "Shipping",
  "Supplies",
  "Platform Fees",
  "Marketing",
  "Travel",
  "Storage",
  "Equipment",
  "Software",
  "Other",
] as const

export function ExpenseList() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  const fetchExpenses = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("date", { ascending: false })

      if (error) throw error
      setExpenses(data || [])
    } catch (error) {
      console.error("Error fetching expenses:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  useEffect(() => {
    let result = [...expenses]

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      result = result.filter(expense => 
        expense.description?.toLowerCase().includes(search) ||
        expense.category?.toLowerCase().includes(search)
      )
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      result = result.filter(expense => expense.category === categoryFilter)
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0
      
      switch (sortField) {
        case "date":
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
          break
        case "amount":
          comparison = a.amount - b.amount
          break
        case "category":
          comparison = (a.category || "").localeCompare(b.category || "")
          break
      }

      return sortDirection === "asc" ? comparison : -comparison
    })

    setFilteredExpenses(result)
  }, [expenses, searchTerm, categoryFilter, sortField, sortDirection])

  useRealtimeSubscription("expenses", fetchExpenses)

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  if (loading) {
    return <div>Loading expenses...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <Input
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {expenseCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort("date")}
              >
                Date {sortField === "date" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort("category")}
              >
                Category {sortField === "category" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead>Description</TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort("amount")}
              >
                Amount {sortField === "amount" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead>Receipt</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredExpenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No expenses found
                </TableCell>
              </TableRow>
            ) : (
              filteredExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>{format(new Date(expense.date), "MMM d, yyyy")}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{expense.category || "Uncategorized"}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate">
                    {expense.description || "—"}
                  </TableCell>
                  <TableCell className="font-medium">
                    ${expense.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {expense.receipt_url ? (
                      <a
                        href={expense.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <FileText className="h-4 w-4" />
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <ExpenseActions expense={expense} onUpdate={fetchExpenses} />
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