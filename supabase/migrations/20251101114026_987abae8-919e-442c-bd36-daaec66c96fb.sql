-- Adicionar trigger para notificações específicas de clientes sobre produtos

-- Função para notificar clientes sobre produtos com estoque baixo
CREATE OR REPLACE FUNCTION public.notify_clients_low_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_message TEXT;
BEGIN
  -- Notificar apenas quando estoque está baixo (ultimas unidades)
  IF NEW.current_stock <= 5 AND NEW.current_stock > 0 AND NEW.is_active THEN
    notification_message := 'O produto ' || NEW.name || ' está nas últimas unidades! Apenas ' || NEW.current_stock || ' restantes.';
    
    -- Inserir notificação apenas para clientes
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

-- Função para notificar clientes sobre novos produtos
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
    
    -- Inserir notificação apenas para clientes
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

-- Função para notificar clientes sobre redução de preço
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
    
    -- Inserir notificação apenas para clientes
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

-- Trigger para estoque baixo (ultimas unidades)
DROP TRIGGER IF EXISTS notify_clients_on_low_stock ON public.products;
CREATE TRIGGER notify_clients_on_low_stock
AFTER UPDATE ON public.products
FOR EACH ROW
WHEN (OLD.current_stock IS DISTINCT FROM NEW.current_stock)
EXECUTE FUNCTION public.notify_clients_low_stock();

-- Trigger para novos produtos
DROP TRIGGER IF EXISTS notify_clients_on_new_product ON public.products;
CREATE TRIGGER notify_clients_on_new_product
AFTER INSERT ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.notify_clients_new_product();

-- Trigger para redução de preço
DROP TRIGGER IF EXISTS notify_clients_on_price_drop ON public.products;
CREATE TRIGGER notify_clients_on_price_drop
AFTER UPDATE ON public.products
FOR EACH ROW
WHEN (OLD.sale_price IS DISTINCT FROM NEW.sale_price)
EXECUTE FUNCTION public.notify_clients_price_drop();