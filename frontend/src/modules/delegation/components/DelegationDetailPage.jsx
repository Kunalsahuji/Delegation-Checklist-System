import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Users,
  Building2,
  FolderKanban,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Trash2,
  Paperclip,
  Send,
  FileText,
  History,
  MessageSquare,
  Activity,
  Plus,
} from 'lucide-react';
import { delegationApi } from '../api/delegationApi';
import StatusBadge from '../../../components/StatusBadge';
import PriorityBadge from '../../../components/PriorityBadge';
import { formatCivilDate } from '../../../utils/civilDate';

const formatDateTime = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

export default function DelegationDetailPage({
  taskId,
  onBack,
  onReviseDate,
  onReportDelay,
  onChanged,
}) {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState('');
  const [commentText, setCommentText] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchTask = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await delegationApi.getTask(taskId);
      const data = res?.data || res;
      setTask(data);
    } catch (err) {
      setError(err.message || 'Failed to load delegation task');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    if (taskId) {
      fetchTask();
    }
  }, [taskId, fetchTask]);

  const handleComplete = async () => {
    try {
      setBusy('complete');
      await delegationApi.setStatus(task._id, { status: 'completed' });
      await fetchTask();
      onChanged?.();
    } catch (err) {
      alert(err.message || 'Failed to complete task');
    } finally {
      setBusy('');
    }
  };

  const handleReopen = async () => {
    try {
      setBusy('reopen');
      await delegationApi.setStatus(task._id, { status: 'pending' });
      await fetchTask();
      onChanged?.();
    } catch (err) {
      alert(err.message || 'Failed to reopen task');
    } finally {
      setBusy('');
    }
  };

  const handleDelete = async () => {
    try {
      setBusy('delete');
      await delegationApi.deleteTask(task._id);
      setShowDeleteConfirm(false);
      onChanged?.();
      onBack();
    } catch (err) {
      alert(err.message || 'Failed to delete task');
    } finally {
      setBusy('');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      setBusy('comment');
      await delegationApi.addComment(task._id, { text: commentText.trim() });
      setCommentText('');
      await fetchTask();
    } catch (err) {
      alert(err.message || 'Failed to add comment');
    } finally {
      setBusy('');
    }
  };

  const handleAddAttachment = async () => {
    const fileName = window.prompt('Enter attachment name or document title:', 'Inspection_Report.pdf');
    if (!fileName) return;
    try {
      setBusy('attach');
      await delegationApi.addAttachment(task._id, {
        name: fileName,
        size: Math.floor(Math.random() * 800 + 120) * 1024,
        url: '#',
      });
      await fetchTask();
    } catch (err) {
      alert(err.message || 'Failed to attach file');
    } finally {
      setBusy('');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-medium">Loading delegation details...</p>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="bg-white rounded-xl border border-rose-200 p-8 text-center shadow-xs">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <p className="text-sm font-semibold text-rose-800">Failed to load task</p>
        <p className="text-xs text-slate-500 mt-1 mb-4">{error || 'Task not found'}</p>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to list</span>
        </button>
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDateObj = new Date(task.dueDate);
  const isOverdue = task.status === 'pending' && dueDateObj < today;
  const isCompleted = task.status === 'completed';
  const revisions = task.revisions || [];
  const comments = task.comments || [];
  const attachments = task.attachments || [];

  // Stage timeline calculation
  const steps = [
    {
      key: 'delegated',
      state: 'done',
      label: 'Delegated',
      sub: formatCivilDate(task.assignedAt || task.createdAt),
    },
    {
      key: 'due',
      state: isCompleted ? 'done' : isOverdue ? 'problem' : 'active',
      label: 'Due',
      sub: formatCivilDate(task.dueDate),
    },
    {
      key: 'completed',
      state: isCompleted ? 'done' : 'pending',
      label: 'Completed',
      sub: isCompleted ? formatCivilDate(task.completedAt || task.updatedAt) : '',
    },
  ];

  return (
    <div className="space-y-3.5 w-full max-w-7xl mx-auto pb-10">
      {/* Top Header & Actions Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="min-w-0 flex-1">
            {/* Badges strip */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="font-mono text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                {task.code}
              </span>
              <StatusBadge status={task.status} isOverdue={isOverdue} />
              <PriorityBadge priority={task.priority} />
              {task.revisionCount > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                  Revised {task.revisionCount}x
                </span>
              )}
            </div>

            {/* Back link & Title */}
            <div className="flex items-start gap-2.5">
              <button
                type="button"
                onClick={onBack}
                className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors mt-0.5"
                title="Back to list"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug break-words">
                {task.title}
              </h1>
            </div>

            {task.description && (
              <p className="mt-2 text-xs text-slate-600 leading-relaxed whitespace-pre-line pl-6.5">
                {task.description}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 self-start md:self-auto">
            {isCompleted ? (
              <button
                type="button"
                onClick={handleReopen}
                disabled={busy === 'reopen'}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reopen</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={busy === 'complete'}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Complete</span>
                </button>
                <button
                  type="button"
                  onClick={() => onReviseDate?.(task)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition-colors"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Change date</span>
                </button>
                <button
                  type="button"
                  onClick={() => onReportDelay?.(task)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition-colors"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Report delay</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>

      {/* Details Card: Information Grid */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3.5">
          Details
        </h3>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-y-3.5 gap-x-6 text-xs">
          <div>
            <dt className="text-[11px] font-medium text-slate-500 uppercase flex items-center gap-1">
              <User className="w-3 h-3 text-slate-400" />
              PERSON
            </dt>
            <dd className="mt-1 font-semibold text-slate-800">
              {task.assignedToName || 'Unassigned'}
            </dd>
          </div>

          <div>
            <dt className="text-[11px] font-medium text-slate-500 uppercase flex items-center gap-1">
              <Users className="w-3 h-3 text-slate-400" />
              DELEGATED BY
            </dt>
            <dd className="mt-1 font-semibold text-slate-800">
              {task.assignedByName || task.assignedBy?.name || 'Administrator'}
            </dd>
          </div>

          <div>
            <dt className="text-[11px] font-medium text-slate-500 uppercase flex items-center gap-1">
              <Building2 className="w-3 h-3 text-slate-400" />
              DEPARTMENT
            </dt>
            <dd className="mt-1 font-semibold text-slate-800">
              {task.departmentName || task.department?.name || '—'}
            </dd>
          </div>

          <div>
            <dt className="text-[11px] font-medium text-slate-500 uppercase flex items-center gap-1">
              <FolderKanban className="w-3 h-3 text-slate-400" />
              PROJECT
            </dt>
            <dd className="mt-1 font-semibold text-slate-800">
              {task.project?.name || 'Company-wide'}
            </dd>
          </div>

          <div>
            <dt className="text-[11px] font-medium text-slate-500 uppercase flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              DELEGATED ON
            </dt>
            <dd className="mt-1 font-medium text-slate-700">
              {formatDateTime(task.assignedAt || task.createdAt)}
            </dd>
          </div>

          <div>
            <dt className="text-[11px] font-medium text-slate-500 uppercase flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              ORIGINAL DUE DATE
            </dt>
            <dd className="mt-1 font-medium text-slate-700">
              {formatCivilDate(task.originalDueDate)}
            </dd>
          </div>

          <div>
            <dt className="text-[11px] font-medium text-slate-500 uppercase flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              CURRENT DUE DATE
            </dt>
            <dd className={`mt-1 font-semibold ${isOverdue ? 'text-rose-600' : 'text-slate-800'}`}>
              {formatCivilDate(task.dueDate)}
            </dd>
          </div>

          <div>
            <dt className="text-[11px] font-medium text-slate-500 uppercase flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-slate-400" />
              COMPLETED ON
            </dt>
            <dd className="mt-1 font-medium text-slate-700">
              {task.completedAt ? formatDateTime(task.completedAt) : '—'}
            </dd>
          </div>
        </dl>
      </div>

      {/* Main & Side 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3.5 items-start">
        {/* Left Column (3 of 5) */}
        <div className="space-y-3.5 lg:col-span-3">
          {/* Progress Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
              Progress
            </h3>
            {/* Horizontal Timeline Track matching Tangdi StageTrack */}
            <ol className="flex items-start">
              {steps.map((s, i) => (
                <li key={s.key} className="relative flex min-w-0 flex-1 flex-col items-center text-center">
                  {i > 0 && (
                    <span
                      aria-hidden="true"
                      className={`absolute right-1/2 top-[7px] h-0.5 w-full ${
                        steps[i - 1].state === 'done' ? 'bg-emerald-500' : 'bg-slate-200'
                      }`}
                    />
                  )}
                  <span
                    className={`relative z-10 h-3.5 w-3.5 rounded-full ring-4 ring-white ${
                      s.state === 'done'
                        ? 'bg-emerald-500'
                        : s.state === 'problem'
                        ? 'bg-rose-500'
                        : s.state === 'active'
                        ? 'bg-blue-600'
                        : 'bg-slate-300'
                    }`}
                  />
                  <span className="mt-1.5 text-xs font-semibold text-slate-800">
                    {s.label}
                  </span>
                  {s.sub && <span className="text-[10px] text-slate-500 mt-0.5">{s.sub}</span>}
                </li>
              ))}
            </ol>
          </div>

          {/* Date History Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-slate-400" />
                Date history
              </h3>
              <span className="text-[11px] text-slate-400">Never overwritten</span>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5 text-xs pb-2 border-b border-slate-100">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-800">
                    Original date {formatCivilDate(task.originalDueDate)}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {revisions.length === 0
                      ? 'The date has never been moved.'
                      : 'Initial target baseline recorded at assignment.'}
                  </div>
                </div>
              </div>

              {revisions.map((rev, idx) => (
                <div key={rev._id || idx} className="flex items-start gap-2.5 text-xs pb-2 border-b border-slate-100 last:border-0">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-800">
                        Revision #{idx + 1}: Moved to {formatCivilDate(rev.toDate)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatDateTime(rev.changedAt)}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 italic mt-0.5">
                      "{rev.reason}"
                    </div>
                    {rev.changedByName && (
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        by {rev.changedByName}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comments Section */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
              Comments
            </h3>

            <form onSubmit={handleAddComment} className="mb-4">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                rows={2}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none text-slate-800"
              />
              <div className="flex justify-end mt-1.5">
                <button
                  type="submit"
                  disabled={!commentText.trim() || busy === 'comment'}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                >
                  <Send className="w-3 h-3" />
                  <span>Comment</span>
                </button>
              </div>
            </form>

            {comments.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-3">No comments yet.</p>
            ) : (
              <div className="space-y-2.5 divide-y divide-slate-100">
                {comments.map((c, i) => (
                  <div key={i} className="pt-2.5 first:pt-0">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-semibold text-slate-800">{c.author}</span>
                      <span className="text-slate-400 font-mono text-[10px]">{formatDateTime(c.at)}</span>
                    </div>
                    <p className="text-xs text-slate-700 whitespace-pre-line">{c.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (2 of 5): Files & Activity */}
        <div className="space-y-3.5 lg:col-span-2">
          {/* Files Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                Files ({attachments.length})
              </h3>
              <button
                type="button"
                onClick={handleAddAttachment}
                disabled={busy === 'attach'}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Add file</span>
              </button>
            </div>

            {attachments.length === 0 ? (
              <div className="text-center py-6 text-slate-400">
                <FileText className="w-7 h-7 mx-auto mb-1 text-slate-300 stroke-[1.5]" />
                <p className="text-xs">No attachments yet.</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Uploaded files open / download in a new tab.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {attachments.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                      <div className="truncate">
                        <p className="font-medium text-slate-800 truncate">{file.name}</p>
                        <p className="text-[10px] text-slate-400">{Math.round((file.size || 1024) / 1024)} KB</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                      {formatCivilDate(file.uploadedAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity Timeline Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-slate-400" />
              Activity
            </h3>

            <div className="space-y-3">
              {isCompleted && (
                <div className="flex items-start gap-2.5 text-xs">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800">Marked complete</p>
                    <p className="text-[10px] text-slate-400">
                      by {task.completedByName || 'Administrator'} · {formatDateTime(task.completedAt)}
                    </p>
                  </div>
                </div>
              )}

              {revisions.map((r, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800">Due date revised</p>
                    <p className="text-[10px] text-slate-400">
                      to {formatCivilDate(r.toDate)} · {formatDateTime(r.changedAt)}
                    </p>
                  </div>
                </div>
              ))}

              <div className="flex items-start gap-2.5 text-xs">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800">Created</p>
                  <p className="text-[10px] text-slate-400">
                    Assigned to {task.assignedToName} by {task.assignedByName || 'Administrator'} · {formatDateTime(task.assignedAt || task.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-xl border border-slate-200">
            <h4 className="text-sm font-bold text-slate-900 mb-1.5">Delete this delegation?</h4>
            <p className="text-xs text-slate-500 mb-4">
              It will be removed from all lists and scorecards. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={busy === 'delete'}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
