import OpenAI from 'openai';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { logger } from '../lib/logger.js';
import { runActor } from './apifyService.js';
import { scrapeUrl } from './firecrawlService.js';
import { getConfig } from './marketPluginConfigService.js';
import type {
  MarketResearch,
  PesquisaMercadoConfig,
  CompetitorData,
  InstagramProfileData,
  WebsiteScrapedData,
  KeyInsights,
  ConsultancyContext,
  InstagramLatestPost,
} from '../types/marketIntelligence.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ============================================================================
// Helpers
// ============================================================================

function ensureDb() {
  if (!supabaseAdmin) throw new Error('Database service unavailable');
  return supabaseAdmin;
}

async function updateResearch(id: string, data: Partial<MarketResearch>): Promise<void> {
  const db = ensureDb();
  await db.from('market_research').update(data).eq('id', id);
}

// ============================================================================
// Step 1: discoverCompetitors
// ============================================================================

interface GoogleMapsPlace {
  title?: string;
  address?: string;
  phone?: string;
  website?: string;
  totalScore?: number;
  reviewsCount?: number;
  description?: string;
  url?: string;
}

async function discoverCompetitors(
  config: PesquisaMercadoConfig,
  ctx: ConsultancyContext,
): Promise<CompetitorData[]> {
  const competitors: CompetitorData[] = [];

  if (config.discovery_sources.includes('google_maps')) {
    try {
      logger.info('[market-research] Step 1/5: Discovering competitors via Google Maps...');
      const niche = ctx.niche ?? ctx.title ?? 'negocio local';
      const searchString = `${niche}`;

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Google Maps timeout')), 120_000),
      );

      const actorPromise = runActor<GoogleMapsPlace>('compass/google-maps-scraper', {
        searchStrings: [searchString],
        maxCrawledPlaces: config.max_competitors_discover,
        language: 'pt',
        maxImages: 0,
        maxReviews: 0,
      });

      const results = await Promise.race([actorPromise, timeoutPromise]);

      for (const place of results) {
        if (!place.title) continue;

        // Try to extract Instagram handle from website URL or description
        let instagramHandle: string | null = null;
        const descText = (place.description ?? '') + ' ' + (place.url ?? '');
        const igMatch = descText.match(/instagram\.com\/@?([A-Za-z0-9_.]+)/);
        if (igMatch) instagramHandle = igMatch[1];

        competitors.push({
          name: place.title,
          address: place.address ?? null,
          phone: place.phone ?? null,
          website: place.website ?? null,
          rating: place.totalScore ?? null,
          reviewsCount: place.reviewsCount ?? null,
          instagramHandle,
          source: 'google_maps',
        });
      }
    } catch (err) {
      logger.error('[market-research] Google Maps discovery failed:', err instanceof Error ? err.message : err);
    }
  }

  return competitors;
}

// ============================================================================
// Step 2: scrapeCompetitorInstagram
// ============================================================================

interface ApifyIGProfile {
  username?: string;
  fullName?: string;
  biography?: string;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  isBusinessAccount?: boolean;
  businessCategoryName?: string | null;
  externalUrl?: string | null;
  profilePicUrl?: string;
  latestPosts?: Array<{
    type?: string;
    caption?: string;
    likesCount?: number;
    commentsCount?: number;
    timestamp?: string;
    url?: string;
    displayUrl?: string;
  }>;
}

function computeEngagement(followers: number, posts: ApifyIGProfile['latestPosts']): number {
  if (!followers || !posts || posts.length === 0) return 0;
  const avgLikes = posts.reduce((s, p) => s + (p.likesCount ?? 0), 0) / posts.length;
  const avgComments = posts.reduce((s, p) => s + (p.commentsCount ?? 0), 0) / posts.length;
  return Number(((avgLikes + avgComments) / followers * 100).toFixed(2));
}

