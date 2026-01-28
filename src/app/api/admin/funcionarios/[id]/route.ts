import { NextRequest, NextResponse } from 'next/server';
import { FuncionarioService } from '@/backend/services/funcionarioService';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

async function getContext() {
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
    const context = await getContext();
    if (!context.user.roles.includes('ADMIN')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const { id } = await params;
    
    try {
        const body = await req.json();
        const existing = await FuncionarioService.buscarPorId(id);
        if (!existing) return NextResponse.json({ error: 'Not Found' }, { status: 404 });
        
        const updated = await FuncionarioService.atualizar(id, body, context);
        return NextResponse.json(updated);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const context = await getContext();
    if (!context.user.roles.includes('ADMIN')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const { id } = await params;
    
    try {
        await FuncionarioService.excluir(id, context);
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
