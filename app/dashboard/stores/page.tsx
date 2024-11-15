import { Metadata } from "next"
import { StoreList } from "@/components/stores/store-list"
import { AddStoreButton } from "@/components/stores/add-store-button"

export const metadata: Metadata = {
  title: "Stores | Reseller Inventory Management",
  description: "Manage your sourcing stores and locations",
}

export default function StoresPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Stores</h2>
        <AddStoreButton />
      </div>
      <StoreList />
    </div>
  )
}