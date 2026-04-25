/**
 * Iris Methodology Templates — Central
 *
 * Each template materializes part of Iris Matos' real methodology, extracted
 * from her Notion workspace. Templates produce one or more linked pages with
 * pre-filled TipTap doc structures (ProseMirror JSON).
 */

export type CentralTemplateKey = 'historia-cliente' | 'tecnica-mapeada' | 'banco-ideias';

interface TemplatePage {
  title: string;
  emoji?: string;
  parentIndex?: number; // index in this template's pages array
  blocks: unknown;      // ProseMirror doc JSON
}

interface CentralTemplate {
  key: CentralTemplateKey;
  icon: string;
  name: string;
  description: string;
  pages: TemplatePage[];
}

// ── ProseMirror builder helpers ──────────────────────────────────────────
const doc = (...content: unknown[]) => ({ type: 'doc', content });
const paragraph = (text?: string) => text
  ? { type: 'paragraph', content: [{ type: 'text', text }] }
  : { type: 'paragraph' };
const heading = (level: 1 | 2 | 3, text: string) => ({
  type: 'heading',
  attrs: { level },
  content: [{ type: 'text', text }],
});
const bulletList = (...items: string[]) => ({
  type: 'bulletList',
  content: items.map((text) => ({
    type: 'listItem',
    content: [paragraph(text)],
  })),
});
const taskList = (...items: { text: string; checked?: boolean }[]) => ({
  type: 'taskList',
  content: items.map((it) => ({
    type: 'taskItem',
    attrs: { checked: it.checked ?? false },
    content: [paragraph(it.text)],
  })),
});

// ── Templates ────────────────────────────────────────────────────────────

