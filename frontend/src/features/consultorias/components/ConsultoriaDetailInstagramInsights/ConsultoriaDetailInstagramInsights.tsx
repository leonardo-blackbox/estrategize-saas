import { useInstagramSnapshot } from '../../hooks/useInstagramSnapshot.ts';
import type { InstagramProfileData, InstagramLatestPost } from '../../../../types/market-intelligence.ts';

const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3010';
const imgProxy = (url?: string | null) =>
  url ? `${API_URL}/api/proxy/image?url=${encodeURIComponent(url)}` : undefined;

const fmt = (n: number) => Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(n);

interface Props {
  consultancyId: string;
  instagram: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────

function Card({ title, children, className = '' }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[var(--radius-lg)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] p-5 ${className}`}>
      {title && (
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-3">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

function ContentMixBar({ label, percent, color }: { label: string; percent: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-[var(--text-secondary)]">{label}</span>
        <span className="font-semibold text-[var(--text-primary)]">{percent}%</span>
      </div>
      <div className="h-2 bg-[var(--bg-base)] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${percent}%`, background: color }} />
      </div>
    </div>
  );
}

function PerformanceStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-[var(--radius-md)] bg-[var(--bg-base)] py-4 px-3 text-center">
      <p className="text-lg font-bold text-[var(--text-primary)] leading-tight">{value}</p>
      <p className="text-[10px] text-[var(--text-tertiary)] mt-1 uppercase tracking-wider">{label}</p>
      {sub && <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{sub}</p>}
    </div>
  );
}

