import cdk = require('@aws-cdk/cdk');
import dynamodb = require('@aws-cdk/aws-dynamodb');
import iam = require('@aws-cdk/aws-iam');
import lambda = require('@aws-cdk/aws-lambda');
import { S3EventSource } from '@aws-cdk/aws-lambda-event-sources';
import s3 = require('@aws-cdk/aws-s3');

export interface AggregatorProps extends lambda.FunctionProps {
  source: s3.Bucket;
  destination: dynamodb.Table
}

export class Aggregator extends lambda.Function {
  constructor(parent: cdk.Construct, id: string, props: AggregatorProps) {
    super(parent, id, props);

    const policy = new iam.PolicyStatement()
      .addResource(props.source.bucketArn)
      .addResource(`${props.source.bucketArn}/*`)
      .addAction('s3:Get*');
    this.addToRolePolicy(policy);

    this.addEventSource(new S3EventSource(props.source, {
      events: [ s3.EventType.ObjectCreated ]
    }));

    props.destination.grantReadWriteData(this.role);
  }
}
