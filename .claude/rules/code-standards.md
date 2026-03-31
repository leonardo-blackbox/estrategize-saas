# Padrões de Código — Estrategize SaaS

## Frontend (React 18 + Vite + TypeScript)
- TypeScript strict mode obrigatório — sem `any`
- React 18 com React Router (SPA, não SSR)
- Tailwind CSS para estilização
- CSS custom properties com prefixo `--` para design tokens
- Nunca usar `!important` — reestruturar especificidade
- CSS inline apenas para valores dinâmicos de runtime

## Nomenclatura Frontend
- Componentes React: PascalCase (`ConsultoriaCard.tsx`)
- Hooks: camelCase com prefixo `use` (`useConsultorias`)
- Constantes: UPPER_SNAKE_CASE (`MAX_RETRIES`)
- Tipos/Interfaces: PascalCase com sufixo (`ConsultoriaCardProps`)
- Utilities: kebab-case (`format-date.ts`)

## Backend (Node.js + Express + TypeScript)
- Express como framework HTTP
- TypeScript strict — sem `any`
- Validação de input com Zod em todas as rotas POST/PUT/PATCH
- Business logic nos services, NUNCA nos routers/routes
- Funções e variáveis: camelCase
- Classes e tipos: PascalCase

## Qualidade
- Sem `console.log` em produção
- Funções com no máximo 30 linhas
- Loading states e empty states obrigatórios em componentes de dados
- Responsividade mobile-first obrigatória
- Named exports (não default) — exceto páginas de rota

## Acessibilidade
- HTML semântico obrigatório (`<main>`, `<nav>`, `<section>`)
- ARIA labels em elementos interativos
- Navegação por teclado funcional
- Focus indicators visíveis
- Hierarquia de headings correta (h1 > h2 > h3)

## Git
- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `perf:`
- Commits atômicos, mensagens em inglês
- Referenciar escopo: `feat(analytics): add daily chart component`
- Nunca commitar `.env` ou credenciais

## Idioma e Encoding
- Conteúdo textual voltado ao usuário: PT-BR com acentuação correta
- Variáveis e código: inglês (padrão internacional)
- Encoding: UTF-8 em todos os arquivos
