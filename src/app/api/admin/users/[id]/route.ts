import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/services/userService';
import { FuncionarioService } from '@/lib/services/funcionarioService';
import { AuthContext } from '@/lib/auth/authContext';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const context = await getContext();
    if (!context.user.roles.includes('ADMIN')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await req.json();
    const user = await UserService.atualizar(id, data, context);
    
    // Update/Create Funcionario if cargo/setor provided
    if (data.cargoId && data.setorId) {
        try {
            const func = await FuncionarioService.buscarPorUsuarioId(id);
            
            if (func) {
                await FuncionarioService.atualizar(func.id, {
                    cargoId: data.cargoId,
                    setorId: data.setorId,
                    nome: user.name, // Keep name synced
                    emailCorporativo: user.email // Keep email synced
                }, context);
            } else {
                 await FuncionarioService.criar({
                    nome: user.name,
                    emailCorporativo: user.email,
                    cargoId: data.cargoId,
                    setorId: data.setorId,
                    usuarioId: user.id,
                    ativo: true
                }, context);
            }
        } catch (e) {
            console.error('Erro ao sincronizar funcionário:', e);
        }
    }

    return NextResponse.json(user);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const context = await getContext();
        if (!context.user.roles.includes('ADMIN')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Soft delete user via service (need to add this method to UserService if not exists, 
        // or just update active=false here if UserService allows generic update)
        // UserService.atualizar allows updating active status.
        await UserService.atualizar(id, { active: false }, context);
        
        // Also deactivate employee if exists
        const func = await FuncionarioService.buscarPorUsuarioId(id);
        if (func) {
            await FuncionarioService.atualizar(func.id, { ativo: false }, context);
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
