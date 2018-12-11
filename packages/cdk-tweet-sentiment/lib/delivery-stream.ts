import cdk = require('@aws-cdk/cdk');
import iam = require('@aws-cdk/aws-iam');
import kinesisFirehose = require('@aws-cdk/aws-kinesisfirehose');
import lambda = require('@aws-cdk/aws-lambda');
import logs = require('@aws-cdk/aws-logs');
import s3 = require('@aws-cdk/aws-s3');

export interface DeliveryStreamProps {
  processor: lambda.FunctionRef,
  sink: s3.BucketRef
};

export class DeliveryStream extends cdk.Construct {
  public readonly arn: string;
  public readonly name: string;

  constructor(parent: cdk.Construct, id: string, props: DeliveryStreamProps) {
    super(parent, id);

    const role = new iam.Role(this, 'Role', {
      assumedBy: new iam.ServicePrincipal('firehose.amazonaws.com')
    });

    const pSink = new iam.PolicyStatement()
      .addResource(props.sink.bucketArn)
      .addResource(`${props.sink.bucketArn}/*`)
      .addAction('s3:AbortMultipartUpload')
      .addAction('s3:GetBucketLocation')
      .addAction('s3:GetObject')
      .addAction('s3:ListBucket')
      .addAction('s3:ListBucketMultipartUploads')
      .addAction('s3:PutObject');
    role.addToPolicy(pSink);

    const pProcessor = new iam.PolicyStatement()
      .addResource(props.processor.functionArn)
      .addAction('lambda:InvokeFunction');
    role.addToPolicy(pProcessor);

    const logGroup = new logs.LogGroup(this, 'LogGroup', {
      retentionDays: 7
    });
    const logStream = logGroup.newStream(this, 'LogStream', { });
    const pLogs = new iam.PolicyStatement()
      .addResource('arn:aws:logs:*:*:*')
      .addAction('s3:CreateLogGroup')
      .addAction('s3:CreateLogStream')
      .addAction('s3:PutLogEvents')
      .addAction('s3:DescribeLogStreams');
    role.addToPolicy(pLogs);

    const deliveryStream = new kinesisFirehose.cloudformation.DeliveryStreamResource(this, 'DeliveryStream', {
      extendedS3DestinationConfiguration: {
        bucketArn: props.sink.bucketArn,
        bufferingHints: {
          intervalInSeconds: 60,
          sizeInMBs: 5
        },
        prefix: 'tweets/',
        compressionFormat: 'UNCOMPRESSED',
        processingConfiguration: {
          enabled: true,
          processors: [{
            type: 'Lambda',
            parameters: [{
              parameterName: 'LambdaArn',
              parameterValue: props.processor.functionArn
            }]
          }]
        },
        cloudWatchLoggingOptions: {
          enabled: true,
          logGroupName: logGroup.logGroupName,
          logStreamName: logStream.logStreamName
        },
        roleArn: role.roleArn
      }
    });
    this.name = deliveryStream.ref;
    this.arn = deliveryStream.deliveryStreamArn;
  }
}
