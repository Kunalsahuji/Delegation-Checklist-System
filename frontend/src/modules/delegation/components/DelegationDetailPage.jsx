import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  AlertTriangle,
  RotateCcw,
  Trash2,
  Paperclip,
  Send,
  FileText,
  History,
  MessageSquare,
  Activity,
  Plus,
  UserCheck,
  Edit,
  Download,
  ExternalLink,
  Ban,
  Check,
} from 'lucide-react';
import { delegationApi } from '../api/delegationApi';
import StatusBadge from '../../../components/StatusBadge';
import PriorityBadge from '../../../components/PriorityBadge';
import { formatCivilDate } from '../../../utils/civilDate';
import ChangeDateModal from './ChangeDateModal';
import DelegationReportDelayModal from './DelegationReportDelayModal';
import EditDelegationModal from './EditDelegationModal';
import ReassignTaskModal from './ReassignTaskModal';
import CancelTaskModal from './CancelTaskModal';

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

const getFileExtension = (name = '') => {
  const parts = name.split('.');
  if (parts.length > 1) {
    return parts.pop().toUpperCase().slice(0, 4);
  }
  return 'FILE';
};

const isImageFile = (name = '', url = '') => {
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name) || (typeof url === 'string' && url.startsWith('data:image/'));
};

export default function DelegationDetailPage({
  taskId,
  onBack,
  onChanged,
}) {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState('');
  const [commentText, setCommentText] = useState('');

  // Modals state
  const [showChangeDateModal, setShowChangeDateModal] = useState(false);
  const [showReportDelayModal, setShowReportDelayModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fileInputRef = useRef(null);

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

  // Actions
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
      onChanged?.();
    } catch (err) {
      alert(err.message || 'Failed to add comment');
    } finally {
      setBusy('');
    }
  };

  // Real File Upload
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;

    try {
      setBusy('attach');
      for (const file of files) {
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        await delegationApi.addAttachment(task._id, {
          name: file.name,
          size: file.size,
          url: dataUrl,
        });
      }
      await fetchTask();
      onChanged?.();
    } catch (err) {
      alert(err.message || 'Failed to attach file');
    } finally {
      setBusy('');
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!window.confirm('Are you sure you want to remove this attachment?')) return;
    try {
      setBusy(`delete-file-${attachmentId}`);
      await delegationApi.deleteAttachment(task._id, attachmentId);
      await fetchTask();
      onChanged?.();
    } catch (err) {
      alert(err.message || 'Failed to delete attachment');
    } finally {
      setBusy('');
    }
  };

  // Modal Handlers
  const handleReviseDateSubmit = async (id, data) => {
    await delegationApi.reviseDate(id, data);
    setShowChangeDateModal(false);
    await fetchTask();
    onChanged?.();
  };

  const handleReportDelaySubmit = async (id, data) => {
    await delegationApi.reportProgress(id, data);
    setShowReportDelayModal(false);
    await fetchTask();
    onChanged?.();
  };

  const handleEditSubmit = async (id, data) => {
    await delegationApi.updateTask(id, data);
    setShowEditModal(false);
    await fetchTask();
    onChanged?.();
  };

  const handleReassignSubmit = async (id, data) => {
    await delegationApi.reassign(id, data);
    setShowReassignModal(false);
    await fetchTask();
    onChanged?.();
  };

  const handleCancelSubmit = async (id, reason) => {
    await delegationApi.setStatus(id, { status: 'cancelled', cancelReason: reason });
    setShowCancelModal(false);
    await fetchTask();
    onChanged?.();
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
  const isOverdue = (task.status === 'pending' || task.status === 'weekShifted') && dueDateObj < today;
  const isCompleted = task.status === 'completed';
  const isCancelled = task.status === 'cancelled';
  const isOpen = task.status === 'pending' || task.status === 'weekShifted';
  const revisions = task.revisions || [];
  const comments = task.comments || [];
  const attachments = task.attachments || [];
  const reassignments = task.reassignments || [];
  const progressRemarks = task.progressRemarks || [];

  // Stage timeline matching Tangdi
  const steps = [
    {
      key: 'delegated',
      state: 'done',
      label: 'Delegated',
      sub: formatCivilDate(task.assignedAt || task.createdAt),
    },
    {
      key: 'due',
      state: isCompleted ? 'done' : isCancelled ? 'problem' : isOverdue ? 'problem' : 'active',
      label: 'Due',
      sub: formatCivilDate(task.dueDate),
    },
    isCancelled
      ? {
          key: 'cancelled',
          state: 'problem',
          label: 'Cancelled',
          sub: formatCivilDate(task.updatedAt),
        }
      : {
          key: 'completed',
          state: isCompleted ? 'done' : 'pending',
          label: 'Completed',
          sub: isCompleted ? formatCivilDate(task.completedAt || task.updatedAt) : '',
        },
  ];

  return (
    <div className="space-y-3.5 w-full max-w-7xl mx-auto pb-10">
      {/* Hidden File Picker Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Top Header & Actions Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
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

          {/* Action buttons matching Tangdi Screenshot 1 */}
          <div className="flex flex-col items-start lg:items-end gap-2 shrink-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {isOpen && (
                <>
                  <button
                    type="button"
                    onClick={handleComplete}
                    disabled={Boolean(busy)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors min-h-[34px]"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Complete</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowReportDelayModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg shadow-xs transition-colors min-h-[34px]"
                  >
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Report delay</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowChangeDateModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg shadow-xs transition-colors min-h-[34px]"
                  >
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Change date</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowReassignModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg shadow-xs transition-colors min-h-[34px]"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                    <span>Reassign task</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowEditModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg shadow-xs transition-colors min-h-[34px]"
                  >
                    <Edit className="w-3.5 h-3.5 text-slate-500" />
                    <span>Edit</span>
                  </button>
                </>
              )}

              {(isCompleted || isCancelled) && (
                <button
                  type="button"
                  onClick={handleReopen}
                  disabled={busy === 'reopen'}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition-colors min-h-[34px]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reopen</span>
                </button>
              )}
            </div>

            {/* Row 2: Cancel task & Delete links */}
            <div className="flex items-center gap-3 text-xs pt-0.5">
              {isOpen && (
                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  className="text-slate-600 hover:text-slate-900 font-medium hover:underline transition-colors"
                >
                  Cancel task
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-rose-600 hover:text-rose-700 font-medium hover:underline transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cancellation Banner */}
      {isCancelled && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 text-xs text-rose-800">
          <Ban className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">This task was cancelled</span>
            <span className="text-rose-700">Reason: {task.cancelReason || 'Cancelled by manager'}</span>
          </div>
        </div>
      )}

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

          {/* Progress Remarks (Delays) if any */}
          {progressRemarks.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                Progress & Delay Updates ({progressRemarks.length})
              </h3>
              <div className="space-y-2.5 divide-y divide-slate-100">
                {progressRemarks.map((pr, idx) => (
                  <div key={pr._id || idx} className="pt-2 first:pt-0 text-xs">
                    <div className="flex items-center justify-between text-[11px] mb-0.5">
                      <span className="font-semibold text-slate-800">
                        {pr.byName || 'Assignee'}
                      </span>
                      <span className="text-slate-400 font-mono text-[10px]">
                        {formatDateTime(pr.at)}
                      </span>
                    </div>
                    <p className="text-slate-700 italic">"{pr.note}"</p>
                    <div className="text-[10px] text-amber-700 font-medium mt-1">
                      Expected completion: {formatCivilDate(pr.expectedDate)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Date History Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-slate-400" />
                Date history
              </h3>
              <span className="text-[11px] text-slate-400">Never overwritten</span>
            </div>

            <ol className="relative space-y-4 border-l border-slate-200 pl-5 text-xs">
              <li className="relative">
                <span
                  aria-hidden="true"
                  className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full bg-blue-600 ring-4 ring-white"
                />
                <p className="font-semibold text-slate-900">
                  Original date {formatCivilDate(task.originalDueDate)}
                </p>
                <p className="text-[11px] text-slate-500">Never overwritten.</p>
              </li>

              {revisions.map((rev, idx) => (
                <li key={rev._id || idx} className="relative">
                  <span
                    aria-hidden="true"
                    className={`absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-white ${
                      rev.kind === 'weekShift' ? 'bg-amber-500' : 'bg-slate-400'
                    }`}
                  />
                  <p className="flex flex-wrap items-center gap-2 font-medium text-slate-900">
                    <span>
                      {formatCivilDate(rev.fromDate)} → {formatCivilDate(rev.toDate)}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                      {rev.kind === 'weekShift' ? 'Week shifted' : 'Revised'}
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-700 mt-0.5">"{rev.reason || '—'}"</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {rev.changedByName || 'Administrator'} · {formatDateTime(rev.changedAt)}
                  </p>
                </li>
              ))}

              {revisions.length === 0 && (
                <li className="text-[11px] text-slate-400 italic">
                  The date has never been moved.
                </li>
              )}
            </ol>
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
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none text-slate-800"
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
                onClick={() => fileInputRef.current?.click()}
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
                {attachments.map((file, idx) => {
                  const isImg = isImageFile(file.name, file.url);
                  const ext = getFileExtension(file.name);
                  const isBusyDeleting = busy === `delete-file-${file._id}`;

                  return (
                    <div
                      key={file._id || idx}
                      className="flex items-center justify-between p-2 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-slate-100/70 transition-colors text-xs group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {isImg && file.url && file.url !== '#' ? (
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block h-9 w-9 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-white"
                          >
                            <img src={file.url} alt={file.name} className="h-full w-full object-cover" />
                          </a>
                        ) : (
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-[9px] font-bold text-slate-600">
                            {ext}
                          </span>
                        )}

                        <div className="truncate min-w-0 flex-1">
                          <a
                            href={file.url && file.url !== '#' ? file.url : undefined}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-slate-800 hover:text-blue-600 truncate block transition-colors"
                            title={file.name}
                          >
                            {file.name}
                          </a>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                            <span>{Math.round((file.size || 1024) / 1024)} KB</span>
                            <span>•</span>
                            <span>{formatCivilDate(file.uploadedAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {file.url && file.url !== '#' && (
                          <a
                            href={file.url}
                            download={file.name}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                            title="Download file"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteAttachment(file._id)}
                          disabled={isBusyDeleting}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors opacity-70 group-hover:opacity-100"
                          title="Remove attachment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Activity Timeline Card matching Tangdi Screenshot 1 */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-slate-400" />
              Activity
            </h3>

            <div className="space-y-3 text-xs">
              {(() => {
                // If backend provides task.activities array, use it sorted newest first
                if (task.activities && task.activities.length > 0) {
                  const sorted = [...task.activities].sort(
                    (a, b) => new Date(b.at || b.createdAt).getTime() - new Date(a.at || a.createdAt).getTime()
                  );
                  return sorted.map((act, i) => {
                    const dotColor =
                      act.action === 'completed'
                        ? 'bg-emerald-500'
                        : act.action === 'reopened'
                        ? 'bg-blue-500'
                        : act.action === 'cancelled'
                        ? 'bg-rose-500'
                        : act.action === 'revised'
                        ? 'bg-amber-500'
                        : act.action === 'reassigned'
                        ? 'bg-purple-500'
                        : act.action === 'progress'
                        ? 'bg-amber-500'
                        : 'bg-blue-500';

                    return (
                      <div key={act._id || i} className="flex items-start gap-2.5">
                        <div className={`w-2 h-2 rounded-full ${dotColor} mt-1.5 shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800">{act.title}</p>
                          {act.detail && <p className="text-[11px] text-slate-600 mt-0.5">{act.detail}</p>}
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {act.byName || 'Administrator'} · {formatDateTime(act.at || act.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  });
                }

                // Fallback synthesis for existing tasks that don't have task.activities yet
                const events = [];
                if (task.completedAt) {
                  events.push({
                    title: 'Marked complete',
                    dot: 'bg-emerald-500',
                    sub: `by ${task.completedByName || 'Administrator'} · ${formatDateTime(task.completedAt)}`,
                    time: new Date(task.completedAt).getTime(),
                  });
                }
                if (task.status === 'cancelled') {
                  events.push({
                    title: 'Cancelled',
                    dot: 'bg-rose-500',
                    detail: task.cancelReason,
                    sub: formatDateTime(task.updatedAt),
                    time: new Date(task.updatedAt).getTime(),
                  });
                }
                (reassignments || []).forEach((ra) => {
                  events.push({
                    title: 'Reassigned',
                    dot: 'bg-purple-500',
                    detail: `From ${ra.fromUserName} to ${ra.toUserName}${ra.reason ? `: "${ra.reason}"` : ''}`,
                    sub: formatDateTime(ra.requestedAt),
                    time: new Date(ra.requestedAt).getTime(),
                  });
                });
                (revisions || []).forEach((r) => {
                  events.push({
                    title: 'Due date revised',
                    dot: 'bg-amber-500',
                    detail: `to ${formatCivilDate(r.toDate)}${r.reason ? ` ("${r.reason}")` : ''}`,
                    sub: `${r.changedByName || 'Administrator'} · ${formatDateTime(r.changedAt)}`,
                    time: new Date(r.changedAt).getTime(),
                  });
                });
                events.push({
                  title: 'Created',
                  dot: 'bg-blue-500',
                  detail: `Assigned to ${task.assignedToName} by ${task.assignedByName || 'Administrator'}`,
                  sub: formatDateTime(task.assignedAt || task.createdAt),
                  time: new Date(task.assignedAt || task.createdAt).getTime(),
                });

                events.sort((a, b) => b.time - a.time);

                return events.map((ev, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className={`w-2 h-2 rounded-full ${ev.dot} mt-1.5 shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800">{ev.title}</p>
                      {ev.detail && <p className="text-[11px] text-slate-600 mt-0.5">{ev.detail}</p>}
                      {ev.sub && <p className="text-[10px] text-slate-400 mt-0.5">{ev.sub}</p>}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Change Date Modal */}
      <ChangeDateModal
        task={task}
        isOpen={showChangeDateModal}
        onClose={() => setShowChangeDateModal(false)}
        onSubmit={handleReviseDateSubmit}
      />

      {/* Report Delay Modal */}
      <DelegationReportDelayModal
        task={task}
        isOpen={showReportDelayModal}
        onClose={() => setShowReportDelayModal(false)}
        onSubmit={handleReportDelaySubmit}
      />

      {/* Edit Delegation Modal */}
      <EditDelegationModal
        task={task}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSaved={handleEditSubmit}
      />

      {/* Reassign Task Modal */}
      <ReassignTaskModal
        task={task}
        isOpen={showReassignModal}
        onClose={() => setShowReassignModal(false)}
        onReassigned={handleReassignSubmit}
      />

      {/* Cancel Task Modal */}
      <CancelTaskModal
        task={task}
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onCancel={handleCancelSubmit}
      />

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
