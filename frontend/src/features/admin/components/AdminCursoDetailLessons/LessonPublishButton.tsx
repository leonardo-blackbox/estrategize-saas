interface LessonPublishButtonProps {
  lessonId: string;
  status: 'draft' | 'published';
  onPublish: (id: string) => void;
  onUnpublish: (id: string) => void;
  isPending: boolean;
}

export function LessonPublishButton({
  lessonId, status, onPublish, onUnpublish, isPending,
}: LessonPublishButtonProps) {
  const isPublished = status === 'published';

  return (
    <button
      disabled={isPending}
      onClick={() => isPublished ? onUnpublish(lessonId) : onPublish(lessonId)}
      title={isPublished ? 'Despublicar aula' : 'Publicar aula'}
      className="flex items-center gap-1 hover:opacity-80 transition-opacity disabled:opacity-40"
    >
      <span
        className={`inline-block w-2 h-2 rounded-full ${isPublished ? 'bg-green-500' : 'bg-[var(--text-tertiary)]'}`}
      />
      <span className="text-[10px] text-[var(--text-tertiary)]">
        {isPublished ? 'Pub' : 'Draft'}
      </span>
    </button>
  );
}
