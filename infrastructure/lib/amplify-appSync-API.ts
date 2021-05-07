import * as cdk from '@aws-cdk/core';
import { GraphQLTransform } from '@aws-amplify/graphql-transformer-core';
import { DynamoDBModelTransformer } from 'graphql-dynamodb-transformer';


export class AmplifyAppSyncAPI extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id);

    // TODO
  }
}