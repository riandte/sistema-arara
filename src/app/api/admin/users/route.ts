import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/services/userService';
import { FuncionarioService } from '@/lib/services/funcionarioService';
import { AuthContext } from '@/lib/auth/authContext';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

// Helper de Auth (Padronizado)
async function getContext(): Promise<AuthContext> {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    let user = { id: 'anon', name: 'Anon', email: '', roles: [] as string[] };
    
    if (token) {
        try {
            const secret = new TextEncoder().encode(process.env.JWT_SECRET_KEY || 'default-secret-key-change-me-in-prod');
            const { payload } = await jwtVerify(token, secret);
            user = { 
                id: (payload.sub as string) || (payload.id as string) || 'anon',
                name: (payload.name as string) || '',
                email: (payload.email as string) || '',
                roles: (payload.roles as string[]) || []
            };
        } catch {}
    }
    return { user };
}

export async function GET(req: NextRequest) {
  try {
    const context = await getContext();
    if (!context.user.roles.includes('ADMIN')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const users = await UserService.listar(context);
    return NextResponse.json(users);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const context = await getContext();
    if (!context.user.roles.includes('ADMIN')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await req.json();
    const user = await UserService.criar(data, context);
    
    // Auto-create Funcionario if cargo/setor provided
    if (data.cargoId && data.setorId) {
        try {
            await FuncionarioService.criar({
                nome: user.name,
                emailCorporativo: user.email,
                cargoId: data.cargoId,
                setorId: data.setorId,
                usuarioId: user.id,
                ativo: true
            }, context);
        } catch (e) {
            console.error('Erro ao criar funcionário vinculado:', e);
            // Não falha a criação do usuário, mas loga erro
        }
    }

    return NextResponse.json(user);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
