---
phase: 25-helena-knowledge
plan: "01"
subsystem: helena-knowledge
tags: [helena, knowledge-base, rag, objecoes, vendas, upload-script]
dependency_graph:
  requires: []
  provides: [helena-knowledge-docs, helena-upload-script]
  affects: [helena-rag-engine]
tech_stack:
  added: []
  patterns: [multipart-form-data-manual, node-native-modules]
key_files:
  created:
    - /Users/leonardorodrigues/dev/Obsidian/03 - Biblioteca/Brainstorm/Ideias/Helena/helena-objecoes-e-fechamento.md
    - /Users/leonardorodrigues/dev/Obsidian/03 - Biblioteca/Brainstorm/Ideias/Helena/helena-perfis-psicologicos.md
    - /Users/leonardorodrigues/dev/Obsidian/03 - Biblioteca/Brainstorm/Ideias/Helena/helena-tecnicas-de-fechamento.md
    - /Users/leonardorodrigues/dev/Obsidian/03 - Biblioteca/Brainstorm/Ideias/Helena/helena-rapport-e-abertura.md
    - /Users/leonardorodrigues/dev/Obsidian/03 - Biblioteca/Brainstorm/Ideias/Helena/helena-linguagem-de-compra.md
    - /Users/leonardorodrigues/dev/Obsidian/03 - Biblioteca/Brainstorm/Ideias/Helena/helena-linguagem-de-fuga.md
    - scripts/upload-helena-knowledge.mjs
  modified: []
decisions:
  - "6 documentos MD não commitados no repositório git — são conteúdo Obsidian, não código"
  - "Multipart/form-data construído manualmente sem dependências npm para portabilidade máxima"
  - "Script usa Node.js 18+ built-ins apenas (fs, path, url)"
metrics:
  duration: "~15min"
  completed: "2026-04-01"
  tasks_completed: 2
  files_created: 7
requirements:
  - HELENA-E
---

# Phase 25 Plan 01: Helena Knowledge Base Summary

Base de conhecimento comercial da Helena criada — 6 documentos Markdown derivados de 27 transcrições reais de reuniões da Iris Matos, mais script de upload para indexação via API.

---

## Tarefas Executadas

### Task 1: Criar os 6 documentos de conhecimento comercial da Helena

Criado o diretório `/Users/leonardorodrigues/dev/Obsidian/03 - Biblioteca/Brainstorm/Ideias/Helena/` e os 6 arquivos de conhecimento:

| Arquivo | Domínio | Conteúdo principal |
|---|---|---|
| `helena-objecoes-e-fechamento.md` | objecoes | 5 objeções mapeadas (custo, tempo, medo de crescimento, execução, orgânico estagnado) + técnicas de quebra |
| `helena-perfis-psicologicos.md` | perfis-psicologicos | 4 perfis (perfeccionista, sobrecarregada, confusa de posicionamento, medo de crescimento) com scripts de fechamento |
| `helena-tecnicas-de-fechamento.md` | tecnicas-de-fechamento | 3 momentos de fechamento + 5 técnicas (consequência, resumo, inversão, ancoragem, progressivo) |
| `helena-rapport-e-abertura.md` | rapport-e-abertura | 3 scripts de abertura + 7 perguntas de diagnóstico com explicação de por quê funcionam |
| `helena-linguagem-de-compra.md` | linguagem-de-compra | 6 frases diretas + 3 mudanças de linguagem + 6 sinais comportamentais + regra dos 3-5 minutos |
| `helena-linguagem-de-fuga.md` | linguagem-de-fuga | 14 sinais categorizados (adiamento, hipotéticos, externalização, minimização) com redirecionamentos |

Todos os 6 documentos:
- Contêm a frase-chave: "É menos marketing e mais desenvolvimento pessoal."
- Seguem estrutura `## Seção → ### Subseção → bullets`
- Têm frontmatter YAML com `dominio`, `versao`, `fonte`
- Estão em PT-BR, tom direto, focado em ação
- Não ultrapassam ~2.000 tokens

**Estes arquivos NÃO foram commitados no repositório git** — são conteúdo Obsidian.

---

### Task 2: Criar script de upload programático

**Arquivo criado:** `scripts/upload-helena-knowledge.mjs`
**Commit:** `6987470`

#### Resultado do --dry-run

```
[helena-upload] Diretório: /Users/leonardorodrigues/dev/Obsidian/03 - Biblioteca/Brainstorm/Ideias/Helena
[helena-upload] Arquivos encontrados: 6

[helena-upload] Encontrado: helena-linguagem-de-compra.md
[helena-upload] Encontrado: helena-linguagem-de-fuga.md
[helena-upload] Encontrado: helena-objecoes-e-fechamento.md
[helena-upload] Encontrado: helena-perfis-psicologicos.md
[helena-upload] Encontrado: helena-rapport-e-abertura.md
[helena-upload] Encontrado: helena-tecnicas-de-fechamento.md

[helena-upload] Modo dry-run. Nenhum upload foi realizado.
```

Exit code: 0

---

## Próximo Passo

Para indexar os documentos no RAG da Helena, escolha uma das opções:

### Opção A — Via script (recomendado para batch)
```bash
node scripts/upload-helena-knowledge.mjs --token SEU_JWT_ADMIN
```
Obtenha o JWT fazendo login como admin e copiando o token do header de uma requisição autenticada.

### Opção B — Via interface admin
1. Acesse `http://localhost:5173/admin/plugins/helena`
2. Seção "Knowledge Base"
3. Faça upload dos 6 arquivos do diretório:
   `/Users/leonardorodrigues/dev/Obsidian/03 - Biblioteca/Brainstorm/Ideias/Helena/`

---

## Deviações do Plano

Nenhuma — plano executado exatamente como escrito.

---

## Self-Check: PASSED

- [x] `helena-objecoes-e-fechamento.md` — FOUND
- [x] `helena-perfis-psicologicos.md` — FOUND
- [x] `helena-tecnicas-de-fechamento.md` — FOUND
- [x] `helena-rapport-e-abertura.md` — FOUND
- [x] `helena-linguagem-de-compra.md` — FOUND
- [x] `helena-linguagem-de-fuga.md` — FOUND
- [x] `scripts/upload-helena-knowledge.mjs` — FOUND
- [x] Todos os 6 MD contêm a frase-chave — 6/6
- [x] Script `--dry-run` funciona com exit code 0
- [x] Commit `6987470` existe no repositório
- [x] MDs NÃO estão no git (conteúdo Obsidian)
