# Hierarquia de Componentes — Construção Modular

## Arquitetura de 3 Camadas (Feature-Based)

Este projeto usa **Componentização Extrema**, NÃO Atomic Design.
Referência completa: seção "Construção Modular" no CLAUDE.md.

### Hierarquia

```
1. Página (src/pages/)           ← max 20 linhas, só importa agregador
2. Agregador (features/*/Page/)  ← max 200 linhas, orquestra micro-módulos
3. Micro-módulo (features/*/)    ← max 80 linhas, UMA responsabilidade
```

### Primitivos Globais (src/components/ui/)

Button, Input, Modal, Badge, Card — usados por 2+ features.
Estes NÃO são "átomos" — são primitivos compartilhados.

### Regra de Composição

- Micro-módulo NUNCA importa outro micro-módulo do mesmo feature
- Agregador importa APENAS micro-módulos + hooks
- Página importa APENAS o agregador
