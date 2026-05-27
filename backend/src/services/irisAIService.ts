import OpenAI from 'openai';
import type { IrisInstagramContext, IrisMarketContext } from './irisContextService.js';

/**
 * Iris AI Service
 * Generates strategic business diagnostics using the Iris method framework
 *
 * Suporta dois modos:
 * - Modo legado: chamada `generateDiagnosis(title, clientName)` — prompt abstrato
 * - Modo forense: chamada `generateDiagnosis({ title, clientName, instagramContext, marketResearchContext })`
 *   injeta dados oficiais Meta + pesquisa de mercado para análise com evidência numérica.
 */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Iris Method Framework
 * Strategic diagnostic framework combining:
 * - Market positioning (environment scan)
 * - Internal capabilities (SWOT analysis)
 * - Operational readiness (maturity assessment)
 * - Strategic alignment (goal-to-action mapping)
 */
const IRIS_METHOD_PROMPT = `
You are a strategic business consultant using the IRIS diagnostic method.

IRIS METHOD FRAMEWORK:
1. (I)nternal Assessment: Evaluate the organization's capabilities, strengths, and gaps
2. (R)eality Check: Analyze market conditions, competitive landscape, and external factors
3. (I)nsight Generation: Identify patterns, opportunities, and risks from the analysis
4. (S)trategic Recommendations: Deliver actionable, prioritized recommendations

For each diagnostic, provide:
- Executive Summary (2-3 sentences of the key insight)
- Internal Assessment (capabilities, maturity level, key strengths/gaps)
- Market Reality (competitive positioning, market trends, external threats/opportunities)
- Key Insights (top 3-5 strategic insights discovered)
- Recommendations (top 3-5 actionable next steps, prioritized by impact)

Format your response as a JSON object with the following structure:
{
  "executiveSummary": "...",
  "sections": [
    {
      "name": "Internal Assessment",
      "insights": ["insight 1", "insight 2", ...]
    },
    {
      "name": "Market Reality",
      "insights": ["insight 1", "insight 2", ...]
    },
    {
      "name": "Key Insights",
      "insights": ["insight 1", "insight 2", ...]
    },
    {
      "name": "Recommendations",
      "insights": ["recommendation 1", "recommendation 2", ...]
    }
  ]
}

Respond ONLY with valid JSON. No markdown, no extra text.
`;

export interface DiagnosisContent {
  executiveSummary: string;
  sections: Array<{
    name: string;
    insights: string[];
  }>;
}

export interface DiagnosisResponse {
  content: DiagnosisContent;
  tokensUsed: number;
  enriched: boolean;
}

export interface GenerateDiagnosisParams {
  title: string;
  clientName?: string | null;
  instagramContext?: IrisInstagramContext | null;
  marketResearchContext?: IrisMarketContext | null;
}

const IRIS_FORENSIC_INSTRUCTIONS = `
Você é um consultor estratégico aplicando o método IRIS sobre dados REAIS do Instagram e pesquisa de mercado da cliente. Sua análise DEVE:

1. CITAR números específicos das métricas fornecidas em pelo menos 60% das frases analíticas.
2. IDENTIFICAR padrões — ex: "Posts de tipo X performam Y× melhor que Z em saves/shares".
3. DETECTAR gaps demográficos entre seguidores e audiência engajada (mismatch de ICP).
4. AVALIAR retention dos Reels vs benchmark:
   - > 50% = excelente
   - 25-50% = bom
   - < 25% = problema de hook nos primeiros 3 segundos
5. CADA recomendação inclui métrica esperada de melhoria (ex: "espera aumento de 30% em saves").
6. EVITAR generalidades — toda afirmação ancorada em dado fornecido OU descontinuada.

Mantenha o framework IRIS:
1. (I)nternal Assessment — capacidades, gaps de execução observados nos dados
2. (R)eality Check — posicionamento de mercado e concorrência
3. (I)nsight Generation — padrões + gaps detectados
4. (S)trategic Recommendations — prioridade × impacto numérico esperado

Responda APENAS com JSON válido (mesma estrutura do prompt antigo). Linguagem: português do Brasil.
`;

