#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { Auth0demoStack } from '../lib/auth0demo-stack';

const app = new cdk.App();
new Auth0demoStack(app, 'auth0demo', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }
});
