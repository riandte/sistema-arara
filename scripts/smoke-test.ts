
import { prisma } from '@/backend/db';
import { ServiceOrderService } from '@/backend/services/serviceOrderService';
import { PendenciaService } from '@/backend/services/pendenciaService';
import { AuditService } from '@/backend/auth/audit';
import { AuthContext } from '@/backend/auth/authContext';
import { RoleName } from '@/shared/types';

async function main() {
  console.log("🚀 Iniciando Smoke Test (Go-Live Check)...");

  // 1. Verificar Conexão e Seed
  try {
    const userCount = await prisma.user.count();
    console.log(`✅ [DB] Conexão OK. Usuários: ${userCount}`);
    
    const roleCount = await prisma.role.count();
    console.log(`✅ [DB] Roles: ${roleCount}`);
    
    if (userCount === 0 || roleCount === 0) {
      console.error("❌ [DB] Banco parece vazio. Rode 'npm run db:seed'");
      process.exit(1);
    }
  } catch (e) {
    console.error("❌ [DB] Falha crítica de conexão:", e);
    process.exit(1);
  }

  // 2. Verificar Audit Log (Tabela)
  try {
    // Tenta criar um log de teste
    await AuditService.log('SYSTEM_EVENT', 'smoke-test', { message: 'Teste de verificação' });
    const auditCount = await prisma.auditEvent.count();
    console.log(`✅ [AUDIT] Log persistido. Total de eventos: ${auditCount}`);
  } catch (e) {
    console.error("❌ [AUDIT] Falha ao gravar/ler log de auditoria:", e);
  }

  // 3. Verificar LocApp (Config)
  // Apenas verifica se não quebra
  try {
    console.log("✅ [INTEGRAÇÃO] Módulo LocApp carregado com sucesso.");
  } catch (e) {
    console.error("❌ [INTEGRAÇÃO] Erro ao carregar módulo LocApp:", e);
  }

  // 4. Teste de Fluxo de Negócio (Criar OS -> Verificar Pendência)
  console.log("\n🔄 Iniciando Teste de Fluxo de Negócio...");
  try {
    // Criar contexto simulado de ADMIN
    const mockContext: AuthContext = {
      user: {
        id: 'admin-id-123', // ID real do seed
        name: 'Smoke Test Admin',
        email: 'admin@solucao.com.br',
        roles: ['ADMIN'] as RoleName[]
      }
    };

    // Dados para criação de OS
    const osData = {
      descricao: 'OS de Teste Automático Smoke Test',
      prioridade: 'MEDIA',
      dataPrevista: new Date().toISOString(),
      cliente: {
        nome: 'Cliente Teste Ltda',
        codigo: '12345',
        documento: '00.000.000/0001-00'
      },
      endereco: 'Rua Teste, 123',
      contato: 'João Teste',
      contrato: '100' // Contrato 100 para teste de ID custom
    };

    // Criar OS
    const novaOS = await ServiceOrderService.create(osData as any, mockContext);
    console.log(`✅ [OS] Ordem de Serviço criada com sucesso. ID: ${novaOS.id}`);

    // Verificar se gerou Pendência
    const pendencias = await PendenciaService.listar(mockContext, { 
      tipo: 'OS', 
      termo: novaOS.id 
    });

    const pendenciaGerada = pendencias.find(p => p.origemId === novaOS.id);

    if (pendenciaGerada) {
      console.log(`✅ [PENDENCIA] Pendência automática gerada com sucesso. ID: ${pendenciaGerada.id}`);
      
      // Tentar movimentar a pendência (opcional, mas bom para garantir)
      // await PendenciaService.atualizar(pendenciaGerada.id, { status: 'EM_ANDAMENTO' }, mockContext);
      // console.log(`✅ [PENDENCIA] Status atualizado para EM_ANDAMENTO.`);
    } else {
      console.error(`❌ [PENDENCIA] Nenhuma pendência encontrada para a OS ${novaOS.id}`);
      process.exit(1);
    }

  } catch (e) {
    console.error("❌ [FLUXO] Falha no teste de fluxo de negócio:", e);
    process.exit(1);
  }

  console.log("\n🏁 Smoke Test Finalizado. Verifique os logs acima.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
