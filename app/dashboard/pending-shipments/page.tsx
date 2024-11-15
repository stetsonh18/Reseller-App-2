import { Metadata } from "next"
import { PendingShipmentsList } from "@/components/pending-shipments/pending-shipments-list"

export const metadata: Metadata = {
  title: "Pending Shipments | Reseller Inventory Management",
  description: "Manage your pending shipments",
}

export default function PendingShipmentsPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Pending Shipments</h2>
      </div>
      <PendingShipmentsList />
    </div>
  )
}