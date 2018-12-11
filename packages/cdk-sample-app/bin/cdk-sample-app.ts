#!/usr/bin/env node
import cdk = require('@aws-cdk/cdk');
import { CdkSampleAppStack } from '../lib/cdk-sample-app-stack';

const app = new cdk.App();
new CdkSampleAppStack(app, 'CdkSampleAppStack');
app.run();
