// Single handler demo
// const handler = async (job) => {
//   logger.info('you named handler!', job.data);
//   await addQueueItem(queueName, {
//     ...job.data,
//     completed: true,
//     next: null,
//   });
//   return;}

const videoHandlers = require("../video/video.handlers");

// };
const queueHandlers = {
  ...videoHandlers,
};

module.exports = queueHandlers;
