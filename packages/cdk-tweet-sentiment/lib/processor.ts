import cdk = require('@aws-cdk/cdk');
import iam = require('@aws-cdk/aws-iam');
import lambda = require('@aws-cdk/aws-lambda');

export class Processor extends lambda.Function {
  constructor(parent: cdk.Construct, id: string, props: lambda.FunctionProps) {
    super(parent, id, props);

    const policy = new iam.PolicyStatement()
      .addResource('*')
      .addAction('comprehend:DetectDominantLanguage')
      .addAction('comprehend:DetectSentiment')
      .addAction('translate:TranslateText');
    this.addToRolePolicy(policy);
  }
}
