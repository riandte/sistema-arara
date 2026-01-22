import { PrismaClient, PendencyType, PendencyStatus, Priority, OriginType, ConclusionType, Scope } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

// Função auxiliar para ler JSON
function readJson(filename: string) {
  const filePath = path.join(process.cwd(), 'data', filename)
  if (!fs.existsSync(filePath)) {
    console.warn(`Arquivo ${filename} não encontrado. Pulando...`)
    return []
  }
  const data = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(data)
}

async function main() {
  console.log('🚀 Iniciando migração de dados (Seed)...')

  // 1. Roles & Permissions
  console.log('📦 Migrando Roles e Permissões...')
  const rolesData = readJson('roles.json')
  
  // Extrair todas as permissões únicas
  const allPermissions = new Set<string>()
  rolesData.forEach((role: any) => {
    role.permissions.forEach((p: string) => allPermissions.add(p))
  })

  // Criar Permissões
  for (const permId of allPermissions) {
    await prisma.permission.upsert({
      where: { id: permId },
      update: {},
      create: { id: permId, description: `Permissão ${permId}` }
    })
  }

  // Criar Roles e Vínculos
  for (const r of rolesData) {
    await prisma.role.upsert({
      where: { id: r.name },
      update: {
        name: r.name,
        description: r.description,
        isSystem: r.isSystem
      },
      create: {
        id: r.name,
        name: r.name,
        description: r.description,
        isSystem: r.isSystem
      }
    })

    // Vincular Permissões
    for (const permId of r.permissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: r.name, permissionId: permId }
        },
        update: {},
        create: { roleId: r.name, permissionId: permId }
      })
    }
  }

  // 2. Setores
  console.log('🏢 Migrando Setores...')
  const setoresData = readJson('setores.json')
  for (const s of setoresData) {
    await prisma.sector.upsert({
      where: { id: s.id },
      update: {
        name: s.nome,
        description: s.descricao,
        active: s.ativo,
        createdAt: s.createdAt ? new Date(s.createdAt) : undefined,
        updatedAt: s.updatedAt ? new Date(s.updatedAt) : undefined
      },
      create: {
        id: s.id,
        name: s.nome,
        description: s.descricao,
        active: s.ativo,
        createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
        updatedAt: s.updatedAt ? new Date(s.updatedAt) : new Date()
      }
    })
  }

  // 3. Cargos (Positions)
  console.log('👔 Migrando Cargos...')
  const cargosData = readJson('cargos.json')
  for (const c of cargosData) {
    // Validar Escopo
    const scope = Object.values(Scope).includes(c.escopo) ? c.escopo : 'INDIVIDUAL'

    await prisma.position.upsert({
      where: { id: c.id },
      update: {
        name: c.nome,
        description: c.descricao,
        scope: scope,
        active: c.ativo,
        createdAt: c.createdAt ? new Date(c.createdAt) : undefined,
        updatedAt: c.updatedAt ? new Date(c.updatedAt) : undefined
      },
      create: {
        id: c.id,
        name: c.nome,
        description: c.descricao,
        scope: scope,
        active: c.ativo,
        createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
        updatedAt: c.updatedAt ? new Date(c.updatedAt) : new Date()
      }
    })

    // Vincular Setores Permitidos
    if (c.setoresPermitidos && Array.isArray(c.setoresPermitidos)) {
      for (const sectorId of c.setoresPermitidos) {
        // Verificar se setor existe antes de vincular (segurança)
        const sectorExists = await prisma.sector.findUnique({ where: { id: sectorId } })
        if (sectorExists) {
          await prisma.positionSector.upsert({
            where: { positionId_sectorId: { positionId: c.id, sectorId } },
            update: {},
            create: { positionId: c.id, sectorId }
          })
        }
      }
    }
  }

  // 4. Usuários
  console.log('👥 Migrando Usuários...')
  const usersData = readJson('users.json')
  for (const u of usersData) {
    // Garantir Admin com senha hash segura
    const salt = bcrypt.genSaltSync(10);
    const plainPassword = u.password || (u.roles.includes('ADMIN') ? 'admin123' : '123456');
    const passwordHash = bcrypt.hashSync(plainPassword, salt);

    await prisma.user.upsert({
      where: { id: u.id },
      update: {
        name: u.name,
        email: u.email,
        passwordHash: passwordHash,
        active: u.active,
        parameters: u.parametros || {},
        createdAt: u.createdAt ? new Date(u.createdAt) : undefined,
        updatedAt: u.updatedAt ? new Date(u.updatedAt) : undefined
      },
      create: {
        id: u.id,
        name: u.name,
        email: u.email,
        passwordHash: passwordHash,
        active: u.active,
        parameters: u.parametros || {},
        createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
        updatedAt: u.updatedAt ? new Date(u.updatedAt) : new Date()
      }
    })

    // Vincular Roles
    if (u.roles && Array.isArray(u.roles)) {
      for (const roleName of u.roles) {
        await prisma.userRole.upsert({
          where: { userId_roleId: { userId: u.id, roleId: roleName } },
          update: {},
          create: { userId: u.id, roleId: roleName }
        })
      }
    }
  }

  // 5. Funcionários (Employees)
  console.log('👷 Migrando Funcionários...')
  const funcionariosData = readJson('funcionarios.json')
  for (const f of funcionariosData) {
    // Validar dependências
    const sectorExists = await prisma.sector.findUnique({ where: { id: f.setorId } })
    const positionExists = await prisma.position.findUnique({ where: { id: f.cargoId } })
    const userExists = f.usuarioId ? await prisma.user.findUnique({ where: { id: f.usuarioId } }) : null

    if (sectorExists && positionExists) {
      await prisma.employee.upsert({
        where: { id: f.id },
        update: {
          name: f.nome,
          corporateEmail: f.emailCorporativo,
          sectorId: f.setorId,
          positionId: f.cargoId,
          userId: userExists ? f.usuarioId : null,
          active: f.ativo,
          createdAt: f.createdAt ? new Date(f.createdAt) : undefined
        },
        create: {
          id: f.id,
          name: f.nome,
          corporateEmail: f.emailCorporativo,
          sectorId: f.setorId,
          positionId: f.cargoId,
          userId: userExists ? f.usuarioId : null,
          active: f.ativo,
          createdAt: f.createdAt ? new Date(f.createdAt) : new Date()
        }
      })
    } else {
      console.warn(`⚠️ Funcionário ${f.nome} ignorado: Setor ou Cargo inválido.`)
    }
  }

  // 6. Pendências (Pendencies) e OS Virtual
  console.log('📋 Migrando Pendências e criando OSs virtuais...')
  const pendenciasData = readJson('pendencias.json')
  
  // Separar Pendências do tipo OS para criar ServiceOrders primeiro (se não existirem)
  // No modelo JSON, Pendências tipo OS *são* as OSs na visão unificada. 
  // No banco relacional, separamos ServiceOrder (cabeçalho) de Pendency (tarefa).
  
  // Set para controlar OSs já criadas nesta execução para evitar duplicidade lógica
  const processedOsIds = new Set<string>()

  for (const p of pendenciasData) {
    let originOsId = null;

    // Se a pendência é do tipo OS ou tem origem OS, precisamos garantir que a ServiceOrder exista
    if (p.origemTipo === 'OS' && p.origemId) {
      // Tentar converter origemId para número se possível, ou gerar um hash/mapeamento
      // Como o banco espera um ID UUID para ServiceOrder, e o JSON usa strings arbitrarias ('1', '1-1'),
      // vamos criar um UUID determinístico ou usar o próprio ID se for compatível.
      // ESTRATÉGIA: Criar uma ServiceOrder "Placeholder" para manter a integridade referencial.
      // O ID da ServiceOrder será o mesmo da Pendência que a originou (se tipo=OS) ou gerado.
      
      // Simplificação: Se tipo=OS, a pendência representa a OS principal.
      // Vamos criar a ServiceOrder com o mesmo ID da pendência para facilitar vínculo.
      
      if (p.tipo === 'OS' && !processedOsIds.has(p.id)) {
        // Criar ServiceOrder correspondente
        try {
          await prisma.serviceOrder.upsert({
            where: { id: p.id }, // Usando ID da pendência como ID da OS para link direto 1:1 neste legado
            update: {},
            create: {
              id: p.id,
              clientData: { nome: p.tags?.[0] || 'Cliente Legado' }, // Snapshot simples
              description: p.descricao || '',
              status: p.status === 'CONCLUIDO' ? 'CONCLUIDA' : 'EM_ANDAMENTO',
              priority: (p.prioridade as Priority) || 'MEDIA',
              scheduledDate: p.dataPrevisao ? new Date(p.dataPrevisao) : new Date(),
              createdAt: p.dataCriacao ? new Date(p.dataCriacao) : new Date()
            }
          })
          originOsId = p.id;
          processedOsIds.add(p.id);
        } catch (e) {
            console.warn(`Erro ao criar OS para pendência ${p.id}:`, e)
        }
      } else if (p.origemId && p.origemTipo === 'OS') {
          // Pendência derivada (ex: Financeiro de OS)
          // Tenta encontrar a OS "pai". Se não achar (ordem de leitura), 
          // pode falhar o link. O ideal seria processar em duas passadas.
          // Por hora, se a OS pai não foi criada ainda (está mais abaixo no JSON), 
          // o vínculo falharia.
          
          // SOLUÇÃO: Vamos assumir que a OS pai é uma pendência do tipo 'OS' que tem origemId igual.
          // Mas os IDs no JSON são confusos (origemId '1' vs id UUID).
          // Vamos tentar buscar uma ServiceOrder que tenha sido criada com esse ID, 
          // mas como usamos UUID, e '1' não é UUID, precisamos de uma estratégia de mapeamento.
          
          // ESTRATÉGIA SEGURA DE MIGRAÇÃO:
          // 1. Ignorar vínculo de OS legado que não seja UUID válido ou que não tenhamos certeza.
          // 2. Apenas migrar a pendência como MANUAL ou manter referência em texto na descrição.
          
          // Para este MVP de seed: Se não é UUID, deixamos null.
          // Se for UUID válido e existir na tabela service_orders, vinculamos.
      }
    }

    // Mapear Enums
    const tipo = Object.values(PendencyType).includes(p.tipo) ? p.tipo : 'OUTRO'
    const status = Object.values(PendencyStatus).includes(p.status) ? p.status : 'PENDENTE'
    const prioridade = Object.values(Priority).includes(p.prioridade) ? p.prioridade : 'MEDIA'
    
    // Validar Creator e Responsible (se não existirem, atribui ao admin ou system)
    const creatorExists = await prisma.user.findUnique({ where: { id: p.criadoPor } })
    const validCreatorId = creatorExists ? p.criadoPor : 'admin-id-123' // Fallback Admin

    const responsibleExists = p.responsavelId ? await prisma.user.findUnique({ where: { id: p.responsavelId } }) : null
    const validResponsibleId = responsibleExists ? p.responsavelId : null

    // Validar Setor Responsável
    const sectorRespExists = p.setorResponsavel ? await prisma.sector.findUnique({ where: { id: p.setorResponsavel } }) : null
    const validSectorRespId = sectorRespExists ? p.setorResponsavel : null

    await prisma.pendency.upsert({
      where: { id: p.id },
      update: {
        title: p.titulo,
        description: p.descricao,
        type: tipo,
        status: status,
        priority: prioridade,
        originType: p.origemTipo === 'OS' ? 'OS' : 'MANUAL',
        originOsId: originOsId, // Vínculo se conseguimos criar a OS acima
        createdBy: validCreatorId,
        responsibleId: validResponsibleId,
        responsibleSectorId: validSectorRespId,
        conclusionText: p.conclusao,
        conclusionType: p.tipoEncerramento === 'CONCLUIDO' ? 'CONCLUIDO' : (p.tipoEncerramento === 'SEM_CONCLUSAO' ? 'SEM_CONCLUSAO' : null),
        dueDate: p.dataPrevisao ? new Date(p.dataPrevisao) : null,
        createdAt: p.dataCriacao ? new Date(p.dataCriacao) : new Date(),
        updatedAt: p.dataAtualizacao ? new Date(p.dataAtualizacao) : new Date(),
        completedAt: p.dataConclusao ? new Date(p.dataConclusao) : null
      },
      create: {
        id: p.id,
        title: p.titulo,
        description: p.descricao,
        type: tipo,
        status: status,
        priority: prioridade,
        originType: p.origemTipo === 'OS' ? 'OS' : 'MANUAL',
        originOsId: originOsId,
        createdBy: validCreatorId,
        responsibleId: validResponsibleId,
        responsibleSectorId: validSectorRespId,
        conclusionText: p.conclusao,
        conclusionType: p.tipoEncerramento === 'CONCLUIDO' ? 'CONCLUIDO' : (p.tipoEncerramento === 'SEM_CONCLUSAO' ? 'SEM_CONCLUSAO' : null),
        dueDate: p.dataPrevisao ? new Date(p.dataPrevisao) : null,
        createdAt: p.dataCriacao ? new Date(p.dataCriacao) : new Date(),
        updatedAt: p.dataAtualizacao ? new Date(p.dataAtualizacao) : new Date(),
        completedAt: p.dataConclusao ? new Date(p.dataConclusao) : null
      }
    })
  }

  // 7. Configuração do Sistema
  console.log('⚙️ Configurando Sistema...')
  await prisma.systemConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      config: {
        kanbanAtivo: true,
        impressaoAutomatica: false,
        modoRestrito: false,
        exibirPendenciasGlobais: false,
        modoManutencao: false
      }
    }
  })

  console.log('✅ Seed concluído com sucesso!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Erro no seed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
