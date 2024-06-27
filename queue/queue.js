const { Queue } = require("bullmq");
const ALL_EVENTS = require("./queue.constants");
const logger = require("../../../middleware/logger");

//Redis connectoin
const redisConnection = {
  host: process.env.REDIS_SERVER,
  port: process.env.REDIS_PORT,
};

//All queue items
// const queues = Object.values(ALL_EVENTS).map((queueName) => {
//   return {
//     name: queueName,
//     queueObj: new Queue(queueName, {
//       connection: redisConnection,
//     }),
//   };
// });
const queues = {};
/**
 * Cached strings to redis
 * @param {string} queueName events
 * @param {object} item {}
 * @param {object} options bullmq add queue options
 * @returns
 */
const addQueueItem = async (queueName, item, options = {}) => {
  logger.info("addQueueItem", queueName, item);
  const queue = queues.find((q) => q.name === queueName);
  if (!queue) {
    throw new Error(`queue ${queueName} not found`);
  }
  await queue.queueObj.add(queueName, item, {
    removeOnComplete: true,
    removeOnFail: false,
    ...options,
  });
};

module.exports = { queues, redisConnection, addQueueItem };
