import { NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import { UserService } from '@/backend/services/userService'
import { comparePassword } from '@/backend/auth/password'
import { AuditService } from '@/backend/auth/audit'
import { prisma } from '@/backend/db'
import { EscopoAtuacao } from '@/shared/types'
import { env } from '@/shared/env'

export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json()
  } catch (e) {
    return NextResponse.json({ success: false, message: 'Invalid JSON' }, { status: 400 })
  }

  const { username, password } = body

  if (!username || !password) {
    AuditService.log('LOGIN_FAILURE', 'anonymous', { reason: 'missing_credentials' }, undefined, 'WARN', req.headers.get('x-forwarded-for') || undefined);
    return NextResponse.json({ success: false, message: 'Usuário e senha obrigatórios' }, { status: 400 })
  }

  try {
    // 1. Buscar usuário
    const user = await UserService.buscarPorEmail(username);

    if (!user) {
        AuditService.log('LOGIN_FAILURE', 'anonymous', { username, reason: 'user_not_found' }, undefined, 'WARN', req.headers.get('x-forwarded-for') || undefined);
        return NextResponse.json({ success: false, message: 'Usuário ou senha inválidos' }, { status: 401 })
    }

    // 2. Validar Senha
    const isPasswordValid = await comparePassword(password, user.password || '');
    
    if (!isPasswordValid) {
        AuditService.log('LOGIN_FAILURE', user.id, { username, reason: 'invalid_password' }, undefined, 'WARN', req.headers.get('x-forwarded-for') || undefined);
        return NextResponse.json({ success: false, message: 'Usuário ou senha inválidos' }, { status: 401 })
    }

    // 3. Validar Status
    if (!user.active) {
        AuditService.log('LOGIN_FAILURE', user.id, { username, reason: 'inactive_user' }, undefined, 'WARN', req.headers.get('x-forwarded-for') || undefined);
        return NextResponse.json({ success: false, message: 'Conta desativada. Contate o administrador.' }, { status: 403 })
    }

    // 4. Buscar Dados do Funcionário (Contexto Organizacional)
    const employee = await prisma.employee.findUnique({
        where: { userId: user.id },
        include: { position: true }
    });

    let funcionarioData = undefined;
    if (employee && employee.active) {
        funcionarioData = {
            id: employee.id,
            setorId: employee.sectorId,
            cargoId: employee.positionId,
            escopo: employee.position.scope as EscopoAtuacao
        };
    }

    // 5. Gerar Token JWT
    const payload = { 
        id: user.id,
        name: user.name, 
        email: user.email, 
        roles: user.roles,
        funcionario: funcionarioData
    };

    const secret = new TextEncoder().encode(env.JWT_SECRET_KEY);

    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('8h') // Expiração fixa de 8h (dia de trabalho)
      .sign(secret);

    // 6. Audit Log Sucesso
    AuditService.log('LOGIN_SUCCESS', user.id, { method: 'password' }, undefined, 'INFO', req.headers.get('x-forwarded-for') || undefined);

    // 7. Retornar Cookie e Resposta
    const response = NextResponse.json({ success: true });
    
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/',
    });

    return response;

  } catch (error: any) {
    console.error('Login error:', error);
    AuditService.log('LOGIN_FAILURE', 'system', { error: error.message }, undefined, 'ERROR', req.headers.get('x-forwarded-for') || undefined);
    return NextResponse.json({ success: false, message: 'Erro interno no servidor' }, { status: 500 })
  }
}
