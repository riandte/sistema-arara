-- Criação da tabela de Clientes (para substituir API Legada)
create table if not exists public.clientes (
  id uuid default gen_random_uuid() primary key,
  cpf_cnpj text unique not null,
  nome text not null,
  nome_fantasia text,
  email text,
  dados jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar Row Level Security (RLS)
alter table public.clientes enable row level security;

-- Política de Leitura Pública (Anon)
create policy "Permitir leitura pública de clientes"
  on public.clientes
  for select
  to anon, authenticated
  using (true);

-- Política de Escrita (Service Role apenas - implícito, mas bom garantir que anon não escreva)
-- (Nenhuma política de insert/update para anon garante que é readonly para publico)
