// ===========================================================================
// scheduler.js - Cron scheduling utility
// Manages recurring scrape/trend/PLR check jobs using node-cron.
// ===========================================================================

const cron = require('node-cron');
const { getCollection, updateCollection } = require('../db');

// In-memory map of active cron jobs: id -> { job, meta }
const activeJobs = new Map();

// Create and register a new scheduled job.
// @param {string} id - Unique schedule ID
// @param {string} name - Human-readable schedule name
// @param {string} cronExpression - Cron expression (e.g., "0 0 * * *")
// @param {Function} taskFn - Async function to execute on each tick
// @param {Object} options - { type, config, ... } extra metadata
// @returns {Object} The schedule record
function createSchedule(id, name, cronExpression, taskFn, options = {}) {
  // Validate cron expression
  if (!cron.validate(cronExpression)) {
    throw new Error(`Invalid cron expression: ${cronExpression}`);
  }

  // Stop existing job with same ID if any
  if (activeJobs.has(id)) {
    activeJobs.get(id).job.stop();
    activeJobs.delete(id);
  }

  // Create the cron job
  const job = cron.schedule(cronExpression, async () => {
    const meta = activeJobs.get(id);
    if (!meta) return;

    meta.lastRun = new Date().toISOString();
    meta.runCount = (meta.runCount || 0) + 1;
    console.log(`[scheduler] Running job "${name}" (${id})`);

    try {
      await taskFn();
      meta.lastStatus = 'success';
    } catch (err) {
      meta.lastStatus = 'error';
      meta.lastError = err.message;
      console.error(`[scheduler] Job "${name}" failed:`, err.message);
    }

    // Persist updated schedule info to DB
    _persistScheduleMeta(id, meta);
  }, {
    scheduled: true,
    timezone: 'America/New_York',
  });

  const meta = {
    id,
    name,
    cronExpression,
    status: 'active',
    type: options.type || 'custom',
    config: options.config || {},
    createdAt: new Date().toISOString(),
    lastRun: null,
    lastStatus: null,
    lastError: null,
    runCount: 0,
  };

  activeJobs.set(id, { job, meta, taskFn });

  // Persist to DB
  _persistScheduleMeta(id, meta);

  return meta;
}

/**
 * Remove a schedule by ID (stops job and deletes from DB).
 */
function removeSchedule(id) {
  if (activeJobs.has(id)) {
    activeJobs.get(id).job.stop();
    activeJobs.delete(id);
  }

  // Remove from DB
  const schedules = getCollection('schedules');
  const filtered = schedules.filter((s) => s.id !== id);
  updateCollection('schedules', filtered);

  return true;
}

/**
 * Pause a running schedule (stops cron but keeps in memory).
 */
function pauseSchedule(id) {
  const entry = activeJobs.get(id);
  if (!entry) return false;

  entry.job.stop();
  entry.meta.status = 'paused';
  _persistScheduleMeta(id, entry.meta);
  return true;
}

/**
 * Resume a paused schedule.
 */
function resumeSchedule(id) {
  const entry = activeJobs.get(id);
  if (!entry) return false;

  entry.job.start();
  entry.meta.status = 'active';
  _persistScheduleMeta(id, entry.meta);
  return true;
}

/**
 * Get all schedules with their current status and cost estimates.
 */
function getSchedules() {
  const result = [];

  // Get from DB (includes any that aren't currently active in memory)
  const dbSchedules = getCollection('schedules');

  for (const sched of dbSchedules) {
    const memEntry = activeJobs.get(sched.id);
    result.push({
      ...sched,
      status: memEntry ? memEntry.meta.status : 'stopped',
      costEstimate: estimateCost(sched),
    });
  }

  return result;
}

/**
 * Estimate the operational cost of a schedule.
 * Based on cron frequency, number of queries, and pages per query.
 */
function estimateCost(schedule) {
  const { cronExpression, config = {}, type } = schedule;

  // Estimate runs per day based on cron expression
  const runsPerDay = _estimateRunsPerDay(cronExpression);

  // Estimate requests per run based on type and config
  let requestsPerRun = 1;
  const queries = config.queries ? config.queries.length : 1;
  const pages = config.pages || 1;

  switch (type) {
    case 'etsy':
      // Each query * pages = requests, plus overhead
      requestsPerRun = queries * pages;
      break;
    case 'trends':
      // Each keyword = 1 API call + related queries call
      requestsPerRun = queries * 2;
      break;
    case 'plr':
      requestsPerRun = queries;
      break;
    default:
      requestsPerRun = queries * pages;
  }

  const totalDailyRequests = runsPerDay * requestsPerRun;
  // Rough cost estimate: ~$0.001 per proxy request (bandwidth + proxy cost)
  const dailyCost = (totalDailyRequests * 0.001).toFixed(3);

  return {
    runsPerDay,
    requestsPerRun,
    estimatedProxiesUsed: totalDailyRequests,
    costEstimate: `~$${dailyCost}/day based on ${totalDailyRequests} requests`,
  };
}

/**
 * Run a scheduled job immediately (outside its cron schedule).
 */
async function runNow(id) {
  const entry = activeJobs.get(id);
  if (!entry) {
    throw new Error(`Schedule ${id} not found or not loaded in memory`);
  }

  console.log(`[scheduler] Manually triggering job "${entry.meta.name}" (${id})`);
  entry.meta.lastRun = new Date().toISOString();
  entry.meta.runCount = (entry.meta.runCount || 0) + 1;

  try {
    await entry.taskFn();
    entry.meta.lastStatus = 'success';
  } catch (err) {
    entry.meta.lastStatus = 'error';
    entry.meta.lastError = err.message;
    throw err;
  } finally {
    _persistScheduleMeta(id, entry.meta);
  }
}

// ---- Internal helpers ----

/**
 * Persist schedule metadata to the DB.
 */
function _persistScheduleMeta(id, meta) {
  const schedules = getCollection('schedules');
  const idx = schedules.findIndex((s) => s.id === id);

  // Strip non-serializable fields
  const record = { ...meta };

  if (idx !== -1) {
    schedules[idx] = record;
  } else {
    schedules.push(record);
  }
  updateCollection('schedules', schedules);
}

/**
 * Estimate how many times a cron expression fires per day.
 * Simple heuristic based on common patterns.
 */
function _estimateRunsPerDay(cronExpr) {
  if (!cronExpr) return 1;

  const parts = cronExpr.split(' ');
  if (parts.length < 5) return 1;

  const [minute, hour] = parts;

  // Every minute
  if (minute === '*' && hour === '*') return 1440;
  // Every N minutes
  if (minute.startsWith('*/')) {
    const interval = parseInt(minute.split('/')[1], 10);
    if (hour === '*') return Math.floor(1440 / interval);
    return Math.floor(60 / interval);
  }
  // Every hour
  if (hour === '*') return 24;
  // Every N hours
  if (hour.startsWith('*/')) {
    const interval = parseInt(hour.split('/')[1], 10);
    return Math.floor(24 / interval);
  }
  // Specific hour(s)
  if (hour.includes(',')) return hour.split(',').length;

  // Default: once per day
  return 1;
}

module.exports = {
  createSchedule,
  removeSchedule,
  pauseSchedule,
  resumeSchedule,
  getSchedules,
  estimateCost,
  runNow,
  activeJobs,
};
