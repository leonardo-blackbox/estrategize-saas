import { useInstagramSnapshot } from '../../hooks/useInstagramSnapshot.ts';
import { useNotificationPreference } from '../../hooks/useNotificationPreference.ts';
import { getInitials } from '../../consultorias.detail.helpers.ts';
import { PriorityBadge } from '../ConsultoriaDetailShared';
import { phaseConfig, type Consultancy } from '../../services/consultorias.api.ts';
import { cn } from '../../../../lib/cn.ts';

const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3010';
const imgProxy = (url?: string | null) =>
  url ? `${API_URL}/api/proxy/image?url=${encodeURIComponent(url)}` : undefined;

const fmt = (n: number) => Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(n);

interface Props {
  consultancy: Consultancy;
  isActive: boolean;
}

function NotificationBell({ consultancyId }: { consultancyId: string }) {
  const { enabled, toggle } = useNotificationPreference(consultancyId);

  return (
    <button
      type="button"
      onClick={toggle}
      title={enabled ? 'Desativar notificações' : 'Ativar notificações'}
      aria-pressed={enabled}
      className={cn(
        'relative shrink-0 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer',
        'transition-all duration-200 active:scale-90',
        enabled
          ? 'text-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] hover:bg-[color-mix(in_srgb,var(--accent)_18%,transparent)]'
          : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[color-mix(in_srgb,white_6%,transparent)]',
      )}
      style={enabled ? {
        boxShadow: '0 0 16px -4px color-mix(in srgb, var(--accent) 50%, transparent), inset 0 0 0 1px color-mix(in srgb, var(--accent) 25%, transparent)',
      } : undefined}
    >
      {enabled ? (
        <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2a7 7 0 0 0-7 7v3.528a1.5 1.5 0 0 1-.158.67l-1.493 2.985A1.18 1.18 0 0 0 4.41 18h15.18a1.18 1.18 0 0 0 1.06-1.817l-1.493-2.985a1.5 1.5 0 0 1-.158-.67V9a7 7 0 0 0-7-7Zm-2.236 18a3 3 0 0 0 4.472 0H9.764Z"/>
        </svg>
      ) : (
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
        </svg>
      )}
      {enabled && (
        <span
          className="absolute top-2 right-2 w-2 h-2 rounded-full"
          style={{
            background: 'var(--accent)',
            boxShadow: '0 0 8px var(--accent)',
          }}
        />
      )}
    </button>
  );
}

export function HeaderIdentity({ consultancy, isActive }: Props) {
  const { snapshot } = useInstagramSnapshot(consultancy.id);
  const ig = snapshot?.status === 'done' ? snapshot.data : null;

  if (ig) {
    const picUrl = imgProxy(ig.profilePicUrl);
    const followingRatio = ig.followingCount > 0
      ? (ig.followersCount / ig.followingCount).toFixed(1) + 'x'
      : '—';
    const kpis = [
      { label: 'Seguidores',    value: fmt(ig.followersCount) },
      { label: 'Seguindo',      value: fmt(ig.followingCount) },
      { label: 'Posts',         value: fmt(ig.postsCount) },
      { label: 'Engajamento',   value: `${ig.engagementRate}%` },
      { label: 'Posts/semana',  value: String(ig.postsPerWeek) },
      { label: 'Reels',         value: `${ig.contentBreakdown.reels}%` },
      { label: 'Carrosséis',    value: `${ig.contentBreakdown.carousels}%` },
      { label: 'Ratio S/F',     value: followingRatio },
    ];

    return (
      <div className="consult-glass px-6 py-7 space-y-7">
        {/* Profile row + bell */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            {picUrl ? (
              <div className="relative shrink-0">
                <img
                  src={picUrl}
                  alt={ig.fullName}
                  className="w-14 h-14 rounded-full object-cover"
                  style={{
                    boxShadow: '0 0 0 2px color-mix(in srgb, var(--accent) 40%, transparent), 0 8px 24px -4px rgba(0,0,0,0.4)',
                  }}
                />
                {isActive && (
                  <span
                    className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2"
                    style={{
                      background: 'var(--color-success)',
                      borderColor: 'var(--bg-base)',
                      boxShadow: '0 0 8px var(--color-success)',
                    }}
                  />
                )}
              </div>
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                {(ig.fullName || ig.username).slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-[17px] font-semibold text-[var(--text-primary)] truncate tracking-tight">
                {ig.fullName || ig.username}
              </h1>
              <p className="text-[13px] text-[var(--text-tertiary)] truncate">
                @{ig.username}
                {ig.businessCategoryName ? ` · ${ig.businessCategoryName}` : ''}
              </p>
            </div>
          </div>
          <NotificationBell consultancyId={consultancy.id} />
        </div>

        {/* KPIs grid */}
        <div className="grid grid-cols-4 lg:grid-cols-8 gap-2">
          {kpis.map(({ label, value }) => (
            <div
              key={label}
              className="rounded-xl py-3.5 px-2 text-center transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_6%,transparent)]"
              style={{
                background: 'color-mix(in srgb, var(--bg-base) 50%, transparent)',
                border: '1px solid color-mix(in srgb, white 5%, transparent)',
              }}
            >
              <p
                className="text-[15px] font-bold text-[var(--text-primary)] leading-tight"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {value}
              </p>
              <p className="text-[10px] text-[var(--text-tertiary)] mt-1 uppercase tracking-wider font-medium">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Fallback (no Instagram snapshot yet) ──
  const phase    = consultancy.phase;
  const phaseCfg = phase ? phaseConfig[phase] : null;
  const initials = getInitials(consultancy.client_name, consultancy.title);
  const avatarStyle = phaseCfg
    ? { backgroundColor: `var(${phaseCfg.bgVar})`, color: `var(${phaseCfg.colorVar})` }
    : { backgroundColor: 'var(--bg-surface-2)', color: 'var(--text-secondary)' };

  return (
    <div className="consult-glass px-6 py-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <div
            className="w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center text-base font-bold select-none"
            style={{
              ...avatarStyle,
              boxShadow: '0 8px 24px -8px rgba(0,0,0,0.5)',
            }}
          >
            {initials}
          </div>
          <div className="min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[17px] font-semibold text-[var(--text-primary)] leading-tight tracking-tight">
                {consultancy.client_name || consultancy.title}
              </h1>
              <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', isActive ? 'bg-[var(--color-success)]' : 'bg-[var(--text-muted)]')} />
            </div>
            {consultancy.client_name && (
              <p className="text-[13px] text-[var(--text-tertiary)]">{consultancy.title}</p>
            )}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {phaseCfg && (
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
                  style={{ backgroundColor: `var(${phaseCfg.bgVar})`, color: `var(${phaseCfg.colorVar})` }}
                >
                  {phaseCfg.label}
                </span>
              )}
              <PriorityBadge priority={consultancy.priority} />
              {consultancy.niche && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--bg-surface-2)] text-[var(--text-tertiary)] ring-1 ring-inset ring-[var(--border-hairline)]">
                  {consultancy.niche}
                </span>
              )}
            </div>
          </div>
        </div>
        <NotificationBell consultancyId={consultancy.id} />
      </div>
    </div>
  );
}
