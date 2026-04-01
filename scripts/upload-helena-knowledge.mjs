/**
 * upload-helena-knowledge.mjs
 *
 * Script para upload programático dos documentos de conhecimento da Helena
 * para o endpoint POST /api/admin/plugins/helena/knowledge.
 *
 * Upload manual (alternativa ao script):
 *   1. Acesse http://localhost:5173/admin/plugins/helena
 *   2. Seção "Knowledge Base"
 *   3. Faça upload dos 6 arquivos do diretório:
 *      /Users/leonardorodrigues/dev/Obsidian/03 - Biblioteca/Brainstorm/Ideias/Helena/
 *
 * Upload via script:
 *   node scripts/upload-helena-knowledge.mjs --token SEU_JWT
 *   node scripts/upload-helena-knowledge.mjs --dry-run
 *   node scripts/upload-helena-knowledge.mjs --file helena-objecoes-e-fechamento.md --token SEU_JWT
 *   node scripts/upload-helena-knowledge.mjs --base-url https://api.seudominio.com --token SEU_JWT
 *
 * Flags:
 *   --token <jwt>        JWT de admin para Authorization header (obrigatório sem --dry-run)
 *   --dry-run            Lista os arquivos encontrados sem fazer upload
 *   --file <filename>    Faz upload de apenas um arquivo específico (ex: helena-objecoes-e-fechamento.md)
 *   --base-url <url>     URL base da API (padrão: http://localhost:3001)
 *
 * Requisitos: Node.js 18+. Sem dependências externas.
 */

import { readFileSync, readdirSync } from 'fs';
import { join, basename } from 'path';
import { fileURLToPath } from 'url';

// ---------------------------------------------------------------------------
// Configuração
// ---------------------------------------------------------------------------

const HELENA_DOCS_DIR =
  '/Users/leonardorodrigues/dev/Obsidian/03 - Biblioteca/Brainstorm/Ideias/Helena';

const EXPECTED_FILES = [
  'helena-objecoes-e-fechamento.md',
  'helena-perfis-psicologicos.md',
  'helena-tecnicas-de-fechamento.md',
  'helena-rapport-e-abertura.md',
  'helena-linguagem-de-compra.md',
  'helena-linguagem-de-fuga.md',
];

