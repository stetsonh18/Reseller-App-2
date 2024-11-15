// ... (previous code remains the same)
inventory_items: {
  Row: {
    id: string
    user_id: string
    title: string
    description: string | null
    purchase_date: string | null
    purchase_price: number | null
    store_id: string | null
    category_id: string | null
    status: "in_stock" | "listed" | "pending_shipment" | "shipped" | "returned"
    bin_location: string | null
    created_at: string
    updated_at: string
  }
  // ... (rest of the type remains the same)
}
// ... (rest of the file remains the same)