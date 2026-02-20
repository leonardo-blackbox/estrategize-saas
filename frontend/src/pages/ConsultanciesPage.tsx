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
      // Try to fetch existing diagnosis
      const existing = await getDiagnosis(consultancyId);
      setDiagnosis(existing.data);
    } catch (err) {
      // No diagnosis exists yet, we'll generate one
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Consultancies</h1>
        <button
          onClick={() => setModal({ type: 'create' })}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
        >
          + New Consultancy
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="mt-12 text-center">
          <p className="text-slate-400">Loading consultancies...</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={() => void load()}
            className="mt-2 text-sm font-medium text-red-300 underline hover:text-red-200"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && consultancies.length === 0 && (
        <div className="mt-12 rounded-xl border border-dashed border-slate-700 px-6 py-16 text-center">
          <p className="text-lg font-medium text-slate-300">No consultancies yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Create your first consultancy to get started.
          </p>
          <button
            onClick={() => setModal({ type: 'create' })}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
          >
            + New Consultancy
          </button>
        </div>
      )}

      {/* List */}
      {!loading && !error && consultancies.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              <div className="fixed inset-0 bg-black/60" onClick={() => setModal(null)} />
              <div className="relative w-full max-w-2xl rounded-xl border border-slate-700 bg-slate-800 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Generate Diagnosis for {modal.consultancyTitle}
                </h2>
                <p className="text-slate-300 mb-6">
                  No diagnosis has been generated yet. Generate one using the Iris strategic method to get insights about this consultancy.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setModal(null)}
                    className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => void handleGenerateDiagnosis(modal.consultancyId)}
                    disabled={diagnosisLoading}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
                  >
                    {diagnosisLoading ? 'Generating...' : 'Generate Diagnosis'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Diagnosis loading state */}
      {modal?.type === 'diagnosis' && diagnosisLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60" />
          <div className="relative rounded-xl border border-slate-700 bg-slate-800 p-6">
            <p className="text-slate-300">Generating strategic diagnosis...</p>
            <p className="text-xs text-slate-500 mt-2">This may take a moment.</p>
          </div>
        </div>
      )}
    </div>
  );
}
