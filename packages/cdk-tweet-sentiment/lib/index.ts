import cdk = require('@aws-cdk/cdk');
import dynamodb = require('@aws-cdk/aws-dynamodb');
import lambda = require('@aws-cdk/aws-lambda');
import s3 = require('@aws-cdk/aws-s3');
import path = require('path');

import { Aggregator } from './aggregator';
import { DeliveryStream } from './delivery-stream';
import { Processor } from './processor';
import { Producer } from './producer';

export interface TwitterCredentials {
  /**
   * The Twitter consumer key.
   */
  consumerKey: string;

  /**
   * The Twitter consumer secret.
   */
  consumerSecret: string;

  /**
   * The Twitter bearer token.
   */
  bearerToken: string;
}

export interface CdkTweetSentimentProps extends dynamodb.TableProps {
  /**
   * A comma-separated list of terms to query Twitter.
   */
  terms: string;

  /**
   * The number of tweets to return per page, up to a maximum of 100.
   * Set to 0 to disable polling.
   * @default 50
   */
  batchSize?: number;

  /**
   * The maximum number of tweets to process per term in every execution.
   * @default 500
   */
  maxTweetsPerTerm?: number;

  /**
   * The Twitter developer credentials for application-only authentication,
   * as documented at https://developer.twitter.com/en/docs/basics/authentication/overview.
   */
  twitterCredentials: TwitterCredentials;

  /**
   * The frequency, in minutes, that determines when the producer is invoked.
   * Set to 0 to disable polling.
   * @default 5
   */
  interval?: number;
}

export class CdkTweetSentiment extends dynamodb.Table {
  constructor(parent: cdk.Construct, name: string, props: CdkTweetSentimentProps) {
    super(parent, name, props);

    const pwd = __dirname;

    const key = 'term';
    this.addPartitionKey({
      name: key,
      type: dynamodb.AttributeType.String
    });

    // The DynamoDB table for the checkpoints.
    const checkpoints = new dynamodb.Table(this, 'Checkpoints', { });
    const checkpointsKey = 'id';
    checkpoints.addPartitionKey({
      name: checkpointsKey,
      type: dynamodb.AttributeType.String
    });

    // The S3 bucket for the tweets.
    const tweets = new s3.Bucket(this, 'Tweets', { });

    // The lambda processor.
    const processor = new Processor(this, 'Processor', {
      code: lambda.Code.asset(path.join(pwd, '..', 'lambdas', 'cdk-tweet-sentiment-processor.zip')),
      handler: 'index.handler',
      runtime: lambda.Runtime.NodeJS810,
      timeout: 15 * 60
    });

    // The delivery stream.
    const deliveryStream = new DeliveryStream(this, 'DeliveryStream', {
      sink: tweets,
      processor
    });

    // The producer lambda function.
    const batchSize = props.batchSize || 50;
    const maxTweetsPerTerm = props.maxTweetsPerTerm || 500;
    const interval = props.interval === undefined ? 5 : props.interval;
    new Producer(this, 'Producer', {
      code: lambda.Code.asset(path.join(pwd, '..', 'lambdas', 'cdk-tweet-sentiment-producer.zip')),
      handler: 'index.handler',
      runtime: lambda.Runtime.NodeJS810,
      timeout: 15 * 60,
      memorySize: 256,
      environment: {
        BATCH_SIZE: batchSize.toString(),
        CHECKPOINTS_TABLE: checkpoints.tableName,
        CHECKPOINTS_TABLE_KEY: checkpointsKey,
        FAUCET_NAME: deliveryStream.name,
        MAX_TWEETS: maxTweetsPerTerm.toString(),
        TWITTER_BEARER_TOKEN: props.twitterCredentials.bearerToken,
        TWITTER_CONSUMER_KEY: props.twitterCredentials.consumerKey,
        TWITTER_CONSUMER_SECRET: props.twitterCredentials.consumerSecret,
        TWITTER_TERMS: props.terms
      },
      deliveryStreamArn: deliveryStream.arn,
      checkpoints,
      interval
    });

    // The aggregator lambda function.
    new Aggregator(this, 'Aggregator', {
      code: lambda.Code.asset(path.join(pwd, '..', 'lambdas', 'cdk-tweet-sentiment-aggregator.zip')),
      handler: 'index.handler',
      runtime: lambda.Runtime.NodeJS810,
      timeout: 15 * 60,
      environment: {
        TOTALS_TABLE: this.tableName,
        TOTALS_TABLE_KEY: key,
      },
      source: tweets,
      destination: this
    });
  }
}
