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

export async function GET(req: NextRequest) {
  try {
    const context = await getContext(req);
    const roles = await RoleService.listar(context);
    return NextResponse.json(roles);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const context = await getContext(req);
    const data = await req.json();
    const role = await RoleService.criar(data, context);
    return NextResponse.json(role);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
