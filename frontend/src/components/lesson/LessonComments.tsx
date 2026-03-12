import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore.ts';
import {
  getLessonComments,
  createLessonComment,
  deleteLessonComment,
  type LessonComment,
} from '../../api/courses.ts';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `há ${days} dia${days !== 1 ? 's' : ''}`;
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function UserAvatar({ email }: { email: string }) {
  const initial = email?.[0]?.toUpperCase() ?? '?';
  return (
    <div className="shrink-0 w-8 h-8 rounded-full bg-[var(--color-bg-active)] border border-[var(--color-border-subtle)] flex items-center justify-center text-[13px] font-semibold text-[var(--color-text-secondary)]">
      {initial}
    </div>
  );
}

interface CommentItemProps {
  comment: LessonComment;
  currentUserId?: string;
  lessonId: string;
  onDelete: (id: string) => void;
  isReply?: boolean;
}

function CommentItem({ comment, currentUserId, lessonId, onDelete, isReply }: CommentItemProps) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const qc = useQueryClient();

  const replyMutation = useMutation({
    mutationFn: (content: string) =>
      createLessonComment(lessonId, { content, parent_id: comment.id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', lessonId] });
      setReplyText('');
      setShowReply(false);
    },
  });

  return (
    <div className={isReply ? 'ml-10' : ''}>
      <div className="flex gap-3">
        <UserAvatar email={comment.user.email} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-[13px] font-medium text-[var(--color-text-primary)]">
              {comment.user.email.split('@')[0]}
            </span>
            <span className="text-[11px] text-[var(--color-text-tertiary)]">
              {timeAgo(comment.created_at)}
            </span>
          </div>
          <p className="text-[14px] text-[var(--color-text-secondary)] mt-1 leading-relaxed whitespace-pre-wrap">
            {comment.content}
          </p>
          <div className="flex items-center gap-3 mt-2">
            {!isReply && (
              <button
                onClick={() => setShowReply((s) => !s)}
                className="text-[12px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                Responder
              </button>
            )}
            {comment.user_id === currentUserId && (
              <>
                {confirmDelete ? (
                  <>
                    <button
                      onClick={() => onDelete(comment.id)}
                      className="text-[12px] text-red-500 hover:text-red-400"
                    >
                      Confirmar exclusão
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="text-[12px] text-[var(--color-text-tertiary)]"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="text-[12px] text-[var(--color-text-tertiary)] hover:text-red-400 transition-colors"
                  >
                    Excluir
                  </button>
                )}
              </>
            )}
          </div>

          {showReply && (
            <div className="mt-3 space-y-2">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`@${comment.user.email.split('@')[0]} `}
                rows={2}
                className="w-full rounded-[12px] border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] px-3 py-2 text-[14px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] resize-none focus:outline-none focus:border-[var(--color-border-default)] transition-colors"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => replyMutation.mutate(replyText)}
                  disabled={!replyText.trim() || replyMutation.isPending}
                  className="text-[13px] font-medium text-[var(--color-bg-primary)] bg-[var(--color-text-primary)] px-4 py-1.5 rounded-full disabled:opacity-50 hover:opacity-90 transition-opacity"
                >
                  Responder
                </button>
                <button
                  onClick={() => setShowReply(false)}
                  className="text-[13px] text-[var(--color-text-tertiary)] px-3 py-1.5"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface Props {
  lessonId: string;
}

export function LessonComments({ lessonId }: Props) {
  const [newComment, setNewComment] = useState('');
  const [offset, setOffset] = useState(0);
  const [allComments, setAllComments] = useState<LessonComment[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const session = useAuthStore((s) => s.session);
  const currentUserId = session?.user?.id;
  const qc = useQueryClient();

  const { isLoading } = useQuery({
    queryKey: ['comments', lessonId, offset],
    queryFn: async () => {
      const result = await getLessonComments(lessonId, offset);
      if (offset === 0) {
        setAllComments(result.comments);
      } else {
        setAllComments((prev) => [...prev, ...result.comments]);
      }
      setHasMore(result.hasMore);
      return result;
    },
  });

  const createMutation = useMutation({
    mutationFn: (content: string) => createLessonComment(lessonId, { content }),
    onSuccess: () => {
      setNewComment('');
      setOffset(0);
      qc.invalidateQueries({ queryKey: ['comments', lessonId] });
    },
  });

  const handleDelete = async (commentId: string) => {
    await deleteLessonComment(commentId);
    setAllComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  // Group: top-level and replies
  const topLevel = allComments.filter((c) => !c.parent_id);
  const repliesMap = allComments.reduce<Record<string, LessonComment[]>>((acc, c) => {
    if (c.parent_id) {
      if (!acc[c.parent_id]) acc[c.parent_id] = [];
      acc[c.parent_id].push(c);
    }
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <h2 className="text-[18px] font-semibold text-[var(--color-text-primary)]">
        Comentários {allComments.length > 0 && <span className="text-[var(--color-text-tertiary)] text-[15px] font-normal ml-1">({allComments.length})</span>}
      </h2>

      {/* New comment form */}
      <div className="space-y-3">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Escreva um comentário..."
          rows={3}
          className="w-full rounded-[16px] border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] px-4 py-3 text-[14px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] resize-none focus:outline-none focus:border-[var(--color-border-default)] transition-colors"
        />
        <button
          onClick={() => createMutation.mutate(newComment)}
          disabled={!newComment.trim() || createMutation.isPending}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--color-text-primary)] px-5 py-2.5 text-[14px] font-semibold text-[var(--color-bg-primary)] hover:opacity-90 disabled:opacity-50 active:scale-95 transition-all duration-200"
        >
          {createMutation.isPending ? 'Enviando...' : 'Comentar'}
        </button>
      </div>

      {/* Comments list */}
      {isLoading && offset === 0 ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-[var(--color-bg-elevated)] shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 rounded bg-[var(--color-bg-elevated)]" />
                <div className="h-3 w-full rounded bg-[var(--color-bg-elevated)]" />
              </div>
            </div>
          ))}
        </div>
      ) : topLevel.length === 0 ? (
        <p className="text-[14px] text-[var(--color-text-tertiary)] text-center py-6">
          Seja o primeiro a comentar nesta aula.
        </p>
      ) : (
        <div className="space-y-6">
          {topLevel.map((comment) => (
            <div key={comment.id} className="space-y-4">
              <CommentItem
                comment={comment}
                currentUserId={currentUserId}
                lessonId={lessonId}
                onDelete={handleDelete}
              />
              {(repliesMap[comment.id] ?? []).map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  currentUserId={currentUserId}
                  lessonId={lessonId}
                  onDelete={handleDelete}
                  isReply
                />
              ))}
            </div>
          ))}

          {hasMore && (
            <button
              onClick={() => setOffset((o) => o + 20)}
              className="w-full text-[14px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors py-2"
            >
              Ver mais comentários
            </button>
          )}
        </div>
      )}
    </div>
  );
}
