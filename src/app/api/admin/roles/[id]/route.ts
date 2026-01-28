import { NextRequest, NextResponse } from 'next/server';
import { RoleService } from '@/backend/services/roleService';
import { AuthContext } from '@/backend/auth/authContext';

async function getContext(req: NextRequest): Promise<AuthContext> {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token');
    if (!token) throw new Error('Não autenticado');
    try {
        const payload = JSON.parse(Buffer.from(token.value.split('.')[1], 'base64').toString());
        return { user: { id: payload.userId, name: payload.name, email: payload.email, roles: payload.roles } };
    } catch (e) { throw new Error('Token inválido'); }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params; // id here is role name actually, or generic id? Route is [id].
    // RoleService uses 'name' as key. 
    // The route parameter will be used as name.
    const context = await getContext(req);
    const data = await req.json();
    // Decode URI component because role name might have spaces or special chars
    const roleName = decodeURIComponent(id);
    const role = await RoleService.atualizar(roleName, data, context);
    return NextResponse.json(role);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const context = await getContext(req);
    const roleName = decodeURIComponent(id);
    await RoleService.excluir(roleName, context);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
