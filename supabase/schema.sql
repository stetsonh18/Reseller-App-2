-- Add return-related columns to sales table
ALTER TABLE sales
ADD COLUMN IF NOT EXISTS return_date DATE,
ADD COLUMN IF NOT EXISTS return_reason TEXT,
ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS return_shipping_cost DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS restocking_fee DECIMAL(10, 2);

-- Update the status check constraint for inventory_items
ALTER TABLE inventory_items DROP CONSTRAINT IF EXISTS inventory_items_status_check;
ALTER TABLE inventory_items ADD CONSTRAINT inventory_items_status_check 
  CHECK (status IN ('in_stock', 'listed', 'pending_shipment', 'shipped', 'returned'));