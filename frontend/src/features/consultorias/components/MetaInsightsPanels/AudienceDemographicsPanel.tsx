import { useState } from 'react';
import type { AudienceData, AudienceResponse } from '../../../../api/meta.ts';

const AGE_BUCKETS = ['13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'];

interface Props {
  data: AudienceResponse;
}

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function PyramidBar({ male, female, age }: { male: number; female: number; age: string }) {
  const max = 0.4; // 40% como max visual
  const mWidth = Math.min((male / max) * 100, 100);
  const fWidth = Math.min((female / max) * 100, 100);

  return (
    <div className="flex items-center gap-2 text-[11px]">
      <div className="flex-1 flex justify-end items-center gap-2">
        <span className="text-[var(--text-tertiary)] tabular-nums">{pct(male)}</span>
        <div className="h-3 bg-blue-500/40 rounded-l" style={{ width: `${mWidth}%`, minWidth: male > 0 ? '4px' : 0 }} />
      </div>
      <span className="w-10 text-center text-[var(--text-secondary)] font-mono">{age}</span>
      <div className="flex-1 flex items-center gap-2">
        <div className="h-3 bg-pink-500/40 rounded-r" style={{ width: `${fWidth}%`, minWidth: female > 0 ? '4px' : 0 }} />
        <span className="text-[var(--text-tertiary)] tabular-nums">{pct(female)}</span>
      </div>
    </div>
  );
}

function LocationList({ items, label }: { items: AudienceData['top_cities']; label: string }) {
  const top = items.slice(0, 5);
  if (top.length === 0) {
    return <p className="text-[11px] text-[var(--text-muted)]">Sem dados</p>;
  }
  return (
    <div className="space-y-1.5">
      {top.map((item, i) => (
        <div key={`${label}-${i}`} className="flex items-center justify-between text-[11px]">
          <span className="text-[var(--text-secondary)] truncate">
            {item.city ? `${item.city}, ${item.country}` : item.country}
          </span>
          <span className="text-[var(--text-tertiary)] tabular-nums">{pct(item.percent)}</span>
        </div>
      ))}
    </div>
  );
}

function AudiencePanel({ aud }: { aud: AudienceData }) {
  const buckets = AGE_BUCKETS.map((age) => {
    const male = aud.age_gender[`M.${age}`] ?? 0;
    const female = aud.age_gender[`F.${age}`] ?? 0;
    return { age, male, female };
  });

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] mb-2">Faixa etária × Gênero</p>
        <div className="space-y-1">
          {buckets.map((b) => (
            <PyramidBar key={b.age} male={b.male} female={b.female} age={b.age} />
          ))}
        </div>
        <div className="flex items-center gap-4 mt-2 text-[10px]">
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-blue-500/60" /> Masc</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-pink-500/60" /> Fem</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] mb-2">Top cidades</p>
          <LocationList items={aud.top_cities} label="city" />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] mb-2">Top países</p>
          <LocationList items={aud.top_countries} label="country" />
        </div>
      </div>
    </div>
  );
}

export function AudienceDemographicsPanel({ data }: Props) {
  const [tab, setTab] = useState<'follower' | 'engaged'>('follower');
  const aud = data[tab];

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">Audiência</h3>
        <div className="inline-flex rounded-full bg-[var(--bg-base)] p-0.5 border border-[var(--border-hairline)]">
          <button
            type="button"
            onClick={() => setTab('follower')}
            className={`px-3 py-1 text-[11px] rounded-full transition ${
              tab === 'follower' ? 'bg-[var(--bg-surface-2)] text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'
            }`}
          >
            Seguidores
          </button>
          <button
            type="button"
            onClick={() => setTab('engaged')}
            className={`px-3 py-1 text-[11px] rounded-full transition ${
              tab === 'engaged' ? 'bg-[var(--bg-surface-2)] text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'
            }`}
          >
            Engajados
          </button>
        </div>
      </div>
      {aud ? (
        <AudiencePanel aud={aud} />
      ) : (
        <p className="text-[12px] text-[var(--text-tertiary)] py-8 text-center">
          {tab === 'engaged'
            ? 'Audiência engajada muito pequena para demografia. Mínimo de 100 contas que interagiram recentemente.'
            : 'Demografia indisponível. Conta precisa de pelo menos 100 seguidores.'}
        </p>
      )}
    </div>
  );
}
