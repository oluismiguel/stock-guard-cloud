-- Criar tabela para armazenar múltiplas imagens de produtos
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ver as imagens
CREATE POLICY "Imagens são visíveis para todos" 
ON public.product_images 
FOR SELECT 
USING (true);

-- Política: Apenas gerentes podem inserir imagens
CREATE POLICY "Gerentes podem inserir imagens" 
ON public.product_images 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'gerente'
  )
);

-- Política: Apenas gerentes podem atualizar imagens
CREATE POLICY "Gerentes podem atualizar imagens" 
ON public.product_images 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'gerente'
  )
);

-- Política: Apenas gerentes podem deletar imagens
CREATE POLICY "Gerentes podem deletar imagens" 
ON public.product_images 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'gerente'
  )
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_product_images_updated_at
BEFORE UPDATE ON public.product_images
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar índice para melhor performance
CREATE INDEX idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX idx_product_images_order ON public.product_images(product_id, display_order);