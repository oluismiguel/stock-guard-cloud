-- Atualizar a função de notificação de novo produto para usar os títulos corretos para clientes
CREATE OR REPLACE FUNCTION public.notify_clients_new_product()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  notification_message TEXT;
BEGIN
  IF NEW.is_active THEN
    notification_message := 'Novo produto disponível: ' || NEW.name || ' por R$ ' || NEW.sale_price;
    
    -- Insert notification only for clients
    INSERT INTO public.notifications (user_id, title, message, type, related_entity_type, related_entity_id)
    SELECT 
      ur.user_id,
      'NOVO ITEM DISPONÍVEL NA LOJA!!!',
      notification_message,
      'info',
      'product',
      NEW.id
    FROM public.user_roles ur
    WHERE ur.role = 'cliente';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Atualizar a função de notificação de redução de preço para usar os títulos corretos para clientes
CREATE OR REPLACE FUNCTION public.notify_clients_price_drop()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
      'IMPERDÍVEL, PRODUTO SOFREU DESCONTO',
      notification_message,
      'success',
      'product',
      NEW.id
    FROM public.user_roles ur
    WHERE ur.role = 'cliente';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Atualizar a função de notificação de estoque baixo para clientes usar o título correto
CREATE OR REPLACE FUNCTION public.notify_clients_low_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  notification_message TEXT;
BEGIN
  -- Notify only when stock is low (last units) - apenas para clientes
  IF NEW.current_stock <= 5 AND NEW.current_stock > 0 AND NEW.is_active THEN
    notification_message := 'O produto ' || NEW.name || ' está nas últimas unidades! Apenas ' || NEW.current_stock || ' restantes.';
    
    -- Insert notification only for clients
    INSERT INTO public.notifications (user_id, title, message, type, related_entity_type, related_entity_id)
    SELECT 
      ur.user_id,
      'ALERTA, ÚLTIMAS UNIDADES',
      notification_message,
      'warning',
      'product',
      NEW.id
    FROM public.user_roles ur
    WHERE ur.role = 'cliente';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Atualizar a função de notificação de estoque baixo para funcionários/gerentes (manter como estava)
CREATE OR REPLACE FUNCTION public.check_stock_levels()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  notification_message TEXT;
  notification_title TEXT;
BEGIN
  -- Check if stock is below minimum - apenas para funcionários e gerentes
  IF NEW.current_stock <= NEW.minimum_stock AND NEW.is_active THEN
    notification_title := 'Estoque Baixo';
    notification_message := 'O produto ' || NEW.name || ' (SKU: ' || NEW.sku || ') está com estoque baixo: ' || NEW.current_stock || ' unidades';
    
    INSERT INTO public.notifications (user_id, title, message, type, related_entity_type, related_entity_id)
    SELECT 
      ur.user_id,
      notification_title,
      notification_message,
      'warning',
      'product',
      NEW.id
    FROM public.user_roles ur
    WHERE ur.role IN ('funcionario', 'gerente');
  END IF;
  
  -- Check if stock is above maximum - apenas para funcionários e gerentes
  IF NEW.maximum_stock IS NOT NULL AND NEW.current_stock >= NEW.maximum_stock AND NEW.is_active THEN
    notification_title := 'Estoque Excedente';
    notification_message := 'O produto ' || NEW.name || ' (SKU: ' || NEW.sku || ') está com estoque acima do máximo: ' || NEW.current_stock || ' unidades';
    
    INSERT INTO public.notifications (user_id, title, message, type, related_entity_type, related_entity_id)
    SELECT 
      ur.user_id,
      notification_title,
      notification_message,
      'info',
      'product',
      NEW.id
    FROM public.user_roles ur
    WHERE ur.role IN ('funcionario', 'gerente');
  END IF;
  
  RETURN NEW;
END;
$function$;