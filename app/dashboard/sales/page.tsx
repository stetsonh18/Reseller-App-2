"use client"

import { Metadata } from "next"
import { SalesList } from "@/components/sales/sales-list"
import { AddSaleButton } from "@/components/sales/add-sale-button"

export default function SalesPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Sales</h2>
        <AddSaleButton />
      </div>
      <SalesList />
    </div>
  )
}