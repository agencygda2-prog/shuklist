-- ShukList Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  town TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  notification_towns TEXT[] DEFAULT ARRAY[]::TEXT[],
  notification_preferences JSONB DEFAULT '{"new_promotions": true, "price_drops": true, "new_products": false, "promotion_ending_soon": true}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stores table
CREATE TABLE IF NOT EXISTS public.stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  town TEXT NOT NULL,
  address TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, town)
);

-- Products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT NOT NULL,
  barcode TEXT UNIQUE,
  default_unit TEXT NOT NULL,
  image_url TEXT,
  created_by UUID REFERENCES public.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prices table
CREATE TABLE IF NOT EXISTS public.prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL,
  is_promotion BOOLEAN DEFAULT FALSE,
  promotion_end_date DATE,
  date_recorded DATE NOT NULL DEFAULT CURRENT_DATE,
  photo_url TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.users(id) NOT NULL,
  verified_by UUID[] DEFAULT ARRAY[]::UUID[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shopping Lists table
CREATE TABLE IF NOT EXISTS public.shopping_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shopping List Items table
CREATE TABLE IF NOT EXISTS public.shopping_list_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id UUID REFERENCES public.shopping_lists(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('new_promotion', 'price_drop', 'new_product', 'promotion_ending')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  related_store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Price Flags table (for reporting incorrect prices)
CREATE TABLE IF NOT EXISTS public.price_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  price_id UUID REFERENCES public.prices(id) ON DELETE CASCADE NOT NULL,
  flagged_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_prices_product_id ON public.prices(product_id);
CREATE INDEX IF NOT EXISTS idx_prices_store_id ON public.prices(store_id);
CREATE INDEX IF NOT EXISTS idx_prices_created_by ON public.prices(created_by);
CREATE INDEX IF NOT EXISTS idx_prices_date_recorded ON public.prices(date_recorded DESC);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_shopping_list_items_list_id ON public.shopping_list_items(list_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_flags ENABLE ROW LEVEL SECURITY;

-- Users: Users can read all, update only their own
CREATE POLICY "Users can view all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Stores: Everyone can read, authenticated users can create
CREATE POLICY "Anyone can view stores" ON public.stores FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create stores" ON public.stores FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Store creators can update" ON public.stores FOR UPDATE USING (auth.uid() = created_by);

-- Products: Everyone can read, authenticated users can create
CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create products" ON public.products FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Prices: Everyone can read, authenticated users can create/update
CREATE POLICY "Anyone can view prices" ON public.prices FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create prices" ON public.prices FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Price creators can update" ON public.prices FOR UPDATE USING (auth.uid() = created_by);

-- Shopping Lists: Users can only see and manage their own
CREATE POLICY "Users can view own lists" ON public.shopping_lists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own lists" ON public.shopping_lists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own lists" ON public.shopping_lists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own lists" ON public.shopping_lists FOR DELETE USING (auth.uid() = user_id);

-- Shopping List Items: Users can manage items in their own lists
CREATE POLICY "Users can view own list items" ON public.shopping_list_items FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.shopping_lists WHERE id = list_id AND user_id = auth.uid()));
CREATE POLICY "Users can create own list items" ON public.shopping_list_items FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.shopping_lists WHERE id = list_id AND user_id = auth.uid()));
CREATE POLICY "Users can update own list items" ON public.shopping_list_items FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.shopping_lists WHERE id = list_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete own list items" ON public.shopping_list_items FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.shopping_lists WHERE id = list_id AND user_id = auth.uid()));

-- Notifications: Users can only see their own
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Price Flags: Everyone can read, authenticated users can create
CREATE POLICY "Anyone can view flags" ON public.price_flags FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create flags" ON public.price_flags FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can update flags" ON public.price_flags FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prices_updated_at BEFORE UPDATE ON public.prices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shopping_lists_updated_at BEFORE UPDATE ON public.shopping_lists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial stores (your 5 stores)
INSERT INTO public.stores (name, town) VALUES
  ('PAM', 'Grottaminarda'),
  ('Eurospin', 'Grottaminarda'),
  ('MD', 'Grottaminarda'),
  ('Conad', 'Grottaminarda'),
  ('GranRisparmio', 'Villanova del Battista')
ON CONFLICT (name, town) DO NOTHING;
