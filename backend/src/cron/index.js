const cron = require('node-cron');
const ChecklistTask = require('../modules/checklist/models/checklistTask.model');
const checklistTaskService = require('../modules/checklist/services/checklistTask.service');
const logger = require('../utils/logger');
const config = require('../config');

/**
 * Runs nightly at 02:00 AM (IST) to keep a rolling 60-day window of occurrences.
 */
const runChecklistMaterialisation = async () => {
  logger.info('[CRON] Starting nightly checklist materialisation job...');
  try {
    const tasks = await ChecklistTask.find({ active: true, deletedAt: null });
    let totalGenerated = 0;

    for (const task of tasks) {
      try {
        const res = await checklistTaskService.materialiseTask(task, 60);
        totalGenerated += res.created || 0;
      } catch (err) {
        logger.error(`[CRON] Error materialising task ${task.code}:`, { error: err.message });
      }
    }

    logger.info(`[CRON] Nightly checklist materialisation completed. ${totalGenerated} occurrences created across ${tasks.length} active tasks.`);
  } catch (err) {
    logger.error('[CRON] Checklist materialisation job failed:', { error: err.message });
  }
};

const startCron = () => {
  if (!config.cronEnabled) {
    logger.info('[CRON] Cron jobs are disabled by environment configuration.');
    return;
  }

  // 02:00 AM daily
  cron.schedule('0 2 * * *', () => {
    runChecklistMaterialisation();
  });

  logger.info('[CRON] Schedulers initialized (Nightly 02:00 AM checklist materialisation active).');
};

module.exports = { startCron, runChecklistMaterialisation };
