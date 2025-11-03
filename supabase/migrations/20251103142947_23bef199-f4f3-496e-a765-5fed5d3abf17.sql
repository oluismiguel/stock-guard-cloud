-- Create user_roles table if not exists
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'cliente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "System can insert roles" ON public.user_roles;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own role"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert roles"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (true);

-- Trigger function to assign role based on invite_code
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_code TEXT;
  user_role app_role;
BEGIN
  -- Get invite_code from user metadata
  invite_code := UPPER(TRIM(COALESCE(NEW.raw_user_meta_data->>'invite_code', '')));
  
  -- Determine role based on invite_code
  IF invite_code = 'MACACO' THEN
    user_role := 'funcionario';
  ELSIF invite_code = 'LEAO' THEN
    user_role := 'gerente';
  ELSE
    user_role := 'cliente';
  END IF;
  
  -- Insert role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);
  
  RETURN NEW;
END;
$$;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

-- Update RLS policies on products table
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can view active products" ON public.products;
DROP POLICY IF EXISTS "Only admin can insert products" ON public.products;
DROP POLICY IF EXISTS "Only gerente can insert products" ON public.products;
DROP POLICY IF EXISTS "Admin and funcionario can update products" ON public.products;
DROP POLICY IF EXISTS "Gerente and funcionario can update products" ON public.products;
DROP POLICY IF EXISTS "Only admin can delete products" ON public.products;
DROP POLICY IF EXISTS "Only gerente can delete products" ON public.products;

CREATE POLICY "Authenticated users can view active products"
  ON public.products
  FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY "Only gerente can insert products"
  ON public.products
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'gerente'));

CREATE POLICY "Gerente and funcionario can update products"
  ON public.products
  FOR UPDATE
  USING (has_role(auth.uid(), 'gerente') OR has_role(auth.uid(), 'funcionario'));

CREATE POLICY "Only gerente can delete products"
  ON public.products
  FOR DELETE
  USING (has_role(auth.uid(), 'gerente'));

-- Notification functions for clients
CREATE OR REPLACE FUNCTION public.notify_clients_new_product()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_message TEXT;
BEGIN
  IF NEW.is_active THEN
    notification_message := 'Novo produto disponível: ' || NEW.name || ' por R$ ' || NEW.sale_price;
    
    -- Insert notification only for clients
    INSERT INTO public.notifications (user_id, title, message, type, related_entity_type, related_entity_id)
    SELECT 
      ur.user_id,
      'Novo Produto!',
      notification_message,
      'info',
      'product',
      NEW.id
    FROM public.user_roles ur
    WHERE ur.role = 'cliente';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_clients_price_drop()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_message TEXT;
  price_diff NUMERIC;
BEGIN
  IF OLD.sale_price IS NOT NULL AND NEW.sale_price < OLD.sale_price AND NEW.is_active THEN
    price_diff := OLD.sale_price - NEW.sale_price;
    notification_message := 'O produto ' || NEW.name || ' teve seu preço reduzido! De R$ ' || OLD.sale_price || ' por R$ ' || NEW.sale_price;
    
    -- Insert notification only for clients
    INSERT INTO public.notifications (user_id, title, message, type, related_entity_type, related_entity_id)
    SELECT 
      ur.user_id,
      'Preço Reduzido!',
      notification_message,
      'success',
      'product',
      NEW.id
    FROM public.user_roles ur
    WHERE ur.role = 'cliente';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_clients_low_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_message TEXT;
BEGIN
  -- Notify only when stock is low (last units)
  IF NEW.current_stock <= 5 AND NEW.current_stock > 0 AND NEW.is_active THEN
    notification_message := 'O produto ' || NEW.name || ' está nas últimas unidades! Apenas ' || NEW.current_stock || ' restantes.';
    
    -- Insert notification only for clients
    INSERT INTO public.notifications (user_id, title, message, type, related_entity_type, related_entity_id)
    SELECT 
      ur.user_id,
      'Últimas Unidades!',
      notification_message,
      'warning',
      'product',
      NEW.id
    FROM public.user_roles ur
    WHERE ur.role = 'cliente';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS notify_clients_on_new_product ON public.products;
DROP TRIGGER IF EXISTS notify_clients_on_price_drop ON public.products;
DROP TRIGGER IF EXISTS notify_clients_on_low_stock ON public.products;

-- Triggers for client notifications
CREATE TRIGGER notify_clients_on_new_product
  AFTER INSERT ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_clients_new_product();

CREATE TRIGGER notify_clients_on_price_drop
  AFTER UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_clients_price_drop();

CREATE TRIGGER notify_clients_on_low_stock
  AFTER UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_clients_low_stock();