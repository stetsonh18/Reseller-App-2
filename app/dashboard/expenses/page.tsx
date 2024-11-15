import { Metadata } from "next"
import { ExpenseList } from "@/components/expenses/expense-list"
import { AddExpenseButton } from "@/components/expenses/add-expense-button"

export const metadata: Metadata = {
  title: "Expenses | Reseller Inventory Management",
  description: "Track and manage your business expenses",
}

export default function ExpensesPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Expenses</h2>
        <AddExpenseButton />
      </div>
      <ExpenseList />
    </div>
  )
}