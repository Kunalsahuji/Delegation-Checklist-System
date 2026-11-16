const mongoose = require('mongoose');
const logger = require('./logger');

/**
 * Clean up any checklist occurrences whose parent task has been deleted or does not exist.
 */
const cleanupOrphanedOccurrences = async () => {
  try {
    const db = mongoose.connection.db;
    if (!db) return;

    const ChecklistTask = mongoose.model('ChecklistTask');
    const ChecklistOccurrence = mongoose.model('ChecklistOccurrence');

    // Find all deleted task IDs
    const deletedTasks = await ChecklistTask.find({ deletedAt: { $ne: null } }).select('_id').lean();
    const deletedTaskIds = deletedTasks.map((t) => t._id);

    if (deletedTaskIds.length > 0) {
      const res = await ChecklistOccurrence.deleteMany({ task: { $in: deletedTaskIds } });
      if (res.deletedCount > 0) {
        logger.info(`Cleaned up ${res.deletedCount} orphaned occurrences of deleted checklist tasks.`);
      }
    }
  } catch (err) {
    logger.warn('Failed to cleanup orphaned checklist occurrences', { error: err.message });
  }
};

module.exports = { cleanupOrphanedOccurrences };
