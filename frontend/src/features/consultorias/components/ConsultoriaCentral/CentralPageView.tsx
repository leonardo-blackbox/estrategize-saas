import { useEffect, useState } from 'react';
import { useCentralPage } from '../../hooks/useCentralPage.ts';
import { useAutoSave } from '../../hooks/useCentralMutations.ts';
import { CentralPageHeader } from './CentralPageHeader.tsx';
import { CentralPageEditor } from './CentralPageEditor.tsx';

interface Props {
  consultancyId: string;
  pageId: string;
}

export function CentralPageView({ consultancyId, pageId }: Props) {
  const { data: page, isLoading } = useCentralPage(consultancyId, pageId);
  const { scheduleSave, flush, isSaving } = useAutoSave(consultancyId);
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState<string | null>(null);

  useEffect(() => {
    if (page) {
      setTitle(page.title);
      setEmoji(page.emoji);
    }
  }, [page?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Flush on unmount / page change
  useEffect(() => () => flush(), [pageId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading || !page) {
    return (
      <div className="consult-glass p-8">
        <div className="space-y-3 animate-pulse">
          <div className="w-12 h-12 rounded-xl bg-[color-mix(in_srgb,white_5%,transparent)]" />
          <div className="h-9 w-2/3 rounded bg-[color-mix(in_srgb,white_5%,transparent)]" />
          <div className="space-y-2 mt-6">
            <div className="h-4 w-full rounded bg-[color-mix(in_srgb,white_4%,transparent)]" />
            <div className="h-4 w-5/6 rounded bg-[color-mix(in_srgb,white_4%,transparent)]" />
          </div>
        </div>
      </div>
    );
  }

  const handleTitle = (v: string) => {
    setTitle(v);
    scheduleSave(pageId, { title: v });
  };
  const handleEmoji = (v: string) => {
    setEmoji(v);
    scheduleSave(pageId, { emoji: v });
  };
  const handleBlocks = (doc: unknown) => {
    scheduleSave(pageId, { blocks: doc });
  };

  return (
    <div className="consult-glass p-8 min-h-[60vh]">
      <CentralPageHeader
        title={title}
        emoji={emoji}
        isSaving={isSaving}
        onTitleChange={handleTitle}
        onEmojiChange={handleEmoji}
      />
      <CentralPageEditor initialContent={page.blocks} onChange={handleBlocks} />
    </div>
  );
}
