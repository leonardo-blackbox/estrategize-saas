import React from 'react';

function renderInline(text: string): React.ReactNode[] {
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(regex);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a key={i} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80">
          {linkMatch[1]}
        </a>
      );
    }
    return part;
  });
}

interface Props {
  text: string;
}

export function LessonMarkdown({ text }: Props) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        items.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="list-disc list-inside space-y-1 mt-2">
          {items.map((item, j) => <li key={j} className="text-[15px] text-[var(--color-text-secondary)]">{renderInline(item)}</li>)}
        </ul>,
      );
    } else if (line === '') {
      elements.push(<div key={`br-${i}`} className="h-2" />);
      i++;
    } else {
      elements.push(
        <p key={`p-${i}`} className="text-[15px] text-[var(--color-text-secondary)] leading-relaxed">
          {renderInline(line)}
        </p>,
      );
      i++;
    }
  }

  return <div className="space-y-1">{elements}</div>;
}
