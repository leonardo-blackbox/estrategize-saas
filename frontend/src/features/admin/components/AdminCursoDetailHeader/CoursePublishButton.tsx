interface CoursePublishButtonProps {
  status: 'draft' | 'published' | 'archived';
  onPublish: () => void;
  onUnpublish: () => void;
  isPending: boolean;
}

export function CoursePublishButton({ status, onPublish, onUnpublish, isPending }: CoursePublishButtonProps) {
  const isPublished = status === 'published';

  if (isPublished) {
    return (
      <button
        onClick={onUnpublish}
        disabled={isPending}
        title="Despublicar curso"
        className="text-xs px-3 py-1.5 rounded-md border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-secondary)] transition-colors disabled:opacity-50"
      >
        {isPending ? '...' : 'Despublicar'}
      </button>
    );
  }

  return (
    <button
      onClick={onPublish}
      disabled={isPending}
      title="Publicar curso"
      className="text-xs px-3 py-1.5 rounded-md bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50"
    >
      {isPending ? '...' : 'Publicar'}
    </button>
  );
}
