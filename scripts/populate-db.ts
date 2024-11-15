"use client"

import { supabase } from "@/lib/supabase"

// Sample data
const stores = [
  { name: "Goodwill", location: "123 Main St, Austin, TX", notes: "Best location for electronics" },
  { name: "Target", location: "456 Oak Ave, Austin, TX", notes: "Clearance section in back" },
  { name: "Walmart", location: "789 Pine Rd, Austin, TX", notes: "Check seasonal items" },
  { name: "Ross", location: "321 Cedar Ln, Austin, TX", notes: "Morning visits best" },
  { name: "TJ Maxx", location: "654 Elm St, Austin, TX", notes: "Great for designer items" }
]

const platforms = [
  { 
    name: "eBay", 
    fee_structure: { baseFee: 0, percentageFee: 12.9 },
    active: true 
  },
  { 
    name: "Amazon", 
    fee_structure: { baseFee: 0, percentageFee: 15 },
    active: true 
  },
  { 
    name: "Mercari", 
    fee_structure: { baseFee: 0, percentageFee: 10 },
    active: true 
  },
  { 
    name: "Poshmark", 
    fee_structure: { baseFee: 0, percentageFee: 20 },
    active: true 
  },
  { 
    name: "Facebook Marketplace", 
    fee_structure: { baseFee: 0, percentageFee: 5 },
    active: true 
  }
]

const categories = [
  { name: "Electronics", parent_id: null },
  { name: "Clothing", parent_id: null },
  { name: "Home & Garden", parent_id: null },
  { name: "Toys & Games", parent_id: null },
  { name: "Collectibles", parent_id: null }
]

const inventoryItems = [
  {
    title: "Apple AirPods Pro",
    description: "Sealed in box, latest model",
    purchase_price: 150,
    status: "in_stock",
    bin_location: "A1"
  },
  {
    title: "Nike Air Jordan 1",
    description: "Size 10, Red/Black colorway",
    purchase_price: 89.99,
    status: "in_stock",
    bin_location: "B2"
  },
  {
    title: "Dyson V8 Vacuum",
    description: "Refurbished, all attachments included",
    purchase_price: 120,
    status: "sold",
    bin_location: "C3"
  },
  {
    title: "LEGO Star Wars Set",
    description: "Millennium Falcon, complete set",
    purchase_price: 75,
    status: "in_stock",
    bin_location: "D4"
  },
  {
    title: "Pokemon Cards Collection",
    description: "Rare holos from Base Set",
    purchase_price: 200,
    status: "in_stock",
    bin_location: "E5"
  }
]

const sales = [
  {
    sale_price: 249.99,
    shipping_collected: 12.99,
    shipping_cost: 8.50,
    sale_date: "2024-03-15"
  },
  {
    sale_price: 159.99,
    shipping_collected: 9.99,
    shipping_cost: 5.75,
    sale_date: "2024-03-14"
  },
  {
    sale_price: 299.99,
    shipping_collected: 15.99,
    shipping_cost: 12.25,
    sale_date: "2024-03-13"
  }
]

async function populateDatabase(userId: string) {
  try {
    // Insert stores
    const { data: storesData, error: storesError } = await supabase
      .from("stores")
      .insert(stores.map(store => ({ ...store, user_id: userId })))
      .select()

    if (storesError) throw storesError
    console.log("Stores added:", storesData)

    // Insert platforms
    const { data: platformsData, error: platformsError } = await supabase
      .from("platforms")
      .insert(platforms.map(platform => ({ ...platform, user_id: userId })))
      .select()

    if (platformsError) throw platformsError
    console.log("Platforms added:", platformsData)

    // Insert categories
    const { data: categoriesData, error: categoriesError } = await supabase
      .from("categories")
      .insert(categories.map(category => ({ ...category, user_id: userId })))
      .select()

    if (categoriesError) throw categoriesError
    console.log("Categories added:", categoriesData)

    // Insert inventory items
    const { data: inventoryData, error: inventoryError } = await supabase
      .from("inventory_items")
      .insert(
        inventoryItems.map((item, index) => ({
          ...item,
          user_id: userId,
          store_id: storesData[index % storesData.length].id,
          category_id: categoriesData[index % categoriesData.length].id,
          purchase_date: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }))
      )
      .select()

    if (inventoryError) throw inventoryError
    console.log("Inventory items added:", inventoryData)

    // Insert sales for sold items
    const soldItems = inventoryData.filter(item => item.status === "sold")
    const { data: salesData, error: salesError } = await supabase
      .from("sales")
      .insert(
        sales.map((sale, index) => ({
          ...sale,
          user_id: userId,
          inventory_item_id: soldItems[index % soldItems.length].id,
          platform_id: platformsData[index % platformsData.length].id,
          platform_fees: sale.sale_price * 0.1,
          transaction_fees: sale.sale_price * 0.029 + 0.30,
          profit: sale.sale_price - soldItems[index % soldItems.length].purchase_price - (sale.sale_price * 0.1) - (sale.sale_price * 0.029 + 0.30) + sale.shipping_collected - sale.shipping_cost
        }))
      )
      .select()

    if (salesError) throw salesError
    console.log("Sales added:", salesData)

    console.log("Database successfully populated with demo data!")
  } catch (error) {
    console.error("Error populating database:", error)
    throw error
  }
}

export { populateDatabase }