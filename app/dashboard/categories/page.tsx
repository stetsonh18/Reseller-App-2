import { Metadata } from "next"
import { CategoryList } from "@/components/categories/category-list"
import { AddCategoryButton } from "@/components/categories/add-category-button"

export const metadata: Metadata = {
  title: "Categories | Reseller Inventory Management",
  description: "Manage your inventory categories and subcategories",
}

export default function CategoriesPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Categories</h2>
        <AddCategoryButton />
      </div>
      <CategoryList />
    </div>
  )
}