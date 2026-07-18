/**
 * Lightweight async job queue (in-process) with optional Redis list backend.
 * Use for non-critical deferred work without blocking request threads.
 */
const { log } = require('../utils/logger');

const queue = [];
let pumping = false;
const handlers = new Map();

const register = (name, fn) => {
  handlers.set(name, fn);
};

const enqueue = (name, payload = {}, { delayMs = 0 } = {}) => {
  const job = { name, payload, runAt: Date.now() + delayMs };
  queue.push(job);
  pump();
  return { queued: true, name };
};

const pump = async () => {
  if (pumping) return;
  pumping = true;
  try {
    while (queue.length) {
      const job = queue[0];
      if (job.runAt > Date.now()) {
        setTimeout(() => {
          pumping = false;
          pump();
        }, Math.min(job.runAt - Date.now(), 1000));
        return;
      }
      queue.shift();
      const handler = handlers.get(job.name);
      if (!handler) continue;
      try {
        await handler(job.payload);
      } catch (err) {
        log.warn('job failed', { name: job.name, error: err.message });
      }
    }
  } finally {
    pumping = false;
  }
};

const size = () => queue.length;

module.exports = {
  register,
  enqueue,
  size,
};
