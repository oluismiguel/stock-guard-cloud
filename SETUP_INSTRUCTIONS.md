# Instruções de Configuração do Projeto

## 1. Download do Projeto

Este projeto está conectado ao GitHub. Para baixar todos os arquivos:

1. Acesse seu repositório no GitHub
2. Clique em "Code" → "Download ZIP"
3. Ou clone o repositório: `git clone [seu-repositorio-url]`

## 2. Configuração de Novo Banco de Dados Supabase

### 2.1. Criar Projeto Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie uma nova conta ou faça login
3. Clique em "New Project"
4. Preencha os dados do projeto (nome, senha do banco, região)

### 2.2. Executar Migrações do Banco de Dados

No dashboard do Supabase, vá em **SQL Editor** e execute os seguintes scripts na ordem:

#### Script 1: Criar Enum e Tabelas Base

```sql
-- Criar enum para roles
CREATE TYPE app_role AS ENUM ('admin', 'cliente', 'funcionario', 'gerente');

-- Criar tabela de perfis
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de roles de usuário
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'cliente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Criar tabela de produtos
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  supplier TEXT,
  cost_price NUMERIC(10,2),
  sale_price NUMERIC(10,2),
  current_stock INTEGER NOT NULL DEFAULT 0,
  minimum_stock INTEGER NOT NULL DEFAULT 0,
  maximum_stock INTEGER,
  is_active BOOLEAN DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de notificações
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  related_entity_type TEXT,
  related_entity_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Script 2: Habilitar RLS

```sql
-- Habilitar RLS nas tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
```

#### Script 3: Criar Funções

```sql
-- Função para verificar role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Função para obter role do usuário
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Função para criar perfil ao registrar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

-- Função para atribuir role baseado em invite_code
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  invite_code TEXT;
  user_role app_role;
BEGIN
  invite_code := UPPER(TRIM(COALESCE(NEW.raw_user_meta_data->>'invite_code', '')));
  
  IF invite_code = 'MACACO' THEN
    user_role := 'funcionario';
  ELSIF invite_code = 'LEAO' THEN
    user_role := 'gerente';
  ELSE
    user_role := 'cliente';
  END IF;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);
  
  RETURN NEW;
END;
$$;

-- Funções de notificação
CREATE OR REPLACE FUNCTION public.notify_clients_new_product()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  notification_message TEXT;
BEGIN
  IF NEW.is_active THEN
    notification_message := 'Novo produto disponível: ' || NEW.name || ' por R$ ' || NEW.sale_price;
    
    INSERT INTO public.notifications (user_id, title, message, type, related_entity_type, related_entity_id)
    SELECT ur.user_id, 'Novo Produto!', notification_message, 'info', 'product', NEW.id
    FROM public.user_roles ur
    WHERE ur.role = 'cliente';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_clients_price_drop()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  notification_message TEXT;
BEGIN
  IF OLD.sale_price IS NOT NULL AND NEW.sale_price < OLD.sale_price AND NEW.is_active THEN
    notification_message := 'O produto ' || NEW.name || ' teve seu preço reduzido! De R$ ' || OLD.sale_price || ' por R$ ' || NEW.sale_price;
    
    INSERT INTO public.notifications (user_id, title, message, type, related_entity_type, related_entity_id)
    SELECT ur.user_id, 'Preço Reduzido!', notification_message, 'success', 'product', NEW.id
    FROM public.user_roles ur
    WHERE ur.role = 'cliente';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_clients_low_stock()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  notification_message TEXT;
BEGIN
  IF NEW.current_stock <= 5 AND NEW.current_stock > 0 AND NEW.is_active THEN
    notification_message := 'O produto ' || NEW.name || ' está nas últimas unidades! Apenas ' || NEW.current_stock || ' restantes.';
    
    INSERT INTO public.notifications (user_id, title, message, type, related_entity_type, related_entity_id)
    SELECT ur.user_id, 'Últimas Unidades!', notification_message, 'warning', 'product', NEW.id
    FROM public.user_roles ur
    WHERE ur.role = 'cliente';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_low_stock()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  notification_message TEXT;
