const aws = require('aws-sdk');

const db = new aws.DynamoDB.DocumentClient();
const s3 = new aws.S3();

const _count = async (data) => {
  console.log('Counts a tweet.');
  const tweet = JSON.parse(data);
  const query = {
    TableName: process.env.TOTALS_TABLE,
    Key: { [process.env.TOTALS_TABLE_KEY]: tweet.term },
    UpdateExpression: 'add #n :x',
    ExpressionAttributeNames: { '#n' : tweet.sentiment.Sentiment },
    ExpressionAttributeValues: { ':x' : 1 }
  };
  console.log('Query table.', JSON.stringify(query));
  await db.update(query).promise();
  console.log('Counted a tweet.');
};

const _aggregate = async (record) => {
  console.log('Aggregates records.');
  const query = {
    Bucket: record.s3.bucket.name,
    Key: record.s3.object.key
  };
  console.log('Gets S3 object.', JSON.stringify(query));
  const response = await s3.getObject(query).promise();
  const jdata = response.Body.toString('utf8').split('\n').filter(Boolean);
  await Promise.all(jdata.map(_count));
  console.log('Aggregated records.');
};

const handler = async (event, context, callback) => {
  console.log('Aggregates tweets.', JSON.stringify(event));
  try {
    await Promise.all(event.Records.map(_aggregate));
    console.log('Aggregated tweets.');
  } catch (error) {
    console.log('Failed to aggregate tweets.', error);
    throw error;
  }
};

module.exports = {
  handler
};
