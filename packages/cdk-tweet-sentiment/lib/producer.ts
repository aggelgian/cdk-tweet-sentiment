import cdk = require('@aws-cdk/cdk');
import dynamodb = require('@aws-cdk/aws-dynamodb');
import events = require('@aws-cdk/aws-events');
import iam = require('@aws-cdk/aws-iam');
import lambda = require('@aws-cdk/aws-lambda');

export interface ProducerProps extends lambda.FunctionProps {
  deliveryStreamArn: string;
  checkpoints: dynamodb.Table;
	interval: number;
}

export class Producer extends lambda.Function {
  constructor(parent: cdk.Construct, id: string, props: ProducerProps) {
    super(parent, id, props);

    const policy = new iam.PolicyStatement()
      .addResource(props.deliveryStreamArn)
      .addAction('firehose:DescribeDeliveryStream')
      .addAction('firehose:ListDeliveryStreams')
      .addAction('firehose:PutRecord')
      .addAction('firehose:PutRecordBatch');
    this.addToRolePolicy(policy);

    props.checkpoints.grantReadWriteData(this.role);

    const interval = props.interval;
    if (interval > 0) {
      const unit = interval === 1 ? 'minute' : 'minutes';
      const timer = new events.EventRule(this, 'Timer', {
        scheduleExpression: `rate(${interval} ${unit})`
      });
      timer.addTarget(this);
    }
  }
}
