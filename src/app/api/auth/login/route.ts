import { NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import { UserService } from '@/lib/services/userService'
import { comparePassword } from '@/lib/auth/password'
import { AuditService } from '@/lib/auth/audit'
import { prisma } from '@/lib/db'
import { EscopoAtuacao } from '@/lib/types'

export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json()
  } catch (e) {
    return NextResponse.json({ success: false, message: 'Invalid JSON' }, { status: 400 })
  }

  const { username, password } = body

  if (!username || !password) {
    AuditLogger.log('LOGIN_FAIL', { reason: 'missing_credentials' }, undefined, req);
    return NextResponse.json({ success: false, message: 'Usuário e senha obrigatórios' }, { status: 400 })
  }

  try {
    // 1. Buscar usuário (Email ou Nome - manter compatibilidade com login antigo se necessário, mas ideal é Email)
    // O mock aceitava nome ou email. Vamos tentar manter se possível, mas UserService.buscarPorEmail é estrito.
    // Vamos usar buscarPorEmail primeiro. Se falhar e username não parecer email, talvez buscar por nome?
    // Melhor padronizar para Email. Mas se o usuário digitar nome, falha.
    // Vou assumir Email por enquanto.
    
    // Pequeno ajuste: se UserService só busca por email, e o input for nome, vai falhar.
    // Para produção, login deve ser email.
    
    const user = await UserService.buscarPorEmail(username);

    if (!user) {
        AuditLogger.log('LOGIN_FAIL', { username, reason: 'user_not_found' }, undefined, req);
        return NextResponse.json({ success: false, message: 'Usuário ou senha inválidos' }, { status: 401 })
    }

    // 2. Validar Senha
    // user.password contém o hash retornado pelo UserService (mapeado de passwordHash)
    const isPasswordValid = await comparePassword(password, user.password || '');
    
    if (!isPasswordValid) {
        AuditLogger.log('LOGIN_FAIL', { username, userId: user.id, reason: 'invalid_password' }, user.id, req);
        return NextResponse.json({ success: false, message: 'Usuário ou senha inválidos' }, { status: 401 })
    }

    // 3. Validar Status
    if (!user.active) {
        AuditLogger.log('LOGIN_FAIL', { username, userId: user.id, reason: 'inactive_user' }, user.id, req);
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

    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET_KEY || 'default-secret-key-change-me-in-prod'
    );

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
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/',
    });

    return response;

  } catch (error: any) {
    console.error('Login error:', error);
    AuditLogger.log('LOGIN_FAIL', { error: error.message }, undefined, req);
    return NextResponse.json({ success: false, message: 'Erro interno no servidor' }, { status: 500 })
  }
}
