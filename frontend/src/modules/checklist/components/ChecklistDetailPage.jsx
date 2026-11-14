import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Building2,
  FolderKanban,
  Repeat,
  CheckCircle2,
  AlertCircle,
  Pause,
  Play,
  Edit2,
  Trash2,
  Paperclip,
  Send,
  FileText,
  Activity,
  MessageSquare,
  Plus,
} from 'lucide-react';
import { checklistApi } from '../api/checklistApi';
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

const formatFrequency = (freq) => {
  switch (freq) {
    case 'daily':
      return 'Every day';
    case 'weekly':
      return 'Every week';
    case 'monthly':
      return 'Every month';
    case 'quarterly':
      return 'Every quarter';
    case 'yearly':
      return 'Every year';
    default:
      return freq ? `Every ${freq}` : 'Every day';
  }
};

export default function ChecklistDetailPage({
  taskId,
  onBack,
  onEdit,
  onChanged,
}) {
  const [task, setTask] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [recent, setRecent] = useState([]);
  const [doneCount, setDoneCount] = useState(0);
  const [dueTotal, setDueTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState('');
  const [commentText, setCommentText] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const todayStr = new Date().toISOString().slice(0, 10);

      // Fetch task definition, upcoming occurrences, and recent occurrences in parallel
      const [taskRes, upcomingRes, recentRes, doneRes] = await Promise.all([
        checklistApi.getTask(taskId),
        checklistApi.listOccurrences({ taskId, status: 'pending', limit: 5, sortBy: 'planned_asc' }),
        checklistApi.listOccurrences({ taskId, to: todayStr, limit: 8, sortBy: 'planned_desc' }),
        checklistApi.listOccurrences({ taskId, to: todayStr, status: 'done', limit: 1 }),
      ]);

      const tData = taskRes?.data || taskRes;
      setTask(tData);

      const upItems = upcomingRes?.items || upcomingRes?.data || [];
      setUpcoming(upItems);

      const recItems = recentRes?.items || recentRes?.data || [];
      setRecent(recItems);

      const totalDue = recentRes?.pagination?.total ?? recItems.length;
      const totalDone = doneRes?.pagination?.total ?? (recItems.filter(r => r.status === 'done').length);
      setDueTotal(totalDue);
      setDoneCount(totalDone);
    } catch (err) {
      setError(err.message || 'Failed to load checklist detail');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    if (taskId) {
      fetchDetail();
    }
  }, [taskId, fetchDetail]);

  const handleToggleActive = async () => {
    try {
      setBusy('toggle');
      await checklistApi.toggleTaskActive(task._id);
      await fetchDetail();
      onChanged?.();
    } catch (err) {
      alert(err.message || 'Failed to toggle checklist status');
    } finally {
      setBusy('');
    }
  };

  const handleDelete = async () => {
    try {
      setBusy('delete');
      await checklistApi.deleteTask(task._id);
      setShowDeleteConfirm(false);
      onChanged?.();
      onBack();
    } catch (err) {
      alert(err.message || 'Failed to delete checklist');
    } finally {
      setBusy('');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      setBusy('comment');
      await checklistApi.addComment(task._id, { text: commentText.trim() });
      setCommentText('');
      await fetchDetail();
    } catch (err) {
      alert(err.message || 'Failed to add comment');
    } finally {
      setBusy('');
    }
  };

  const handleAddAttachment = async () => {
    const fileName = window.prompt('Enter attachment name or document title:', 'Inspection_Log.pdf');
    if (!fileName) return;
    try {
      setBusy('attach');
      await checklistApi.addAttachment(task._id, {
        name: fileName,
        size: Math.floor(Math.random() * 800 + 120) * 1024,
        url: '#',
      });
      await fetchDetail();
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
        <p className="text-xs text-slate-500 font-medium">Loading checklist details...</p>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="bg-white rounded-xl border border-rose-200 p-8 text-center shadow-xs">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <p className="text-sm font-semibold text-rose-800">Failed to load checklist</p>
        <p className="text-xs text-slate-500 mt-1 mb-4">{error || 'Checklist not found'}</p>
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

  const comments = task.comments || [];
  const attachments = task.attachments || [];
  const percent = dueTotal > 0 ? Math.round((doneCount / dueTotal) * 100) : 100;
  const pendingCount = upcoming.length;

  return (
    <div className="space-y-3.5 w-full max-w-7xl mx-auto pb-10">
      {/* Top Header & Actions Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="min-w-0 flex-1">
            {/* Badges strip */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="font-mono text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                {task.code || 'CHK-200003'}
              </span>
              {task.active ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  Paused
                </span>
              )}
              <span className="text-[12px] font-medium text-slate-600">
                {formatFrequency(task.frequency)}
              </span>
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
            <button
              type="button"
              onClick={() => onEdit?.(task)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>

            <button
              type="button"
              onClick={handleToggleActive}
              disabled={busy === 'toggle'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              {task.active ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Resume</span>
                </>
              )}
            </button>

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

      {/* Details Card: Information Grid matching Tangdi Image 4 */}
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
              <Repeat className="w-3 h-3 text-slate-400" />
              REPEATS
            </dt>
            <dd className="mt-1 font-semibold text-slate-800">
              {formatFrequency(task.frequency)}
            </dd>
          </div>

          <div>
            <dt className="text-[11px] font-medium text-slate-500 uppercase flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              FIRST DATE
            </dt>
            <dd className="mt-1 font-medium text-slate-700">
              {formatCivilDate(task.anchorDate || task.startOn)}
            </dd>
          </div>

          <div>
            <dt className="text-[11px] font-medium text-slate-500 uppercase flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              DUE BY
            </dt>
            <dd className="mt-1 font-medium text-slate-700">
              {task.dueTime || '18:00'}
            </dd>
          </div>

          <div>
            <dt className="text-[11px] font-medium text-slate-500 uppercase flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              ENDS ON
            </dt>
            <dd className="mt-1 font-medium text-slate-700">
              {task.endOn ? formatCivilDate(task.endOn) : 'Never'}
            </dd>
          </div>

          <div>
            <dt className="text-[11px] font-medium text-slate-500 uppercase flex items-center gap-1">
              <Repeat className="w-3 h-3 text-slate-400" />
              SKIP SUNDAYS
            </dt>
            <dd className="mt-1 font-medium text-slate-700">
              {task.skipSundays ? 'Yes' : 'No'}
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
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Progress
            </h3>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700">
                {doneCount} of {dueTotal || 1} items done so far
              </span>
              <span className="font-bold text-emerald-600">{percent}%</span>
            </div>
            {/* Green progress bar */}
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              {pendingCount} item(s) still pending
            </p>
          </div>

          {/* Coming up Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              Coming up
            </h3>
            {upcoming.length === 0 ? (
              <p className="text-xs text-slate-500">Nothing is due.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {upcoming.map((item) => (
                  <li key={item._id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-medium text-slate-800">
                        {formatCivilDate(item.plannedOn)}
                        <span className="text-[11px] text-slate-400 ml-1.5">
                          by {task.dueTime || '18:00'}
                        </span>
                      </p>
                      {item.remarks && (
                        <p className="text-[11px] italic text-slate-400 mt-0.5">{item.remarks}</p>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Pending
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Recent Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              Recent
            </h3>
            {recent.length === 0 ? (
              <p className="text-xs text-slate-500">No history yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recent.map((it) => (
                  <li key={it._id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-medium text-slate-800">
                        {formatCivilDate(it.plannedOn)}
                        <span className="text-[11px] text-slate-400 ml-1.5">
                          by {task.dueTime || '18:00'}
                        </span>
                      </p>
                      {it.completedAt && (
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Closed {formatDateTime(it.completedAt)}
                        </p>
                      )}
                      {it.remarks && (
                        <p className="text-[11px] italic text-slate-500 mt-0.5">"{it.remarks}"</p>
                      )}
                    </div>
                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded ${
                      it.status === 'done'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : it.status === 'skipped'
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        it.status === 'done' ? 'bg-emerald-500' : it.status === 'skipped' ? 'bg-slate-400' : 'bg-rose-500'
                      }`} />
                      {it.status === 'done' ? 'Done' : it.status === 'skipped' ? 'Skipped' : 'Overdue'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
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
              {doneCount > 0 && (
                <div className="flex items-start gap-2.5 text-xs">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800">Occurrence marked done</p>
                    <p className="text-[10px] text-slate-400">
                      Compliance record updated
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2.5 text-xs">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800">Created</p>
                  <p className="text-[10px] text-slate-400">
                    Assigned to {task.assignedToName} · {formatDateTime(task.createdAt)}
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
            <h4 className="text-sm font-bold text-slate-900 mb-1.5">Delete this checklist?</h4>
            <p className="text-xs text-slate-500 mb-4">
              Upcoming scheduled items will be removed. Past compliance history will be preserved.
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
