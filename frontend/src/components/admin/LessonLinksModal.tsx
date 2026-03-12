import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  adminCreateLessonLink,
  adminUpdateLessonLink,
  adminDeleteLessonLink,
  type LessonLink,
} from '../../api/courses.ts';
import { Modal } from '../ui/Modal.tsx';
import { Button } from '../ui/Button.tsx';
import { Input } from '../ui/Input.tsx';

interface Props {
  lessonId: string;
  lessonTitle: string;
  courseId: string;
  links: LessonLink[];
  onClose: () => void;
}

const emptyForm = { type: 'link' as 'link' | 'button', label: '', url: '' };

export function LessonLinksModal({ lessonId, lessonTitle, courseId, links, onClose }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-course', courseId] });

  const createMutation = useMutation({
    mutationFn: () => adminCreateLessonLink(lessonId, { ...form, sort_order: links.length }),
    onSuccess: () => { invalidate(); setForm(emptyForm); },
  });

  const updateMutation = useMutation({
    mutationFn: (id: string) => adminUpdateLessonLink(id, editForm),
    onSuccess: () => { invalidate(); setEditingId(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: adminDeleteLessonLink,
    onSuccess: () => { invalidate(); setConfirmDelete(null); },
  });

  const startEdit = (link: LessonLink) => {
    setEditingId(link.id);
    setEditForm({ type: link.type, label: link.label, url: link.url });
  };

  return (
    <Modal open onClose={onClose} className="sm:max-w-lg">
      <div className="p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Links e CTAs</h2>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5 truncate">{lessonTitle}</p>
        </div>

        {/* Existing links */}
        {links.length > 0 && (
          <div className="space-y-2">
            {links.map((link) => (
              <div key={link.id}>
                {editingId === link.id ? (
                  <div className="rounded-[var(--radius-sm)] border border-[var(--border-hairline)] p-3 space-y-2">
                    <div className="flex gap-2">
                      <select
                        value={editForm.type}
                        onChange={(e) => setEditForm((f) => ({ ...f, type: e.target.value as 'link' | 'button' }))}
                        className="text-xs rounded border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] text-[var(--text-primary)] px-2 py-1"
                      >
                        <option value="link">Link</option>
                        <option value="button">Botão CTA</option>
                      </select>
                    </div>
                    <Input
                      label="Label"
                      value={editForm.label}
                      onChange={(e) => setEditForm((f) => ({ ...f, label: e.target.value }))}
                    />
                    <Input
                      label="URL"
                      value={editForm.url}
                      onChange={(e) => setEditForm((f) => ({ ...f, url: e.target.value }))}
                      placeholder="https://..."
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => updateMutation.mutate(link.id)}
                        disabled={!editForm.label.trim() || !editForm.url.trim() || updateMutation.isPending}
                      >
                        Salvar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--border-hairline)] px-3 py-2.5">
                    <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${link.type === 'button' ? 'bg-[var(--text-primary)] text-[var(--bg-base)]' : 'bg-[var(--bg-hover)] text-[var(--text-secondary)]'}`}>
                      {link.type === 'button' ? 'CTA' : 'Link'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[var(--text-primary)] truncate">{link.label}</p>
                      <p className="text-[10px] text-[var(--text-tertiary)] truncate">{link.url}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => startEdit(link)}
                        className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] px-1.5 py-1"
                      >
                        Editar
                      </button>
                      {confirmDelete === link.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => deleteMutation.mutate(link.id)}
                            disabled={deleteMutation.isPending}
                            className="text-[10px] text-red-500 px-1.5 py-1"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="text-[10px] text-[var(--text-tertiary)] px-1.5 py-1"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(link.id)}
                          className="text-[10px] text-[var(--text-tertiary)] hover:text-red-500 px-1.5 py-1"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {links.length === 0 && (
          <p className="text-xs text-[var(--text-tertiary)] text-center py-3">
            Nenhum link configurado.
          </p>
        )}

        {/* Add new link */}
        <div className="border-t border-[var(--border-hairline)] pt-4 space-y-3">
          <p className="text-xs font-medium text-[var(--text-secondary)]">Adicionar</p>
          <div className="flex gap-2">
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'link' | 'button' }))}
              className="text-xs rounded border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] text-[var(--text-primary)] px-2 py-1.5"
            >
              <option value="link">Link simples</option>
              <option value="button">Botão CTA</option>
            </select>
          </div>
          <Input
            label="Label *"
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            placeholder="Ex: Baixar material"
          />
          <Input
            label="URL *"
            value={form.url}
            onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
            placeholder="https://..."
          />
          <Button
            size="sm"
            onClick={() => createMutation.mutate()}
            disabled={!form.label.trim() || !form.url.trim() || createMutation.isPending}
          >
            {createMutation.isPending ? 'Adicionando...' : '+ Adicionar link'}
          </Button>
        </div>

        <div className="flex justify-end pt-1">
          <Button variant="ghost" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
