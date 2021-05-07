#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { Auth0demoStack } from '../lib/auth0demo-stack';

//#region  - Amplify AppSync >>>>>>>>>>>>>>>>>>>>>>>>>
import { SchemaTransformer } from '../transform/schema-transformer';

const transformer = new SchemaTransformer();
const outputs = transformer.transform();
const resolvers = transformer.getResolvers();

const STAGE = process.env.STAGE || 'demo'

const app = new cdk.App({ 
  context: { 
      STAGE: STAGE
  }
});
//#endregion - Amplify AppSync <<<<<<<<<<<<<<<<<<<<<<<<


new Auth0demoStack(app, 'auth0demo', outputs, resolvers, {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }
});