function mapIGProfile(raw: ApifyIGProfile): InstagramProfileData {
  const posts = raw.latestPosts ?? [];
  const followers = raw.followersCount ?? 0;
  const total = posts.length;
  const reels = posts.filter((p) => p.type === 'Video').length;
  const carousels = posts.filter((p) => p.type === 'Sidecar').length;

  const latestPosts: InstagramLatestPost[] = posts.slice(0, 12).map((p) => ({
    type: p.type ?? 'Photo',
    caption: (p.caption ?? '').slice(0, 200),
    likesCount: p.likesCount ?? 0,
    commentsCount: p.commentsCount ?? 0,
    timestamp: p.timestamp ?? '',
    url: p.url ?? '',
    displayUrl: p.displayUrl,
  }));

  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentCount = posts.filter((p) => p.timestamp && new Date(p.timestamp).getTime() > cutoff).length;

  return {
    username: raw.username ?? '',
    fullName: raw.fullName ?? '',
    biography: raw.biography ?? '',
    followersCount: followers,
    followingCount: raw.followingCount ?? 0,
    postsCount: raw.postsCount ?? 0,
    isBusinessAccount: raw.isBusinessAccount ?? false,
    businessCategoryName: raw.businessCategoryName ?? null,
    externalUrl: raw.externalUrl ?? null,
    profilePicUrl: raw.profilePicUrl ?? '',
    engagementRate: computeEngagement(followers, posts),
    postsPerWeek: Number((recentCount / 4.3).toFixed(1)),
    contentBreakdown: {
      reels: total > 0 ? Math.round((reels / total) * 100) : 0,
      photos: total > 0 ? Math.round(((total - reels - carousels) / total) * 100) : 0,
      carousels: total > 0 ? Math.round((carousels / total) * 100) : 0,
    },
    latestPosts,
  };
}

async function scrapeCompetitorInstagram(
  competitors: CompetitorData[],
  config: PesquisaMercadoConfig,
): Promise<Array<{ handle: string; data: InstagramProfileData }>> {
  const withIG = competitors
    .filter((c) => c.instagramHandle)
    .slice(0, config.max_competitors_instagram);

  if (withIG.length === 0) return [];

  try {
    const usernames = withIG.map((c) => c.instagramHandle!.replace(/^@/, ''));
    logger.info(`[market-research] Step 2/5: Scraping Instagram for ${usernames.length} competitors...`);

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Instagram scrape timeout')), 180_000),
    );

    const actorPromise = runActor<ApifyIGProfile>('apify/instagram-profile-scraper', {
      usernames,
      proxy: { useApifyProxy: true },
    });

    const results = await Promise.race([actorPromise, timeoutPromise]);

    return results
      .filter((r): r is ApifyIGProfile & { username: string } => !!r.username)
      .map((r) => ({ handle: r.username, data: mapIGProfile(r) }));
  } catch (err) {
    logger.error('[market-research] Instagram scrape failed:', err instanceof Error ? err.message : err);
    return [];
  }
}

// ============================================================================
// Step 3: scrapeCompetitorWebsites
// ============================================================================

async function scrapeCompetitorWebsites(
  competitors: CompetitorData[],
  config: PesquisaMercadoConfig,
): Promise<WebsiteScrapedData[]> {
  if (!config.include_competitor_websites) return [];

  const withWebsite = competitors
    .filter((c) => c.website)
    .slice(0, config.max_websites_scrape);

  if (withWebsite.length === 0) return [];

  logger.info(`[market-research] Step 3/5: Scraping ${withWebsite.length} competitor websites...`);
  const results: WebsiteScrapedData[] = [];

  for (const competitor of withWebsite) {
    const markdown = await scrapeUrl(competitor.website!);
    if (markdown) {
      results.push({
        url: competitor.website!,
        markdown,
        scraped_at: new Date().toISOString(),
      });
    }
  }

  return results;
}

// ============================================================================
// Step 4: generateReport
// ============================================================================

