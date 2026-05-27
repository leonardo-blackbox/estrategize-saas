import { useInstagramSnapshot } from '../../hooks/useInstagramSnapshot.ts';
import type { InstagramProfileData } from '../../../../types/market-intelligence.ts';
import { ConnectInstagramButton } from '../ConnectInstagramButton';

const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3010';

function imgProxy(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  return `${API_URL}/api/proxy/image?url=${encodeURIComponent(url)}`;
}

const fmt = (n: number) => Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(n);

interface Props {
  consultancyId: string;
  instagram: string | null;
}

function PostsSkeleton({ handle }: { handle: string }) {
  return (
    <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] p-4">
      <p className="text-xs text-[var(--text-tertiary)]">Carregando últimos posts de @{handle.replace(/^@/, '')}...</p>
      <div className="grid grid-cols-3 gap-1 mt-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-square rounded bg-[var(--bg-base)] animate-pulse" />
        ))}
      </div>
    </div>
  );
}

function PostsGrid({ data }: { data: InstagramProfileData }) {
  if (data.latestPosts.length === 0) return null;

  return (
    <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] p-4">
      <div className="grid grid-cols-3 gap-1">
        {data.latestPosts.slice(0, 6).map((post, i) => (
          <a
            key={i}
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="aspect-square rounded bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-tertiary)] hover:opacity-80 transition-opacity overflow-hidden relative group"
          >
            {post.displayUrl ? (
              <div className="w-full h-full bg-center bg-cover" style={{ backgroundImage: `url(${imgProxy(post.displayUrl)})` }} />
            ) : (
              <span className="text-[10px]">{post.type}</span>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <span className="text-[9px] text-white">♥ {fmt(post.likesCount)}</span>
              <span className="text-[9px] text-white">💬 {fmt(post.commentsCount)}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

export function ConsultoriaDetailInstagram({ consultancyId, instagram }: Props) {
  const { snapshot, isLoading } = useInstagramSnapshot(consultancyId);

  if (!instagram) {
    return (
      <div className="space-y-3">
        <ConnectInstagramButton consultancyId={consultancyId} />
      </div>
    );
  }

  const handle = instagram.replace(/^@/, '');

  const apifyContent = (() => {
    if (isLoading || snapshot?.status === 'pending' || snapshot?.status === 'running') {
      return <PostsSkeleton handle={handle} />;
    }
    if (snapshot?.status === 'failed') {
      return (
        <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] p-4">
          <p className="text-xs text-amber-400">Não foi possível carregar os posts. Verifique se a conta é pública.</p>
        </div>
      );
    }
    if (snapshot?.status === 'done' && snapshot.data) {
      return <PostsGrid data={snapshot.data} />;
    }
    return null;
  })();

  return (
    <div className="space-y-3">
      <ConnectInstagramButton consultancyId={consultancyId} />
      {apifyContent}
    </div>
  );
}
