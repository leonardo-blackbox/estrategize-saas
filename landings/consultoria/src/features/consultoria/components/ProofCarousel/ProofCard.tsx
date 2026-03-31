interface ProofCardProps {
  initial: string;
  name: string;
  role: string;
  quote: string;
  highlight: string;
  imageSrc?: string;
  index: number;
}

export function ProofCard({ initial, name, role, quote, highlight, imageSrc }: ProofCardProps) {
  const quoteWithHighlight = quote.replace(
    highlight,
    `<strong style="color:var(--l-accent)">${highlight}</strong>`
  );

  return (
    <div className="proof-card">
      {/* Screenshot ou placeholder */}
      <div className="proof-card-screenshot">
        {imageSrc ? (
          <img src={imageSrc} alt={`Resultado de ${name}`} />
        ) : (
          <div
            className="proof-card-screenshot placeholder"
            role="img"
            aria-label={`Print de resultado de ${name} — a ser adicionado`}
          >
            {/* TODO: substituir pela foto real do Google Drive */}
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" opacity={0.25} aria-hidden>
              <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
              <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        )}
      </div>

      {/* Quote */}
      <p
        className="proof-card-quote"
        dangerouslySetInnerHTML={{ __html: quoteWithHighlight }}
      />

      {/* Meta */}
      <div className="proof-card-meta">
        <div className="proof-card-avatar" aria-hidden="true">{initial}</div>
        <div>
          <p className="proof-card-name">{name}</p>
          <p className="proof-card-role">{role}</p>
        </div>
      </div>
    </div>
  );
}