export const IRIS_TEMPLATES: CentralTemplate[] = [
  {
    key: 'historia-cliente',
    icon: '📖',
    name: 'História do Cliente',
    description: 'Mineração da origem, jornada e transformações — matéria-prima de todo o resto.',
    pages: [
      {
        title: 'História do Cliente',
        emoji: '📖',
        blocks: doc(
          heading(1, '📖 História do Cliente'),
          paragraph('A história e a técnica são a matéria-prima de tudo que vem depois: posicionamento, conteúdo, diferencial, narrativa de venda. Você não começa pelo produto — começa pela pessoa.'),
          heading(2, 'Antes de tudo'),
          paragraph('Conte sua história em detalhes desde que você decidiu entrar nessa profissão. Não filtre. Coisas pequenas viram conteúdo, viram diferencial.'),
          heading(2, '1. Origem'),
          taskList(
            { text: 'Como você descobriu essa profissão?' },
            { text: 'Por que decidiu seguir esse caminho?' },
            { text: 'Quem era você antes disso?' },
          ),
          heading(2, '2. Jornada'),
          taskList(
            { text: 'O que você errou no começo?' },
            { text: 'Quais foram os desafios mais difíceis?' },
            { text: 'O que você corrigiu ao longo do tempo?' },
            { text: 'Quem te ajudou?' },
          ),
          heading(2, '3. Conquistas'),
          taskList(
            { text: 'Que resultado você teve que mudou seu jogo?' },
            { text: 'Quando você sentiu que tinha autoridade?' },
            { text: 'Que reconhecimento você já recebeu?' },
          ),
          heading(2, '4. Transformação'),
          taskList(
            { text: 'O que você é hoje que não era antes?' },
            { text: 'Que liberdade essa profissão te deu?' },
            { text: 'O que mudou na sua vida pessoal por causa disso?' },
          ),
          heading(2, 'Mapeamento para conteúdo'),
          paragraph('Cada parte da história alimenta categorias de conteúdo:'),
          bulletList(
            'Origem → Conteúdo de Conexão',
            'Jornada → Conteúdo Jornada do Herói',
            'Conquistas → Conteúdo de Posicionamento',
            'Transformação → Narrativa de venda',
          ),
        ),
      },
    ],
  },

  {
    key: 'tecnica-mapeada',
    icon: '🔧',
    name: 'Mapeamento da Técnica',
    description: 'Extrai o que o cliente faz de diferente do mercado — o diferencial real, não inventado.',
    pages: [
      {
        title: 'Mapeamento da Técnica',
        emoji: '🔧',
        blocks: doc(
          heading(1, '🔧 Mapeamento da Técnica'),
          paragraph('Diferenciação só existe se tiver alguém ensinando algo diferente. Aqui mapeamos a técnica real do cliente para encontrar o diferencial que já existe — mas que ele ainda não sabe nomear.'),
          heading(2, '1. A técnica em detalhes'),
          paragraph('Descreva passo a passo como você executa o que ensina. Não resuma. Detalhe o quanto for possível.'),
          paragraph(),
          heading(2, '2. O que é padrão no mercado'),
          paragraph('Liste como a maioria faz a mesma coisa — o jeito convencional.'),
          bulletList('', '', ''),
          heading(2, '3. O que você faz diferente'),
          paragraph('Aponte cada divergência específica entre o seu jeito e o padrão.'),
          taskList(
            { text: 'Qual ferramenta/método você usa que outros não usam?' },
            { text: 'Por que você abandonou o padrão?' },
            { text: 'Que problema do padrão você resolveu?' },
          ),
          heading(2, '4. Por que importa para o cliente final'),
          paragraph('A diferença técnica precisa virar benefício palpável. Conecte cada divergência a um ganho real para quem compra.'),
          bulletList(
            'Diferencial 1 → Ganho para o cliente',
            'Diferencial 2 → Ganho para o cliente',
          ),
          heading(2, '5. Diferencial nomeado'),
          paragraph('Resumo em uma frase: o que ninguém faz igual a você.'),
        ),
      },
    ],
  },

  {
    key: 'banco-ideias',
    icon: '💡',
    name: 'Banco de Ideias',
    description: '6 categorias de conteúdo da Iris — substitui topo/meio/fundo por mapeamento por intenção real.',
    pages: [
      {
        title: 'Banco de Ideias',
        emoji: '💡',
        blocks: doc(
          heading(1, '💡 Banco de Ideias'),
          paragraph('Cada cliente tem 6 categorias de conteúdo. Não use o padrão topo/meio/fundo — ele genérica e não conversa com nicho específico.'),
          paragraph('Abra cada subpágina e adicione ideias soltas. Quando precisar postar, escolha pela categoria do dia, depois desenvolve o roteiro.'),
          heading(2, 'Como organizar a semana'),
          bulletList(
            'Segunda — Conteúdo Técnico',
            'Terça — Jornada do Herói',
            'Quarta — Conexão',
            'Quinta — Relacionamento',
            'Sexta — Posicionamento',
            'Sábado — Venda Direta',
          ),
          paragraph('Esses dias são apenas referência. Ajuste para o ritmo do cliente.'),
        ),
      },
      {
        title: 'Conteúdo Técnico',
        emoji: '🔧',
        parentIndex: 0,
        blocks: doc(
          heading(1, '🔧 Conteúdo Técnico'),
          paragraph('Mostra uma pitadinha do que você ensina. Gera autoridade prática sem entregar o curso de graça.'),
          heading(2, 'Ideias'),
          taskList({ text: 'Ideia 1' }, { text: 'Ideia 2' }, { text: 'Ideia 3' }),
        ),
      },
      {
        title: 'Jornada do Herói',
        emoji: '🦸',
        parentIndex: 0,
        blocks: doc(
          heading(1, '🦸 Jornada do Herói'),
          paragraph('Recortes da sua história que mostram onde você errou, acertou, e como o público pode chegar lá também.'),
          heading(2, 'Ideias'),
          taskList({ text: 'Ideia 1' }, { text: 'Ideia 2' }, { text: 'Ideia 3' }),
        ),
      },
      {
        title: 'Conexão',
        emoji: '🤝',
        parentIndex: 0,
        blocks: doc(
          heading(1, '🤝 Conexão'),
          paragraph('Situações que o público vive, dores reais, identificação. Faz a pessoa pensar "é isso mesmo".'),
          heading(2, 'Ideias'),
          taskList({ text: 'Ideia 1' }, { text: 'Ideia 2' }, { text: 'Ideia 3' }),
        ),
      },
      {
        title: 'Relacionamento',
        emoji: '💬',
        parentIndex: 0,
        blocks: doc(
          heading(1, '💬 Relacionamento'),
          paragraph('Sobre o especialista — bastidor, opinião, dia a dia. Equilibra o feed para não ficar só sobre o público ou só sobre você.'),
          heading(2, 'Ideias'),
          taskList({ text: 'Ideia 1' }, { text: 'Ideia 2' }, { text: 'Ideia 3' }),
        ),
      },
      {
        title: 'Posicionamento',
        emoji: '🎯',
        parentIndex: 0,
        blocks: doc(
          heading(1, '🎯 Posicionamento'),
          paragraph('Mostra para que público você é — quem é a pessoa certa para te seguir, e quem não é. Filtra audiência.'),
          heading(2, 'Ideias'),
          taskList({ text: 'Ideia 1' }, { text: 'Ideia 2' }, { text: 'Ideia 3' }),
        ),
      },
      {
        title: 'Venda Direta',
        emoji: '💰',
        parentIndex: 0,
        blocks: doc(
          heading(1, '💰 Venda Direta'),
          paragraph('Oferta clara. CTA explícito. Só faz sentido depois que os outros 5 tipos prepararam o terreno.'),
          heading(2, 'Ideias'),
          taskList({ text: 'Ideia 1' }, { text: 'Ideia 2' }, { text: 'Ideia 3' }),
        ),
      },
    ],
  },
];
