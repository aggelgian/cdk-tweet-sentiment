const aws = require('aws-sdk');

const comprehend = new aws.Comprehend();

const detect = async (tweet) => {
  console.log('Detects the sentiment of a tweet.');
  try {
    const query = {
      LanguageCode: 'en',
      Text: tweet.englishText
    };
    console.log('Query Comprehend.', JSON.stringify(query));
    const response = await comprehend.detectSentiment(query).promise();
    const detected = { ...tweet, sentiment: response };
    console.log('Detected the sentiment of a tweet.', JSON.stringify(detected));
    return detected;
  } catch (error) {
    console.log('Failed to detect the sentiment of a tweet.', error);
    throw error;
  }
};

module.exports = detect;
