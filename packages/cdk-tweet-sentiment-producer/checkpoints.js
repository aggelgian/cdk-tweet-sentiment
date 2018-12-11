const aws = require('aws-sdk');

const dynamodb = new aws.DynamoDB();

const getCheckpoint = async (term) => {
  console.log(`Gets the checkpoint for ${term}.`);
  try {
    const query = {
      TableName: process.env.CHECKPOINTS_TABLE,
      Key: {
        [process.env.CHECKPOINTS_TABLE_KEY]: { S: term }
      }
    };
    console.log('Get:', JSON.stringify(query));
    const response = await dynamodb.getItem(query).promise();
    console.log('Got response:', JSON.stringify(response));

    if (!response.Item) {
      console.log(`Could not find the checkpoint for term ${term}.`);
      return undefined;
    }
    const checkpoint = Number.parseInt(response.Item.checkpoint.N, 10);
    console.log(`Got the checkpoint for ${term}.`);
    return checkpoint;
  } catch (error) {
    console.log(`Failed to get the checkpoint for ${term}.`, error);
    throw error;
  }
};

const saveCheckpoint = async (term, checkpoint) => {
  console.log(`Saves the checkpoint for ${term}.`);
  try {
    const query = {
      TableName: process.env.CHECKPOINTS_TABLE,
      Item: {
        [process.env.CHECKPOINTS_TABLE_KEY]: { S: term },
        checkpoint: { N: checkpoint.toString() }
      }
    };
    console.log('Put:', JSON.stringify(query));
    await dynamodb.putItem(query).promise();
    console.log(`Saved the checkpoint for ${term}.`);
  } catch (error) {
    console.log(`Failed to save the checkpoint for ${term}.`, error);
    throw error;
  }
};

module.exports = {
  getCheckpoint,
  saveCheckpoint
}
