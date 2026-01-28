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

// Cache para valores validados
const _cache: Partial<z.infer<typeof envSchema>> = {};

// Proxy para validação lazy (sob demanda)
export const env = new Proxy({} as z.infer<typeof envSchema>, {
  get(target, prop) {
    const key = prop as keyof z.infer<typeof envSchema>;
    
    // Retorna do cache se já validado
    if (key in _cache) {
      return _cache[key];
    }

    const shape = envSchema.shape;
    const fieldSchema = shape[key as keyof typeof shape];
    
    // Se a propriedade não está no schema, tenta pegar direto do process.env
    if (!fieldSchema) {
      return process.env[key as string];
    }

    // Valida apenas o campo acessado
    const value = process.env[key as string];
    const result = fieldSchema.safeParse(value);

    if (!result.success) {
      console.error(`❌ Variável de ambiente inválida: ${String(key)}`, result.error.format());
      // Em build time (CI), podemos querer não quebrar se for uma variável de runtime
      // Mas a regra é validar em runtime. Se estamos acessando, é runtime (ou build time precisando do valor).
      // Se o build acessar DATABASE_URL, deve falhar mesmo.
      throw new Error(`Variável de ambiente inválida: ${String(key)}`);
    }

    // Salva no cache e retorna
    const validatedValue = result.data;
    _cache[key] = validatedValue;
    return validatedValue;
  }
});
