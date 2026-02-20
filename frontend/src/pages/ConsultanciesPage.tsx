import { useState, useEffect, useCallback } from 'react';
import {
  fetchConsultancies,
  createConsultancy,
  updateConsultancy,
  deleteConsultancy,
} from '../api/consultancies.ts';
import type { Consultancy, CreateConsultancyPayload, UpdateConsultancyPayload } from '../api/consultancies.ts';
import {
  generateDiagnosis,
  getDiagnosis,
  updateDiagnosis,
  getDiagnosisHistory,
  type Diagnosis,
  type DiagnosisContent,
} from '../api/diagnoses.ts';
import { ConsultancyCard } from '../components/consultancies/ConsultancyCard.tsx';
import { ConsultancyForm } from '../components/consultancies/ConsultancyForm.tsx';
import { DeleteConfirmDialog } from '../components/consultancies/DeleteConfirmDialog.tsx';
import { DiagnosisModal } from '../components/diagnosis/DiagnosisModal.tsx';
import { Button } from '../components/ui/Button.tsx';

type Modal =
  | { type: 'create' }
  | { type: 'edit'; consultancy: Consultancy }
  | { type: 'delete'; consultancy: Consultancy }
  | { type: 'diagnosis'; consultancyId: string; consultancyTitle: string }
  | null;

