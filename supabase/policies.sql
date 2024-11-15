-- Enable RLS on all tables
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Create policies for inventory_items
CREATE POLICY "Users can view their own inventory items"
ON inventory_items FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own inventory items"
ON inventory_items FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inventory items"
ON inventory_items FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inventory items"
ON inventory_items FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create policies for sales
CREATE POLICY "Users can view their own sales"
ON sales FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sales"
ON sales FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sales"
ON sales FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sales"
ON sales FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create policies for platforms
CREATE POLICY "Users can view their own platforms"
ON platforms FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own platforms"
ON platforms FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own platforms"
ON platforms FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own platforms"
ON platforms FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create policies for stores
CREATE POLICY "Users can view their own stores"
ON stores FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stores"
ON stores FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stores"
ON stores FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stores"
ON stores FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create policies for categories
CREATE POLICY "Users can view their own categories"
ON categories FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories"
ON categories FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
ON categories FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
ON categories FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create policies for expenses
CREATE POLICY "Users can view their own expenses"
ON expenses FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expenses"
ON expenses FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses"
ON expenses FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses"
ON expenses FOR DELETE
TO authenticated
USING (auth.uid() = user_id);