BEGIN
  IF NEW.current_stock <= NEW.minimum_stock AND NEW.is_active THEN
    notification_message := 'O produto ' || NEW.name || ' (SKU: ' || NEW.sku || ') está com estoque baixo: ' || NEW.current_stock || ' unidades';
    
    INSERT INTO public.notifications (user_id, title, message, type, related_entity_type, related_entity_id)
    SELECT id, 'Estoque Baixo', notification_message, 'warning', 'product', NEW.id
    FROM auth.users;
  END IF;
  
  RETURN NEW;
END;
$$;
```

#### Script 4: Criar Triggers

```sql
-- Trigger para atualizar updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para criar perfil ao registrar
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger para atribuir role ao registrar
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

-- Triggers de notificação de produtos
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

CREATE TRIGGER check_stock_trigger
  AFTER UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.check_low_stock();
```

#### Script 5: Criar Políticas RLS

```sql
-- Políticas para profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Políticas para user_roles
CREATE POLICY "Users can view all roles"
  ON public.user_roles FOR SELECT
  USING (true);

-- Políticas para products
CREATE POLICY "Anyone can view active products"
  ON public.products FOR SELECT
  USING (is_active = true);

CREATE POLICY "Funcionarios and gerentes can insert products"
  ON public.products FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'funcionario'::app_role) OR
    public.has_role(auth.uid(), 'gerente'::app_role)
  );

CREATE POLICY "Funcionarios and gerentes can update products"
  ON public.products FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'funcionario'::app_role) OR
    public.has_role(auth.uid(), 'gerente'::app_role)
  );

CREATE POLICY "Funcionarios and gerentes can delete products"
  ON public.products FOR DELETE
  USING (
    public.has_role(auth.uid(), 'funcionario'::app_role) OR
    public.has_role(auth.uid(), 'gerente'::app_role)
  );

-- Políticas para notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);
```

### 2.3. Configurar Autenticação

No dashboard do Supabase:

1. Vá em **Authentication** → **Providers**
2. Habilite **Email** provider
3. Vá em **Authentication** → **Settings**
4. Em **Auth Providers**, configure:
   - **Enable email confirmations**: DESABILITAR (para desenvolvimento)
   - Isso permite que usuários façam login imediatamente após registro

### 2.4. Obter Credenciais

No dashboard do Supabase, vá em **Settings** → **API** e copie:

- `Project URL`
- `anon/public key`

### 2.5. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com:

```env
VITE_SUPABASE_URL=sua_project_url_aqui
VITE_SUPABASE_PUBLISHABLE_KEY=sua_anon_key_aqui
```

### 2.6. Atualizar Tipos TypeScript

Execute o comando para gerar os tipos do banco:

```bash
npx supabase gen types typescript --project-id "SEU_PROJECT_ID" > src/integrations/supabase/types.ts
```

Ou use a Supabase CLI:

```bash
supabase login
supabase link --project-ref SEU_PROJECT_ID
supabase db pull
npx supabase gen types typescript --local > src/integrations/supabase/types.ts
```

## 3. Instalar Dependências e Executar

```bash
npm install
npm run dev
```

## 4. Códigos de Convite

Para criar usuários com roles específicas, use estes códigos durante o registro:

- **MACACO**: Cria conta de Funcionário
- **LEAO**: Cria conta de Gerente
- **Sem código ou outro código**: Cria conta de Cliente

## 5. Estrutura de Roles

- **Cliente**: Acessa apenas o catálogo de produtos
- **Funcionário**: Gerencia produtos e estoque
- **Gerente**: Acesso completo a dashboard, pedidos, estoque e relatórios

## Observações Importantes

- Este projeto foi desenvolvido no Lovable com Lovable Cloud (Supabase integrado)
- Para usar em produção, configure corretamente as políticas de segurança
- Ative confirmação de email em produção
- Configure limites de taxa (rate limiting) para registro de usuários
- Considere adicionar CAPTCHA no registro para evitar spam
