import type { Consultancy } from '../../api/consultancies.ts';

interface ConsultancyCardProps {
  consultancy: Consultancy;
  onEdit: (c: Consultancy) => void;
  onDelete: (c: Consultancy) => void;
  onDiagnosis?: (c: Consultancy) => void;
}

const statusStyles: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400',
  archived: 'bg-slate-500/20 text-slate-400',
};

export function ConsultancyCard({ consultancy, onEdit, onDelete, onDiagnosis }: ConsultancyCardProps) {
  const created = new Date(consultancy.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold text-white">
            {consultancy.title}
          </h3>
          {consultancy.client_name && (
            <p className="mt-1 text-sm text-slate-400">{consultancy.client_name}</p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[consultancy.status]}`}
        >
          {consultancy.status === 'active' ? 'Active' : 'Archived'}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-slate-500">Created {created}</span>
        <div className="flex gap-2">
          {onDiagnosis && (
            <button
              onClick={() => onDiagnosis(consultancy)}
              className="rounded-md px-3 py-1.5 text-sm text-amber-400 hover:bg-amber-500/10 transition-colors"
            >
              Diagnose
            </button>
          )}
          <button
            onClick={() => onEdit(consultancy)}
            className="rounded-md px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(consultancy)}
            className="rounded-md px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
