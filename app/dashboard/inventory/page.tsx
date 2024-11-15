import { Metadata } from "next"
import { InventoryList } from "@/components/inventory/inventory-list"
import { AddInventoryButton } from "@/components/inventory/add-inventory-button"

export const metadata: Metadata = {
  title: "Inventory | Reseller Inventory Management",
  description: "Manage your inventory items",
}

export default function InventoryPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
        <AddInventoryButton />
      </div>
      <InventoryList />
    </div>
  )
}