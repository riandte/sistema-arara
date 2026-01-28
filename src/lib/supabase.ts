import { createClient } from '@supabase/supabase-js';
import { env } from '@/shared/env';

// Verifica se as variáveis de ambiente estão configuradas antes de criar o cliente
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Exporta o cliente ou null se não estiver configurado
// Isso permite que a aplicação continue funcionando (com mocks ou erro controlado) se o Supabase não for usado
export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;