function PostThumb({ post }: { post: InstagramLatestPost }) {
  return (
    <a
      href={post.url}
      target="_blank"
      rel="noopener noreferrer"
      className="aspect-square rounded-[var(--radius-md)] bg-[var(--bg-base)] overflow-hidden relative group"
    >
      {post.displayUrl ? (
        <div className="w-full h-full bg-center bg-cover" style={{ backgroundImage: `url(${imgProxy(post.displayUrl)})` }} />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-[10px] text-[var(--text-tertiary)]">{post.type}</div>
      )}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
        <span className="text-xs font-medium text-white">♥ {fmt(post.likesCount)}</span>
        <span className="text-xs font-medium text-white">💬 {fmt(post.commentsCount)}</span>
      </div>
      <div className="absolute top-1.5 left-1.5 text-[9px] px-1.5 py-0.5 rounded bg-black/60 text-white font-medium">
        {post.type === 'Video' ? 'Reel' : post.type === 'Sidecar' ? 'Carrossel' : 'Foto'}
      </div>
    </a>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function InsightsContent({ data, scrapedAt }: { data: InstagramProfileData; scrapedAt: string | null }) {
  const posts = data.latestPosts;
  const totalLikes    = posts.reduce((s, p) => s + p.likesCount, 0);
  const totalComments = posts.reduce((s, p) => s + p.commentsCount, 0);
  const avgLikes      = posts.length ? Math.round(totalLikes / posts.length) : 0;
  const avgComments   = posts.length ? Math.round(totalComments / posts.length) : 0;
  const topPost       = posts.length
    ? [...posts].sort((a, b) => (b.likesCount + b.commentsCount) - (a.likesCount + a.commentsCount))[0]
    : null;

  const lastUpdate = scrapedAt
    ? new Date(scrapedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="space-y-5">
      {/* Bio + meta info */}
      {(data.biography || data.externalUrl || data.businessCategoryName || data.isBusinessAccount) && (
        <Card title="Sobre o perfil">
          <div className="space-y-3">
            {data.biography && (
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">{data.biography}</p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              {data.isBusinessAccount && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-medium">
                  Conta Business
                </span>
              )}
              {data.businessCategoryName && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--bg-surface-2)] text-[var(--text-tertiary)]">
                  {data.businessCategoryName}
                </span>
              )}
              {data.externalUrl && (
                <a href={data.externalUrl} target="_blank" rel="noopener noreferrer"
                   className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                  </svg>
                  {data.externalUrl.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Performance stats */}
      <Card title="Performance">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <PerformanceStat label="Curtidas/post"   value={fmt(avgLikes)}    sub="média" />
          <PerformanceStat label="Comentários/post" value={fmt(avgComments)} sub="média" />
          <PerformanceStat label="Engajamento"      value={`${data.engagementRate}%`} sub="taxa" />
          <PerformanceStat label="Frequência"        value={`${data.postsPerWeek}/sem`} sub="posts" />
        </div>
      </Card>

      {/* Content mix */}
      <Card title="Mix de conteúdo">
        <div className="space-y-3">
          <ContentMixBar label="Reels"      percent={data.contentBreakdown.reels}     color="linear-gradient(90deg, oklch(0.55 0.18 295), oklch(0.55 0.20 320))" />
          <ContentMixBar label="Carrosséis" percent={data.contentBreakdown.carousels} color="linear-gradient(90deg, var(--accent), var(--accent-light))" />
          <ContentMixBar label="Fotos"      percent={data.contentBreakdown.photos}    color="linear-gradient(90deg, oklch(0.65 0.15 220), oklch(0.65 0.18 240))" />
        </div>
      </Card>

      {/* Top performing post */}
      {topPost && (
        <Card title="Post de maior engajamento">
          <div className="flex gap-4 items-start">
            <div className="w-24 h-24 shrink-0 rounded-[var(--radius-md)] overflow-hidden bg-[var(--bg-base)]">
              {topPost.displayUrl && (
                <a href={topPost.url} target="_blank" rel="noopener noreferrer">
                  <div className="w-full h-full bg-center bg-cover" style={{ backgroundImage: `url(${imgProxy(topPost.displayUrl)})` }} />
                </a>
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-3 text-sm font-semibold text-[var(--text-primary)]">
                <span>♥ {fmt(topPost.likesCount)}</span>
                <span>💬 {fmt(topPost.commentsCount)}</span>
              </div>
              {topPost.caption && (
                <p className="text-xs text-[var(--text-secondary)] line-clamp-3 leading-relaxed">{topPost.caption}</p>
              )}
              <a href={topPost.url} target="_blank" rel="noopener noreferrer"
                 className="inline-block text-[11px] text-[var(--accent)] hover:underline">
                Ver no Instagram →
              </a>
            </div>
          </div>
        </Card>
      )}

      {/* Latest posts grid */}
      {posts.length > 0 && (
        <Card title={`Últimas publicações (${posts.length})`}>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
            {posts.slice(0, 12).map((post, i) => <PostThumb key={i} post={post} />)}
          </div>
        </Card>
      )}

      {/* Snapshot footer */}
      {lastUpdate && (
        <p className="text-[11px] text-[var(--text-muted)] text-center">
          Última atualização: {lastUpdate}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export function ConsultoriaDetailInstagramInsights({ consultancyId, instagram }: Props) {
  const { snapshot, isLoading } = useInstagramSnapshot(consultancyId);

  if (!instagram) {
    return (
      <Card>
        <p className="text-sm text-[var(--text-secondary)]">Nenhum perfil do Instagram cadastrado para esta consultoria.</p>
      </Card>
    );
  }

  const handle = instagram.replace(/^@/, '');

  if (isLoading || snapshot?.status === 'pending' || snapshot?.status === 'running') {
    return (
      <Card>
        <p className="text-sm text-[var(--text-tertiary)]">Analisando o perfil @{handle}...</p>
      </Card>
    );
  }

  if (snapshot?.status === 'failed') {
    return (
      <Card>
        <p className="text-sm text-amber-400">Não foi possível analisar o perfil. Verifique se a conta é pública.</p>
      </Card>
    );
  }

  if (snapshot?.status === 'done' && snapshot.data) {
    return <InsightsContent data={snapshot.data} scrapedAt={snapshot.scraped_at} />;
  }

  return null;
}