// ---------------------------------------------------------------------------
// Parse de args
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = argv.slice(2);
  const result = {
    token: null,
    dryRun: false,
    file: null,
    baseUrl: 'http://localhost:3001',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--dry-run') {
      result.dryRun = true;
    } else if (arg === '--token' && args[i + 1]) {
      result.token = args[++i];
    } else if (arg === '--file' && args[i + 1]) {
      result.file = args[++i];
    } else if (arg === '--base-url' && args[i + 1]) {
      result.baseUrl = args[++i].replace(/\/$/, '');
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Multipart/form-data manual (sem dependências externas)
// ---------------------------------------------------------------------------

function buildMultipartBody(fields, fileField) {
  const boundary = `----Helena${Date.now()}${Math.random().toString(16).slice(2)}`;
  const CRLF = '\r\n';
  const parts = [];

  // Campos de texto
  for (const [name, value] of Object.entries(fields)) {
    parts.push(
      `--${boundary}${CRLF}` +
        `Content-Disposition: form-data; name="${name}"${CRLF}` +
        CRLF +
        `${value}${CRLF}`
    );
  }

  // Campo de arquivo
  const { name, filename, content, mimeType } = fileField;
  const fileHeader =
    `--${boundary}${CRLF}` +
    `Content-Disposition: form-data; name="${name}"; filename="${filename}"${CRLF}` +
    `Content-Type: ${mimeType}${CRLF}` +
    CRLF;

  const footer = `${CRLF}--${boundary}--${CRLF}`;

  // Montar o body como Buffer para preservar bytes binários
  const headerBuf = Buffer.from(parts.join('') + fileHeader, 'utf8');
  const footerBuf = Buffer.from(footer, 'utf8');
  const body = Buffer.concat([headerBuf, content, footerBuf]);

  return { body, contentType: `multipart/form-data; boundary=${boundary}` };
}

// ---------------------------------------------------------------------------
// Upload de um arquivo
// ---------------------------------------------------------------------------

async function uploadFile(filePath, baseUrl, token) {
  const filename = basename(filePath);
  const content = readFileSync(filePath);

  const { body, contentType } = buildMultipartBody(
    { scope: 'plugin', plugin_slug: 'helena' },
    { name: 'file', filename, content, mimeType: 'text/markdown' }
  );

  const url = `${baseUrl}/api/admin/plugins/helena/knowledge`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': contentType,
      'Content-Length': String(body.length),
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '(sem corpo de resposta)');
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  const json = await response.json();
  return json;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv);
  const prefix = '[helena-upload]';

  // Descobrir arquivos no diretório
  let files;
  try {
    const entries = readdirSync(HELENA_DOCS_DIR);
    files = entries
      .filter((f) => f.endsWith('.md'))
      .map((f) => join(HELENA_DOCS_DIR, f));
  } catch (err) {
    console.error(`${prefix} ERRO ao ler o diretório: ${HELENA_DOCS_DIR}`);
    console.error(`${prefix} ${err.message}`);
    process.exit(1);
  }

  // Filtrar por --file se especificado
  if (args.file) {
    const targetName = args.file.endsWith('.md') ? args.file : `${args.file}.md`;
    files = files.filter((f) => basename(f) === targetName);
    if (files.length === 0) {
      console.error(`${prefix} ERRO: arquivo "${targetName}" não encontrado em ${HELENA_DOCS_DIR}`);
      process.exit(1);
    }
  }

  if (files.length === 0) {
    console.error(`${prefix} ERRO: nenhum arquivo .md encontrado em ${HELENA_DOCS_DIR}`);
    process.exit(1);
  }

  // Listar arquivos encontrados
  console.log(`\n${prefix} Diretório: ${HELENA_DOCS_DIR}`);
  console.log(`${prefix} Arquivos encontrados: ${files.length}\n`);
  for (const f of files) {
    console.log(`${prefix} Encontrado: ${basename(f)}`);
  }

  // Verificar se todos os esperados estão presentes (aviso, não erro)
  const foundNames = files.map((f) => basename(f));
  const missing = EXPECTED_FILES.filter((e) => !foundNames.includes(e));
  if (missing.length > 0) {
    console.warn(`\n${prefix} AVISO: ${missing.length} arquivo(s) esperado(s) não encontrado(s):`);
    for (const m of missing) {
      console.warn(`${prefix}   - ${m}`);
    }
  }

  // Modo --dry-run
  if (args.dryRun) {
    console.log(`\n${prefix} Modo dry-run. Nenhum upload foi realizado.\n`);
    return;
  }

  // Validar token
  if (!args.token) {
    console.error(`\n${prefix} ERRO: --token é obrigatório para fazer upload.`);
    console.error(`${prefix} Use --dry-run para testar sem token, ou forneça --token SEU_JWT\n`);
    process.exit(1);
  }

  // Upload
  console.log(`\n${prefix} Iniciando upload para: ${args.baseUrl}\n`);

  let hasError = false;

  for (let i = 0; i < files.length; i++) {
    const filePath = files[i];
    const filename = basename(filePath);
    console.log(`${prefix} Enviando (${i + 1}/${files.length}): ${filename}...`);

    try {
      const result = await uploadFile(filePath, args.baseUrl, args.token);
      const id = result?.id ?? '(sem id)';
      const status = result?.status ?? '(sem status)';
      console.log(`${prefix} OK: ${filename} (id: ${id}, status: ${status})`);
    } catch (err) {
      console.error(`${prefix} ERRO: ${filename} — ${err.message}`);
      hasError = true;
    }
  }

  if (hasError) {
    console.error(`\n${prefix} Upload concluído com erros. Verifique os itens marcados como ERRO acima.\n`);
    process.exit(1);
  }

  console.log(`\n${prefix} Todos os arquivos enviados com sucesso.\n`);
  console.log(`${prefix} Próximo passo: acesse /admin/plugins/helena para verificar o status de indexação.\n`);
}

main().catch((err) => {
  console.error('[helena-upload] Erro inesperado:', err);
  process.exit(1);
});
