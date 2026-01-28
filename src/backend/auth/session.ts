import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { AuthContext, UserSession } from '@/backend/auth/authContext';

export async function getSession(req?: Request): Promise<AuthContext | null> {
  // 1. Tentar pegar token dos cookies (Server Components / API)
  let token = (await cookies()).get('auth_token')?.value;

  // 2. Se não tiver cookie, tentar Header Authorization (API calls externas)
  if (!token && req) {
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }
  }

  if (!token) return null;

  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET_KEY || 'default-secret-key-change-me-in-prod'
    );
    
    const { payload } = await jwtVerify(token, secret);
    
    // Casting seguro pois validamos na criação do token
    const user = payload as unknown as UserSession;
    
    // Validação mínima de integridade
    if (!user.id || !Array.isArray(user.roles)) {
        return null;
    }

    return { user };
  } catch (err) {
    // Token inválido ou expirado
    return null;
  }
}
