import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

// Configuração para garantir que estamos usando a mesma lógica da aplicação
const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("\n🔍 DIAGNÓSTICO DE CONEXÃO COM O BANCO DE DADOS");
  console.log("===============================================");
  
  // 1. Verificar Variável de Ambiente
  const url = process.env.DATABASE_URL;
  if (!url) {
      console.error("❌ ERRO: DATABASE_URL não encontrada no arquivo .env");
      process.exit(1);
  }
  
  // Mascarar senha para exibição segura
  const safeUrl = url.replace(/:([^:@]+)@/, ':****@');
  console.log(`📡 URL de Conexão (.env): ${safeUrl}`);

  try {
    // 2. Testar Conexão Real
    console.log("⏳ Testando conexão...");
    await prisma.$connect();
    console.log("✅ Conexão estabelecida com sucesso!");
    
    // 3. Verificar Dados (Prova de que é o banco correto e que tem dados)
    const userCount = await prisma.user.count();
    const roleCount = await prisma.role.count();
    const osCount = await prisma.serviceOrder.count();

    console.log("\n📊 ESTATÍSTICAS DO BANCO:");
    console.log(`   - Usuários: ${userCount}`);
    console.log(`   - Perfis (Roles): ${roleCount}`);
    console.log(`   - Ordens de Serviço: ${osCount}`);

    if (userCount === 0) {
        console.warn("\n⚠️ AVISO: O banco está conectado mas está VAZIO.");
        console.warn("   Dica: Rode 'npx prisma db seed' para popular os dados iniciais.");
    } else {
        // Listar alguns usuários para confirmação visual
        const users = await prisma.user.findMany({ 
            take: 3,
            select: { name: true, email: true, roles: { select: { role: { select: { name: true } } } } }
        });
        console.log("\n📋 EXEMPLOS DE DADOS ENCONTRADOS:");
        users.forEach(u => console.log(`   - ${u.name} (${u.email}) [${u.roles.map(r => r.role.name).join(', ')}]`));
    }

    // 4. Verificar Tabela de Migrations
    const migrations = await prisma.$queryRaw`SELECT migration_name, finished_at FROM "_prisma_migrations" ORDER BY finished_at DESC LIMIT 1;`;
    console.log("\n🗓️ ÚLTIMA MIGRAÇÃO APLICADA:");
    console.log(`   - ${(migrations as any)[0]?.migration_name || 'Nenhuma'}`);

  } catch (e: any) {
    console.error("\n❌ FALHA NA CONEXÃO:");
    console.error(`   Erro: ${e.message}`);
    console.error("   Verifique se o container/serviço do PostgreSQL está rodando.");
  } finally {
    await prisma.$disconnect();
  }
}

main();
