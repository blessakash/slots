const { Worker, QueueEvents } = require("bullmq");
// const { QUEUE_EVENT_HANDLERS } = require('./handlers');
const logger = require("../../../middleware/logger");
const { redisConnection } = require("./queue.queue");
const ALL_EVENTS = require("./queue.constants");
const queueHandlers = require("./queue.handlers");

const listenQueueEvent = (queueName) => {
  const queueEvents = new QueueEvents(queueName, {
    connection: redisConnection,
  });

  // queueEvents.on("waiting", ({ jobId }) => {
  //   console.log(`A job with ID ${jobId} is waiting`);
  // });

  // queueEvents.on("active", ({ jobId, prev, ...others }) => {
  //   console.log(
  //     `Job ${jobId} is now active; previous status was ${prev}`,
  //     others
  //   );
  // });

  // queueEvents.on("completed", ({ jobId, returnvalue }) => {
  //   console.log(`${jobId} has completed and returned.next`);
  // });

  queueEvents.on("failed", ({ jobId, failedReason }) => {
    logger.info(`${jobId} has failed with reason ${failedReason}`);
  });

  const worker = new Worker(
    queueName,
    async (job) => {
      //   const handler = QUEUE_EVENT_HANDLERS[queueName];
      const handler = queueHandlers[queueName];
      if (handler) {
        return await handler(job);
      }
      throw new Error("No handler found for queue: " + queueName);
    },
    { connection: redisConnection }
  );

  worker.on("active", ({ jobId }) => {
    logger.info(`A job with ID ${jobId} is active`);
  });

  worker.on("completed", (job) => {
    logger.info(`${job.id} has completed!`);
  });

  worker.on("failed", (job, err) => {
    logger.info(`${job.id} has failed with ${err.message}`);
  });

  logger.info(queueName, " worker started", new Date().toTimeString());
};

const setupAllQueueEvents = () => {
  Object.values(ALL_EVENTS).map((queueName) => listenQueueEvent(queueName));
  return true;
};

module.exports = { setupAllQueueEvents, listenQueueEvent };