export function ConsultanciesPage() {
  const [consultancies, setConsultancies] = useState<Consultancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<Modal>(null);
  const [submitting, setSubmitting] = useState(false);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [diagnosisLoading, setDiagnosisLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      setError('');
      const res = await fetchConsultancies();
      setConsultancies(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load consultancies');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate(data: CreateConsultancyPayload | UpdateConsultancyPayload) {
    setSubmitting(true);
    try {
      await createConsultancy(data as CreateConsultancyPayload);
      setModal(null);
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(data: CreateConsultancyPayload | UpdateConsultancyPayload) {
    if (modal?.type !== 'edit') return;
    setSubmitting(true);
    try {
      await updateConsultancy(modal.consultancy.id, data as UpdateConsultancyPayload);
      setModal(null);
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (modal?.type !== 'delete') return;
    setSubmitting(true);
    try {
      await deleteConsultancy(modal.consultancy.id);
      setModal(null);
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOpenDiagnosis(consultancyId: string) {
    setDiagnosisLoading(true);
    try {
      const existing = await getDiagnosis(consultancyId);
      setDiagnosis(existing.data);
    } catch {
      setDiagnosis(null);
    } finally {
      setDiagnosisLoading(false);
    }

    const consultancy = consultancies.find(c => c.id === consultancyId);
    setModal({
      type: 'diagnosis',
      consultancyId,
      consultancyTitle: consultancy?.title || 'Consultancy',
    });
  }

  async function handleGenerateDiagnosis(consultancyId: string) {
    setDiagnosisLoading(true);
    try {
      const result = await generateDiagnosis(consultancyId);
      setDiagnosis(result.data);
    } catch (err) {
      console.error('Failed to generate diagnosis:', err);
      alert(err instanceof Error ? err.message : 'Failed to generate diagnosis');
    } finally {
      setDiagnosisLoading(false);
    }
  }

  async function handleSaveDiagnosis(content: DiagnosisContent) {
    if (!modal || modal.type !== 'diagnosis') return;
    setDiagnosisLoading(true);
    try {
      const result = await updateDiagnosis(modal.consultancyId, content);
      setDiagnosis(result.data);
    } catch (err) {
      console.error('Failed to save diagnosis:', err);
      throw err;
    } finally {
      setDiagnosisLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-[32px] sm:text-[40px] font-semibold tracking-tight text-[var(--text-primary)]">
          Consultancies
        </h1>
        <Button onClick={() => setModal({ type: 'create' })}>
          + New
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="mt-12 flex justify-center py-12">
          <p className="text-[15px] text-[var(--text-secondary)] animate-pulse">Loading consultancies...</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="mt-6 rounded-[var(--radius-card)] border border-[var(--color-error)]/20 bg-[var(--color-error)]/5 p-6">
          <p className="text-[15px] font-medium text-[var(--color-error)]">{error}</p>
          <button
            onClick={() => void load()}
            className="mt-3 text-[14px] font-medium text-[var(--color-error)] hover:opacity-70 transition-opacity"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && consultancies.length === 0 && (
        <div className="mt-8 rounded-[var(--radius-card)] border border-dashed border-[var(--border-strong)] bg-transparent px-6 py-20 text-center flex flex-col items-center justify-center">
          <p className="text-[20px] font-semibold text-[var(--text-primary)] tracking-tight">No consultancies yet</p>
          <p className="mt-2 text-[15px] text-[var(--text-secondary)] max-w-sm">
            Create your first consultancy to get started.
          </p>
          <Button
            variant="secondary"
            className="mt-6"
            onClick={() => setModal({ type: 'create' })}
          >
            Create Consultancy
          </Button>
        </div>
      )}

      {/* List */}
      {!loading && !error && consultancies.length > 0 && (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {consultancies.map((c) => (
            <ConsultancyCard
              key={c.id}
              consultancy={c}
              onEdit={(item) => setModal({ type: 'edit', consultancy: item })}
              onDelete={(item) => setModal({ type: 'delete', consultancy: item })}
              onDiagnosis={(item) => void handleOpenDiagnosis(item.id)}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      {modal?.type === 'create' && (
        <ConsultancyForm
          onSubmit={handleCreate}
          onCancel={() => setModal(null)}
          loading={submitting}
        />
      )}

      {/* Edit modal */}
      {modal?.type === 'edit' && (
        <ConsultancyForm
          initial={modal.consultancy}
          onSubmit={handleEdit}
          onCancel={() => setModal(null)}
          loading={submitting}
        />
      )}

      {/* Delete dialog */}
      {modal?.type === 'delete' && (
        <DeleteConfirmDialog
          consultancy={modal.consultancy}
          onConfirm={handleDelete}
          onCancel={() => setModal(null)}
          loading={submitting}
        />
      )}

      {/* Diagnosis modal */}
      {modal?.type === 'diagnosis' && !diagnosisLoading && (
        <>
          {diagnosis ? (
            <DiagnosisModal
              diagnosis={diagnosis}
              onClose={() => setModal(null)}
              onSave={handleSaveDiagnosis}
              onLoadHistory={() => getDiagnosisHistory(modal.consultancyId).then(r => r.data)}
              saving={diagnosisLoading}
            />
          ) : (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm"
                style={{ WebkitBackdropFilter: 'blur(8px)', backdropFilter: 'blur(8px)' }}
                onClick={() => setModal(null)}
              />
              <div className="relative w-full max-w-2xl rounded-[var(--radius-modal)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] p-8 shadow-[var(--shadow-elev)]">
                <h2 className="text-[24px] font-semibold tracking-tight text-[var(--text-primary)] mb-3">
                  Generate Diagnosis for {modal.consultancyTitle}
                </h2>
                <p className="text-[17px] leading-relaxed text-[var(--text-secondary)] mb-8">
                  No diagnosis has been generated yet. Generate one using the Iris strategic method to get insights about this consultancy.
                </p>
                <div className="flex justify-end gap-3 pt-6 border-t border-[var(--border-hairline)]">
                  <Button variant="ghost" onClick={() => setModal(null)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => void handleGenerateDiagnosis(modal.consultancyId)}
                    disabled={diagnosisLoading}
                  >
                    {diagnosisLoading ? 'Generating...' : 'Generate Diagnosis'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Diagnosis loading state */}
      {modal?.type === 'diagnosis' && diagnosisLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            style={{ WebkitBackdropFilter: 'blur(8px)', backdropFilter: 'blur(8px)' }}
          />
          <div className="relative rounded-[var(--radius-modal)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] p-8 shadow-[var(--shadow-elev)] flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--text-primary)] mb-4"></div>
            <p className="text-[17px] font-medium text-[var(--text-primary)]">Generating strategic diagnosis...</p>
            <p className="text-[14px] text-[var(--text-secondary)] mt-1">This may take a moment.</p>
          </div>
        </div>
      )}
    </div>
  );
}
