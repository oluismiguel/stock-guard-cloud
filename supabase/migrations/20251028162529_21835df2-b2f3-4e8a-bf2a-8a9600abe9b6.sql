-- Add new columns to products table for pricing and type
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS product_type TEXT,
ADD COLUMN IF NOT EXISTS purchase_price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS sale_price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS size TEXT;

-- Create sales table to track sales and profit
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  sale_price NUMERIC NOT NULL,
  purchase_price NUMERIC NOT NULL,
  discount NUMERIC DEFAULT 0,
  profit NUMERIC NOT NULL,
  sale_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on sales table
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Create policy for sales
CREATE POLICY "Authenticated users can view sales"
  ON public.sales FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert sales"
  ON public.sales FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sales_product_id ON public.sales(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON public.sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_products_type ON public.products(product_type);

-- Update trigger for low stock notifications to be more specific
DROP TRIGGER IF EXISTS check_low_stock_trigger ON public.products;

CREATE OR REPLACE FUNCTION public.check_stock_levels()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  notification_message TEXT;
  notification_title TEXT;
BEGIN
  -- Check if stock is below minimum
  IF NEW.current_stock <= NEW.minimum_stock AND NEW.is_active THEN
    notification_title := 'Estoque Baixo';
    notification_message := 'O produto ' || NEW.name || ' (SKU: ' || NEW.sku || ') está com estoque baixo: ' || NEW.current_stock || ' unidades';
    
    INSERT INTO public.notifications (user_id, title, message, type, related_entity_type, related_entity_id)
    SELECT 
      id,
      notification_title,
      notification_message,
      'warning',
      'product',
      NEW.id
    FROM auth.users;
  END IF;
  
  -- Check if stock is above maximum
  IF NEW.maximum_stock IS NOT NULL AND NEW.current_stock >= NEW.maximum_stock AND NEW.is_active THEN
    notification_title := 'Estoque Excedente';
    notification_message := 'O produto ' || NEW.name || ' (SKU: ' || NEW.sku || ') está com estoque acima do máximo: ' || NEW.current_stock || ' unidades';
    
    INSERT INTO public.notifications (user_id, title, message, type, related_entity_type, related_entity_id)
    SELECT 
      id,
      notification_title,
      notification_message,
      'info',
      'product',
      NEW.id
    FROM auth.users;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_stock_levels_trigger
  AFTER INSERT OR UPDATE OF current_stock ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.check_stock_levels();

-- Add profile customization fields
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;