import { Metadata } from "next"
import { PlatformList } from "@/components/platforms/platform-list"
import { AddPlatformButton } from "@/components/platforms/add-platform-button"

export const metadata: Metadata = {
  title: "Platforms | Reseller Inventory Management",
  description: "Manage your selling platforms and fee structures",
}

export default function PlatformsPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Platforms</h2>
        <AddPlatformButton />
      </div>
      <PlatformList />
    </div>
  )
}