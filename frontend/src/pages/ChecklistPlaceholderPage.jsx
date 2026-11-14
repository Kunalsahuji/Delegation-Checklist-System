import { CheckSquare } from 'lucide-react';

export const ChecklistPlaceholderPage = ({ title = 'Checklists' }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-subtle max-w-2xl mx-auto my-8">
      <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4">
        <CheckSquare className="w-6 h-6" />
      </div>
      <h2 className="text-xl font-bold text-slate-900">{title} Workspace</h2>
      <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
        Phase 1 Foundation is active. This view will be fully built in <strong>Phase 2 (Checklist Engine)</strong> with recurrence computation, occurrence ticking, and weekly performance reporting.
      </p>
    </div>
  );
};
