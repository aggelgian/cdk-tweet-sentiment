const aws = require('aws-sdk');

const firehose = new aws.Firehose();

const putRecord = async (data) => {
  try {
    const query = {
      DeliveryStreamName: process.env.FAUCET_NAME,
      Record: {
        Data: JSON.stringify(data)
      }
    };
    await firehose.putRecord(query).promise();
    console.log('Put a record.');
  } catch (error) {
    console.log('Failed to put a record.', error);
    throw error;
  }
};

module.exports = {
  putRecord
};