function buildSectionsList(sections: PesquisaMercadoConfig['report_sections'], lang: string): string {
  const names: Record<string, string> = lang === 'pt-BR'
    ? {
        market_overview: 'Panorama do Mercado',
        competitor_analysis: 'Analise de Concorrentes',
        social_media_analysis: 'Analise de Redes Sociais',
        digital_presence: 'Presenca Digital',
        opportunities: 'Oportunidades',
        threats: 'Ameacas e Riscos',
        positioning: 'Posicionamento Sugerido',
        action_plan: 'Plano de Acao',
      }
    : {
        market_overview: 'Market Overview',
        competitor_analysis: 'Competitor Analysis',
        social_media_analysis: 'Social Media Analysis',
        digital_presence: 'Digital Presence',
        opportunities: 'Opportunities',
        threats: 'Threats and Risks',
        positioning: 'Suggested Positioning',
        action_plan: 'Action Plan',
      };

  return Object.entries(sections)
    .filter(([, enabled]) => enabled)
    .map(([key]) => `- ${names[key] ?? key}`)
    .join('\n');
}

async function generateReport(
  data: {
    competitors: CompetitorData[];
    instagramData: Array<{ handle: string; data: InstagramProfileData }>;
    websitesData: WebsiteScrapedData[];
    ctx: ConsultancyContext;
    igProfile: InstagramProfileData | null;
  },
  config: PesquisaMercadoConfig,
): Promise<{ reportMarkdown: string; keyInsights: KeyInsights }> {
  logger.info('[market-research] Step 4/5: Generating AI report...');

  const lang = config.report_language === 'pt-BR' ? 'Português do Brasil' : 'English';
  const sectionsList = buildSectionsList(config.report_sections, config.report_language);

  const competitorsTable = data.competitors.slice(0, 10).map((c) => {
    const ig = data.instagramData.find((d) => d.handle === c.instagramHandle?.replace(/^@/, ''));
    return [
      `**${c.name}**`,
      c.address ?? '-',
      c.rating ? `${c.rating} (${c.reviewsCount} avaliações)` : '-',
      ig ? `@${ig.handle} — ${ig.data.followersCount.toLocaleString()} seguidores, ${ig.data.engagementRate}% engajamento` : (c.instagramHandle ?? '-'),
      c.website ?? '-',
    ].join(' | ');
  }).join('\n');

  const websiteContext = data.websitesData.map((w) =>
    `### Site: ${w.url}\n${w.markdown.slice(0, 2000)}`,
  ).join('\n\n');

  const clientIG = data.igProfile
    ? `- Seguidores: ${data.igProfile.followersCount.toLocaleString()}
- Bio: ${data.igProfile.biography?.slice(0, 200) ?? '-'}
- Engajamento: ${data.igProfile.engagementRate}%
- Posts/semana: ${data.igProfile.postsPerWeek}`
    : 'Dados de Instagram não disponíveis';

  const defaultSystemPrompt = `Você é um consultor estratégico especialista em negócios locais no Brasil.
Gere um relatório de inteligência de mercado completo, direto ao ponto e acionável.
Responda EXCLUSIVAMENTE em ${lang}.
Estilo do relatório: ${config.report_style === 'executive' ? 'Executivo e conciso' : config.report_style === 'action-focused' ? 'Orientado a ação com próximos passos claros' : 'Detalhado e aprofundado'}.
Inclua APENAS as seções listadas abaixo. Use Markdown com cabeçalhos H2 para cada seção.`;

  const systemPrompt = config.custom_system_prompt ?? defaultSystemPrompt;

  const userPrompt = `## Contexto da Cliente

- Nome: ${data.ctx.client_name ?? 'Não informado'}
- Consultoria: ${data.ctx.title}
- Nicho: ${data.ctx.niche ?? 'Não informado'}
- Instagram da cliente:
${clientIG}

## Concorrentes Descobertos (${data.competitors.length} encontrados)

${competitorsTable || 'Nenhum concorrente descoberto via Google Maps.'}

${websiteContext ? `## Conteúdo dos Sites\n\n${websiteContext}` : ''}

## Seções Obrigatórias do Relatório

${sectionsList}

---

Gere o relatório de mercado agora. Use H2 (##) para cada seção. Seja específico e use dados reais dos concorrentes quando disponíveis.`;

  let reportMarkdown = '';
  let keyInsights: KeyInsights = { opportunities: [], threats: [], positioning: '' };

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: config.ai_temperature,
      max_tokens: 6000,
    });

    reportMarkdown = completion.choices[0]?.message?.content ?? '';
  } catch (err) {
    throw new Error(`GPT-4 report generation failed: ${err instanceof Error ? err.message : err}`);
  }

  // Extract key insights with a separate structured call
  try {
    const insightsCompletion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Extract key insights from the market research report as JSON. Respond only with valid JSON.' },
        {
          role: 'user',
          content: `From this market report, extract:
1. Top 3-5 opportunities (array of strings)
2. Top 3-5 threats (array of strings)
3. Positioning recommendation (single string)

Report:
${reportMarkdown.slice(0, 4000)}

Respond as JSON: {"opportunities":["..."],"threats":["..."],"positioning":"..."}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 800,
      response_format: { type: 'json_object' },
    });

    const raw = insightsCompletion.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw) as Partial<KeyInsights>;
    keyInsights = {
      opportunities: parsed.opportunities ?? [],
      threats: parsed.threats ?? [],
      positioning: parsed.positioning ?? '',
    };
  } catch {
    // Key insights extraction failure is non-fatal
    logger.warn('[market-research] Key insights extraction failed — skipping');
  }

  return { reportMarkdown, keyInsights };
}

// ============================================================================
// runPipeline
// ============================================================================

async function runPipeline(researchId: string): Promise<void> {
  const db = ensureDb();

  let research: MarketResearch | null = null;
  let config: PesquisaMercadoConfig | null = null;
  let ctx: ConsultancyContext | null = null;

  try {
    // Load research record
    const { data: resData, error: resErr } = await db
      .from('market_research')
      .select('*')
      .eq('id', researchId)
      .single();
    if (resErr || !resData) throw new Error(`Research not found: ${resErr?.message}`);
    research = resData as MarketResearch;

    // Load config snapshot (use stored or fresh)
    config = (research.config_snapshot as PesquisaMercadoConfig | null) ?? await getConfig('pesquisa-mercado');

    // Load consultancy context
    const { data: cData, error: cErr } = await db
      .from('consultancies')
      .select('id, client_name, niche, title, instagram')
      .eq('id', research.consultancy_id)
      .single();
    if (cErr || !cData) throw new Error(`Consultancy not found: ${cErr?.message}`);
    ctx = cData as ConsultancyContext;

    // Load client Instagram data if available
    let igProfile: InstagramProfileData | null = null;
    if (ctx.instagram) {
      const { data: snapData } = await db
        .from('instagram_snapshots')
        .select('raw_data, status')
        .eq('consultancy_id', ctx.id)
        .eq('status', 'done')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (snapData?.raw_data) igProfile = snapData.raw_data as InstagramProfileData;
    }

    // Step 1 — Google Maps
    await updateResearch(researchId, { status: 'running_maps', progress_step: 1 });
    const competitors = await discoverCompetitors(config, ctx);
    await updateResearch(researchId, {
      competitors_discovered: competitors as unknown as MarketResearch['competitors_discovered'],
    });

    // Step 2 — Instagram
    await updateResearch(researchId, { status: 'running_instagram', progress_step: 2 });
    let instagramResults: Array<{ handle: string; data: InstagramProfileData }> = [];
    try {
      instagramResults = await scrapeCompetitorInstagram(competitors, config);
      // Attach instagram data back to competitor objects
      for (const comp of competitors) {
        if (comp.instagramHandle) {
          const match = instagramResults.find(
            (r) => r.handle === comp.instagramHandle!.replace(/^@/, ''),
          );
          if (match) comp.instagramData = match.data;
        }
      }
    } catch {
      logger.warn('[market-research] Instagram step failed — continuing');
    }
    await updateResearch(researchId, {
      instagram_data: instagramResults.map((r) => r.data) as unknown as MarketResearch['instagram_data'],
    });

    // Step 3 — Websites
    await updateResearch(researchId, { status: 'running_websites', progress_step: 3 });
    let websitesData: WebsiteScrapedData[] = [];
    try {
      websitesData = await scrapeCompetitorWebsites(competitors, config);
    } catch {
      logger.warn('[market-research] Websites step failed — continuing');
    }
    await updateResearch(researchId, {
      websites_data: websitesData as unknown as MarketResearch['websites_data'],
    });

    // Step 4 — AI Report
    await updateResearch(researchId, { status: 'running_ai', progress_step: 4 });
    const { reportMarkdown, keyInsights } = await generateReport(
      { competitors, instagramData: instagramResults, websitesData, ctx, igProfile },
      config,
    );

    await updateResearch(researchId, {
      status: 'done',
      progress_step: 5,
      report_markdown: reportMarkdown,
      key_insights: keyInsights as unknown as MarketResearch['key_insights'],
      completed_at: new Date().toISOString(),
    });

    logger.info(`[market-research] Pipeline done for research ${researchId}`);

    // Step 5 — RAG indexing (optional)
    if (config.auto_index_rag && reportMarkdown) {
      try {
        await indexReportInRAG(
          researchId,
          research.consultancy_id,
          research.user_id,
          reportMarkdown,
          config,
          { competitors: competitors as unknown[], instagramData: instagramResults.map((r) => r.data) },
        );
      } catch (err) {
        logger.error('[market-research] RAG indexing failed (non-fatal):', err instanceof Error ? err.message : err);
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`[market-research] Pipeline failed for ${researchId}:`, message);
    await updateResearch(researchId, { status: 'failed', error_message: message });
  }
}

// ============================================================================
// indexReportInRAG
// ============================================================================

async function indexReportInRAG(
  researchId: string,
  consultancyId: string,
  userId: string,
  reportMarkdown: string,
  config: PesquisaMercadoConfig,
  rawData?: { competitors: unknown[] | null; instagramData: unknown[] | null },
): Promise<void> {
  logger.info(`[market-research] Indexing report in RAG for consultancy ${consultancyId}...`);

  // Lazy import to avoid circular deps
  const { processDocument } = await import('./knowledgeService.js');

  const date = new Date().toLocaleDateString('pt-BR');
  const fileName = `Pesquisa de Mercado — ${date}`;

  // Truncate to 50k chars to avoid chunk overload
  const content = reportMarkdown.slice(0, 50_000);
  const fileBuffer = Buffer.from(content, 'utf-8');

  await processDocument({
    userId,
    scope: 'consultancy',
    consultancyId,
    pluginSlug: config.rag_context_tag,
    fileName,
    fileType: 'md',
    fileBuffer,
  });

  // Optionally index raw competitor data as separate document
  if (config.include_raw_data_in_rag && rawData) {
    const rawContent = JSON.stringify({
      competitors: rawData.competitors,
      instagram: rawData.instagramData,
    }, null, 2).slice(0, 50_000);

    const rawBuffer = Buffer.from(rawContent, 'utf-8');
    try {
      await processDocument({
        userId,
        scope: 'consultancy',
        consultancyId,
        pluginSlug: 'pesquisa-mercado-raw',
        fileName: `Dados Brutos — ${date}`,
        fileType: 'md',
        fileBuffer: rawBuffer,
      });
    } catch (err) {
      logger.warn('[market-research] Raw data RAG index failed (non-fatal):', err instanceof Error ? err.message : err);
    }
  }

  await ensureDb()
    .from('market_research')
    .update({ rag_indexed: true })
    .eq('id', researchId);

  logger.info(`[market-research] RAG indexed: document consultancy=${consultancyId}`);
}

// ============================================================================
// Public API
// ============================================================================

export function startResearch(researchId: string): void {
  setImmediate(() => {
    void runPipeline(researchId).catch((err: unknown) => {
      logger.error('[market-research] Unhandled pipeline error:', err);
    });
  });
}

export async function getResearch(
  consultancyId: string,
  userId: string,
): Promise<MarketResearch | null> {
  const db = ensureDb();
  const { data, error } = await db
    .from('market_research')
    .select('*')
    .eq('consultancy_id', consultancyId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Failed to get research: ${error.message}`);
  return data as MarketResearch | null;
}

export { indexReportInRAG };
