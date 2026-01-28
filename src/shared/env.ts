import { z } from 'zod';

const envSchema = z.object({
  // Banco de Dados
  DATABASE_URL: z.string().url().min(1, "DATABASE_URL é obrigatória"),

  // Segurança
  JWT_SECRET_KEY: z.string().min(32, "JWT_SECRET_KEY deve ter pelo menos 32 caracteres"),
  
  // API Externa (Legado)
  // Opcionais em dev (fallback mock), mas ideais em prod. 
  // Se forem obrigatórias em prod, podemos ajustar a lógica.
  // Por enquanto, seguindo o padrão atual, mas validando formato se existirem.
  LOCAPP_BASE_URL: z.string().url().optional(),
  LOCAPP_CNPJ: z.string().optional(),
  LOCAPP_SECRET: z.string().optional(),

  // Ambiente
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // Opcional: Chave para sistema de integração
  API_SECRET_KEY: z.string().optional(),

  // Supabase (Opcional, usado se configurado para substituir LocApp Legacy)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
});

// Validação
const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Configuração de ambiente inválida:', _env.error.format());
  throw new Error('Variáveis de ambiente inválidas. Verifique os logs.');
}

export const env = _env.data;
