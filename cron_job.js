const { Queue, Worker, QueueScheduler } = require('bullmq');
const Redis = require('ioredis');
const { fetchNewEmails, replyToEmail, addLabelToEmail } = require('./emailUtils');
const { getFeedback } = require('./gptFeedbackProcessor');

async function cron_job(){
    const connection = new Redis();

    const emailQueue = new Queue('emailQueue', { connection });
    const feedbackQueue = new Queue('feedbackQueue', { connection });
    const replyQueue = new Queue('replyQueue', { connection });

    new QueueScheduler('emailQueue', { connection });
    new QueueScheduler('feedbackQueue', { connection });
    new QueueScheduler('replyQueue', { connection });

    // Worker to fetch emails
    const emailWorker = new Worker('emailQueue', async job => {
    const emails = await fetchNewEmails();
    for (const email of emails) {
        const feedbackJob = await feedbackQueue.add('processFeedback', { email });
        await replyQueue.add('replyAndLabel', { email, feedbackJobId: feedbackJob.id }, { parent: feedbackJob });
    }
    }, { connection });

    // Worker to process feedback
    const feedbackWorker = new Worker('feedbackQueue', async job => {
    const { email } = job.data;
    const feedback = await getFeedback(email.text);
    return { email, feedback };
    }, { connection });

    // Worker to reply to email and add label
    const replyWorker = new Worker('replyQueue', async job => {
    const { email, feedbackJobId } = job.data;
    const feedbackJob = await feedbackQueue.getJob(feedbackJobId);
    const feedback = feedbackJob.returnvalue.feedback;

    await replyToEmail(email, feedback);
    await addLabelToEmail(email, 'feedback done');
    }, { connection });

    // Schedule email fetching every 10 seconds
    emailQueue.add('fetchEmails', {}, {
    repeat: {
        every: 10*1000, // 10 seconds
    }
    });

    // event listner
    emailWorker.on('completed', (job) => {
    console.log(`Completed job ${job.id} in email queue`);
    });

    feedbackWorker.on('completed', (job) => {
    console.log(`Completed job ${job.id} in feedback queue`);
    });

    replyWorker.on('completed', (job) => {
    console.log(`Completed job ${job.id} in reply queue`);
    });
}

module.exports = {cron_job}