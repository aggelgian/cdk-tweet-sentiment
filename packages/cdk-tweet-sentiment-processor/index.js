const PromiseThrottle = require('promise-throttle');

const clean = require('./clean');
const detect = require('./detect');
const translate = require('./translate');

const _process = async (record) => {
  try {
    console.log('Processes a record.');
    const jdata = Buffer.from(record.data, 'base64').toString('utf8');
    const tweet = JSON.parse(jdata);
    const ctweet = await clean(tweet);
    const ttweet = await translate(ctweet);
    const dtweet = await detect(ttweet);
    const nrecord = {
      recordId: record.recordId,
      result: 'Ok',
      data: Buffer.from(JSON.stringify(dtweet) + '\n', 'utf8').toString('base64')
    };
    console.log('Processed a record.');
    return nrecord;
  } catch (error) {
    console.log('Failed to process a record.', error);
    return null;
  }
};

const handler = async (event, context, callback) => {
  console.log('Processes tweets.');
  try {
    // Throttle calls to AWS Translate and AWS Comprehend to respect service limits.
    const throttle = promiseThrottle = new PromiseThrottle({
      requestsPerSecond: 10,
      promiseImplementation: Promise
    });
    const throttled = event.records.map((record) => {
      return throttle.add(() => {
        return _process(record);
      });
    })
    const processed = await Promise.all(throttled);
    const records = processed.filter(Boolean);
    console.log(`Processed ${records.length} of ${processed.length} tweets.`);
    callback(null, { records });
  } catch (error) {
    console.log('Failed to process tweets.', error);
    throw error;
  }
};

module.exports = {
  handler
};