function formatInstagramContext(ctx: IrisInstagramContext): string {
  const c = ctx.account28d;
  const d = ctx.account28dDelta;
  const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;
  const topDemographics = (label: string, demo: typeof ctx.followerDemographics) => {
    if (!demo) return `${label}: indisponível (conta pequena).`;
    const top3Bucket = Object.entries(demo.age_gender)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k, v]) => `${k} (${fmtPct(v)})`)
      .join(', ');
    const top3City = demo.top_cities
      .slice(0, 3)
      .map((c2) => `${c2.city ?? '?'}/${c2.country} (${fmtPct(c2.percent)})`)
      .join(', ');
    return `${label}: top idade×gênero: ${top3Bucket || '–'}. Top cidades: ${top3City || '–'}.`;
  };

  const topPosts = ctx.topPostsByValue
    .map(
      (p, i) =>
        `${i + 1}. [${p.productType}] "${p.caption.slice(0, 80)}" — saves ${p.saves}, shares ${p.shares}, reach ${p.reach}`,
    )
    .join('\n');

  const topReels =
    ctx.topReels.length > 0
      ? ctx.topReels
          .map(
            (r, i) =>
              `${i + 1}. avg watch ${r.avgWatchTimeSec}s, ${r.views} views, ${r.replays} replays — "${r.caption.slice(0, 60)}"`,
          )
          .join('\n')
      : 'Sem Reels nas últimas 25 mídias.';

  return `
DADOS OFICIAIS INSTAGRAM @${ctx.igUsername}:
- Seguidores: ${ctx.followersCount} · Seguindo: ${ctx.followsCount} · Mídias: ${ctx.mediaCount}

MÉTRICAS 28d (vs 28d anteriores):
- Reach: ${c.reach} (Δ ${d.reach >= 0 ? '+' : ''}${d.reach})
- Accounts Engaged: ${c.accounts_engaged} (Δ ${d.accounts_engaged >= 0 ? '+' : ''}${d.accounts_engaged})
- Profile Views: ${c.profile_views} (Δ ${d.profile_views >= 0 ? '+' : ''}${d.profile_views})
- Total Interactions: ${c.total_interactions}
- Saves: ${c.saves} · Shares: ${c.shares}
- Follows novos: ${c.follows} · Unfollows: ${c.unfollows} (churn ${c.follows > 0 ? Math.round((c.unfollows / c.follows) * 100) : 0}%)

TOP 5 CONTEÚDOS POR VALOR PERCEBIDO (saves+shares):
${topPosts || '–'}

TOP REELS POR RETENTION:
${topReels}

CADÊNCIA (últimos 30d):
- ${ctx.postingCadence.postsLast30d} posts · ${ctx.postingCadence.postsPerWeek}/semana
- Distribuição: ${ctx.postingCadence.distribution.feed} feed, ${ctx.postingCadence.distribution.reels} reels, ${ctx.postingCadence.distribution.story} stories

DEMOGRAFIA:
${topDemographics('Seguidores', ctx.followerDemographics)}
${topDemographics('Audiência engajada', ctx.engagedDemographics)}
`.trim();
}

function formatMarketContext(ctx: IrisMarketContext): string {
  const insights = ctx.keyInsights;
  return `
PESQUISA DE MERCADO (concluída em ${new Date(ctx.reportGeneratedAt).toLocaleDateString('pt-BR')}):
- Concorrentes mapeados: ${ctx.competitorCount}
- Top concorrentes: ${ctx.topCompetitors.map((c) => c.name).join(', ')}

INSIGHTS-CHAVE:
- Oportunidades: ${insights?.opportunities?.join('; ') || '–'}
- Ameaças: ${insights?.threats?.join('; ') || '–'}
- Posicionamento: ${insights?.positioning?.join('; ') || '–'}
`.trim();
}

export async function generateDiagnosis(
  titleOrParams: string | GenerateDiagnosisParams,
  clientName?: string | null,
): Promise<DiagnosisResponse> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const params: GenerateDiagnosisParams =
    typeof titleOrParams === 'string'
      ? { title: titleOrParams, ...(clientName !== undefined ? { clientName } : {}) }
      : titleOrParams;

  const { title, clientName: client, instagramContext, marketResearchContext } = params;
  const enriched = Boolean(instagramContext || marketResearchContext);

  let userPrompt = `
Provide a strategic diagnosis for the following consultancy engagement:

Consultancy Title: ${title}
${client ? `Client: ${client}` : ''}
`;

  if (instagramContext) {
    userPrompt += `\n${formatInstagramContext(instagramContext)}\n`;
  }
  if (marketResearchContext) {
    userPrompt += `\n${formatMarketContext(marketResearchContext)}\n`;
  }

  userPrompt += `
Using the IRIS method framework${enriched ? ' AND the real data above' : ''}, generate a comprehensive strategic diagnostic.
${enriched ? 'CITE NUMBERS from the data in your insights and recommendations.' : ''}
Aim for 1500-2500 tokens of content.
`;

  const systemPrompt = enriched ? `${IRIS_METHOD_PROMPT}\n\n${IRIS_FORENSIC_INSTRUCTIONS}` : IRIS_METHOD_PROMPT;
  const maxTokens = enriched ? 3000 : 2000;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
    });

    const textContent = response.choices[0]?.message?.content;
    if (!textContent) {
      throw new Error('OpenAI returned empty response');
    }

    // Parse and validate JSON response
    let content: DiagnosisContent;
    try {
      content = JSON.parse(textContent) as DiagnosisContent;
    } catch (e) {
      throw new Error(`Failed to parse OpenAI response as JSON: ${e instanceof Error ? e.message : String(e)}`);
    }

    // Validate required fields
    if (!content.executiveSummary || !content.sections || !Array.isArray(content.sections)) {
      throw new Error('OpenAI response missing required fields');
    }

    // Calculate tokens used (completion + prompt)
    const tokensUsed =
      (response.usage?.completion_tokens ?? 0) + (response.usage?.prompt_tokens ?? 0);

    return {
      content,
      tokensUsed,
      enriched,
    };
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      throw new Error(`OpenAI API error: ${error.message} (Status: ${error.status})`);
    }
    throw error;
  }
}
