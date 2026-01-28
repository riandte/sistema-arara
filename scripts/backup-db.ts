import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import 'dotenv/config';

const execAsync = promisify(exec);

async function backup() {
  const date = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'backups');
  const filename = `backup-arara-${date}.sql`;
  const filePath = path.join(backupDir, filename);

  // Garantir diretório de backups
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ DATABASE_URL não definida.');
    process.exit(1);
  }

  console.log(`🚀 Iniciando backup do banco de dados...`);
  console.log(`📂 Destino: ${filePath}`);

  try {
    // Extrair credenciais da URL para montar comando pg_dump seguro
    // Formato esperado: postgresql://user:pass@host:port/db?schema=public
    const url = new URL(dbUrl);
    
    // Configurar variáveis de ambiente para o pg_dump (mais seguro que passar senha na CLI)
    const env = { ...process.env, PGPASSWORD: url.password };
    
    const command = `pg_dump -h ${url.hostname} -p ${url.port} -U ${url.username} -d ${url.pathname.slice(1)} -F p -f "${filePath}"`;

    await execAsync(command, { env });

    console.log(`✅ Backup realizado com sucesso!`);
    console.log(`📦 Arquivo gerado: ${filename}`);
  } catch (error: any) {
    console.error('❌ Falha ao realizar backup:', error.message);
    process.exit(1);
  }
}

backup();