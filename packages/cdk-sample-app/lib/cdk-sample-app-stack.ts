import cdk = require('@aws-cdk/cdk');

import  { CdkTweetSentiment } from 'cdk-tweet-sentiment';

export class CdkSampleAppStack extends cdk.Stack {
  constructor(parent: cdk.App, name: string, props?: cdk.StackProps) {
    super(parent, name, props);

    new CdkTweetSentiment(this, 'TweetSentiment', {
      terms: '#peace, #hate, #love',
      batchSize: 50,
      maxTweetsPerTerm: 500,
      interval: 5,
      twitterCredentials: {
        bearerToken: 'xxx',
        consumerKey: 'xxx',
        consumerSecret: 'xxx'
      }
    });
  }
}
