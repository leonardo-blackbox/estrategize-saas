import { useInstagramSnapshot } from '../../hooks/useInstagramSnapshot.ts';
import type { InstagramProfileData } from '../../../../types/market-intelligence.ts';

interface Props {
  consultancyId: string;
  instagram: string | null;
}

function formatCount(n: number): string {
  return Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(n);
}

function IGSkeleton({ handle }: { handle: string }) {
  return (
    <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] p-4 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-[var(--border-default)]" />
        <div className="space-y-1.5">
          <div className="h-3 w-32 bg-[var(--border-default)] rounded" />
          <div className="h-2 w-20 bg-[var(--border-default)] rounded" />
        </div>
      </div>
      <p className="text-xs text-[var(--text-tertiary)]">Analisando perfil @{handle.replace(/^@/, '')}...</p>
    </div>
  );
}

function IGCard({ data }: { data: InstagramProfileData }) {
  const initials = data.fullName?.slice(0, 2).toUpperCase() || data.username.slice(0, 2).toUpperCase();

  return (
    <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] p-4 space-y-3">
      <div className="flex items-start gap-3">
        {data.profilePicUrl ? (
          <div className="w-10 h-10 rounded-full bg-center bg-cover flex-shrink-0" style={{ backgroundImage: `url(${data.profilePicUrl})` }} />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{initials}</div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-[var(--text-primary)] truncate">{data.fullName || data.username}</span>
            {data.isBusinessAccount && <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded">Conta Business</span>}
          </div>
          <span className="text-xs text-[var(--text-tertiary)]">@{data.username}</span>
          {data.businessCategoryName && <span className="block text-xs text-[var(--text-muted)]">{data.businessCategoryName}</span>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Seguidores', value: formatCount(data.followersCount) },
          { label: 'Posts', value: formatCount(data.postsCount) },
          { label: 'Engajamento', value: `${data.engagementRate}%` },
        ].map(({ label, value }) => (
          <div key={label} className="text-center p-2 rounded-lg bg-[var(--bg-base)]">
            <p className="text-sm font-bold text-[var(--text-primary)]">{value}</p>
            <p className="text-[10px] text-[var(--text-tertiary)]">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
        <span className="font-medium">{data.postsPerWeek}</span>
        <span className="text-[var(--text-tertiary)]">posts/semana</span>
      </div>

      {data.biography && (
        <p className="text-xs text-[var(--text-secondary)] line-clamp-2">{data.biography}</p>
      )}

      {data.externalUrl && (
        <a href={data.externalUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--accent)] hover:underline truncate block">
          {data.externalUrl}
        </a>
      )}

      <div className="flex gap-1.5 flex-wrap">
        {data.contentBreakdown.reels > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400">{data.contentBreakdown.reels}% Reels</span>}
        {data.contentBreakdown.photos > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">{data.contentBreakdown.photos}% Fotos</span>}
        {data.contentBreakdown.carousels > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">{data.contentBreakdown.carousels}% Carrosseis</span>}
      </div>

      {data.latestPosts.length > 0 && (
        <div className="grid grid-cols-3 gap-1">
          {data.latestPosts.slice(0, 6).map((post, i) => (
            <a key={i} href={post.url} target="_blank" rel="noopener noreferrer"
              className="aspect-square rounded bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-tertiary)] hover:opacity-80 transition-opacity overflow-hidden relative group">
              {post.displayUrl ? (
                <div className="w-full h-full bg-center bg-cover" style={{ backgroundImage: `url(${post.displayUrl})` }} />
              ) : (
                <span className="text-[10px]">{post.type}</span>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <span className="text-[9px] text-white">♥ {formatCount(post.likesCount)}</span>
                <span className="text-[9px] text-white">💬 {formatCount(post.commentsCount)}</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export function ConsultoriaDetailInstagram({ consultancyId, instagram }: Props) {
  const { snapshot, isLoading } = useInstagramSnapshot(consultancyId);

  if (!instagram) return null;

  const handle = instagram.replace(/^@/, '');

  if (isLoading || snapshot?.status === 'pending' || snapshot?.status === 'running') {
    return <IGSkeleton handle={handle} />;
  }

  if (snapshot?.status === 'failed') {
    return (
      <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] p-4">
        <p className="text-xs text-amber-400">Nao foi possivel analisar o perfil. Verifique se a conta e publica.</p>
      </div>
    );
  }

  if (snapshot?.status === 'done' && snapshot.data) {
    return <IGCard data={snapshot.data} />;
  }

  return null;
}
