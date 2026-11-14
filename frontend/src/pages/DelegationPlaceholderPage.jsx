import { ListTodo } from 'lucide-react';

export const DelegationPlaceholderPage = ({ title = 'Delegation' }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-subtle max-w-2xl mx-auto my-8">
      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
        <ListTodo className="w-6 h-6" />
      </div>
      <h2 className="text-xl font-bold text-slate-900">{title} Workspace</h2>
      <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
        Phase 1 Foundation is active. This view will be fully built in <strong>Phase 3 (Delegation Engine)</strong> with immutable original due dates, date revisions logging, and Red/Yellow/Green weekly performance reporting.
      </p>
    </div>
  );
};
