import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as s3Deployment from '@aws-cdk/aws-s3-deployment';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import { OpenIdConnectProvider } from '@aws-cdk/aws-iam';
import { CfnIdentityPool } from '@aws-cdk/aws-cognito';
import { GraphqlApi, FieldLogLevel, MappingTemplate, AuthorizationType, Schema } from '@aws-cdk/aws-appsync';
import { Table, AttributeType, BillingMode, ProjectionType } from '@aws-cdk/aws-dynamodb';
import { PolicyStatement, Effect } from '@aws-cdk/aws-iam';

export class Auth0demoStack extends cdk.Stack {
  //#region  - Amplify AppSync >>>>>>>>>>>>>>>>>>>>>>>>>
  private isSyncEnabled: boolean
  private syncTable: Table
  //#endregion - Amplify AppSync <<<<<<<<<<<<<<<<<<<<<<<<


  constructor(scope: cdk.Construct, id: string, outputs: any, resolvers: any, props?: cdk.StackProps) {
    super(scope, id, props);

    // Hosting bucket
    const hosting = new s3.Bucket(this, 'Hosting', {
      publicReadAccess: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,        
      websiteIndexDocument: "index.html"
    });

    // frontend deployment
    const deployment = new s3Deployment.BucketDeployment(this, 'FrontendDeployment', {
      destinationBucket: hosting,
      sources: [s3Deployment.Source.asset('../frontend/public')]
    });

    // Cloudfront distribution
    const cf = new cloudfront.CloudFrontWebDistribution(this, "CDKCRAStaticDistribution", {
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: hosting
          },
          behaviors: [{isDefaultBehavior: true}]
        }
      ]
    });

    // OpenID connect provider
    const oidc = new OpenIdConnectProvider(this, 'oidcProvider', {
      url: 'https://clxs.eu.auth0.com',
      clientIds: ["2ZNtsXTWwazwmyTDLTuli6XeLXXSMuZJ"],
      thumbprints:['B3DD7606D2B5A8B4A13771DBECC9EE1CECAFA38A']
    });

    // Cognito Identiy pool
    new CfnIdentityPool(this, 'OpenIDIdentityPool', {
      allowUnauthenticatedIdentities: false,
      identityPoolName: 'Auth0',
      openIdConnectProviderArns: [oidc.openIdConnectProviderArn]
    });


    //#region - Amplify AppSync >>>>>>>>>>>>>>>>>>>>>>>>>
    const STAGE = this.node.tryGetContext('STAGE')

    const api = new GraphqlApi(this, 'auth0demo-api', {
      name: `auth0demo-api-${STAGE}`,
      schema: Schema.fromAsset('./appsync/schema.graphql'),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: AuthorizationType.OIDC,
          openIdConnectConfig: {
            oidcProvider: 'https://clxs.eu.auth0.com'
          }
        },
      },
      logConfig: {
        fieldLogLevel: FieldLogLevel.ERROR,
      }
    })

    let tableData = outputs.CDK_TABLES

    // Check to see if sync is enabled
    if (tableData['DataStore']) {
      this.isSyncEnabled = true;
      this.syncTable = this.createSyncTable(tableData['DataStore']);
      delete tableData['DataStore']; // We don't want to create this again below so remove it from the tableData map
    }

    this.createTablesAndResolvers(api, tableData, resolvers)
    //#endregion - Amplify AppSync <<<<<<<<<<<<<<<<<<<<<<<<<


  }

  //#region - Amplify AppSync >>>>>>>>>>>>>>>>>>>>>>>>>
  createTablesAndResolvers(api: GraphqlApi, tableData: any, resolvers: any) {
    Object.keys(tableData).forEach((tableKey: any) => {
      const table = this.createTable(tableData[tableKey]);
      const dataSource = api.addDynamoDbDataSource(tableKey, table, {
        description: `Data source for ${tableKey}`
      });

      // https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-appsync-datasource-deltasyncconfig.html

      if (this.isSyncEnabled) {
        //@ts-ignore - ds is the base CfnDataSource and the db config needs to be versioned - see CfnDataSource
        dataSource.ds.dynamoDbConfig.versioned = true

        //@ts-ignore - ds is the base CfnDataSource - see CfnDataSource
        dataSource.ds.dynamoDbConfig.deltaSyncConfig = {
          baseTableTtl: '43200', // Got this value from amplify - 30 days in minutes
          deltaSyncTableName: this.syncTable.tableName,
          deltaSyncTableTtl: '30' // Got this value from amplify - 30 minutes
        }

        // Need to add permission for our datasource service role to access the sync table
        dataSource.grantPrincipal.addToPrincipalPolicy(new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            'dynamodb:*'
          ],
          resources: [
            this.syncTable.tableArn
          ]
        }))
      }

      Object.keys(resolvers).forEach((resolverKey: any) => {
        let resolverTableName = this.getTableNameFromFieldName(resolverKey)
        if (tableKey === resolverTableName) {
          let resolver = resolvers[resolverKey]

          dataSource.createResolver({
            typeName: resolver.typeName,
            fieldName: resolver.fieldName,
            requestMappingTemplate: MappingTemplate.fromFile(resolver.requestMappingTemplate),
            responseMappingTemplate: MappingTemplate.fromFile(resolver.responseMappingTemplate),
          })
        }
      })
    });
  }

  createTable(tableData: any) {
    let tableProps: any = {
      billingMode: BillingMode.PAY_PER_REQUEST,
      partitionKey: {
        name: tableData.PartitionKey.name,
        type: this.convertAttributeType(tableData.PartitionKey.type)
      }
    };

    if (tableData.SortKey && tableData.SortKey.name) {
      tableProps.sortKey = {
        name: tableData.SortKey.name,
        type: this.convertAttributeType(tableData.SortKey.type)
      };
    };

    if (tableData.TTL && tableData.TTL.Enabled) {
      tableProps.timeToLiveAttribute = tableData.TTL.AttributeName;
    }

    let table = new Table(this, tableData.TableName, tableProps);

    if (tableData.GlobalSecondaryIndexes && tableData.GlobalSecondaryIndexes.length > 0) {
      tableData.GlobalSecondaryIndexes.forEach((gsi: any) => {
        table.addGlobalSecondaryIndex({
          indexName: gsi.IndexName,
          partitionKey: {
            name: gsi.PartitionKey.name,
            type: this.convertAttributeType(gsi.PartitionKey.type)
          },
          projectionType: this.convertProjectionType(gsi.Projection.ProjectionType)
        })
      })
    }

    return table;
  }

  // https://docs.aws.amazon.com/appsync/latest/devguide/conflict-detection-and-sync.html
  createSyncTable(tableData: any) {
    return new Table(this, 'sync-table', {
      billingMode: BillingMode.PAY_PER_REQUEST,
      partitionKey: {
        name: tableData.PartitionKey.name,
        type: this.convertAttributeType(tableData.PartitionKey.type)
      },
      sortKey: {
        name: tableData.SortKey.name,
        type: this.convertAttributeType(tableData.SortKey.type)
      },
      timeToLiveAttribute: tableData.TTL?.AttributeName || '_ttl'
    })
  }

  convertAttributeType(type: string) {
    switch (type) {
      case 'S':
        return AttributeType.STRING
      case 'N':
        return AttributeType.NUMBER
      case 'B':
        return AttributeType.BINARY
      default:
        return AttributeType.STRING
    }
  }

  convertProjectionType(type: string) {
    switch (type) {
      case 'ALL':
        return ProjectionType.ALL
      case 'INCLUDE':
        return ProjectionType.INCLUDE
      case 'KEYS_ONLY':
        return ProjectionType.KEYS_ONLY
      default:
        return ProjectionType.ALL
    }
  }

  getTableNameFromFieldName(fieldName: string) {
    let tableName = ''
    let plural = false
    let replace = ''

    if (fieldName.indexOf('list') > -1) {
      replace = 'list'
      plural = true
    } else if (fieldName.indexOf('sync') > -1) {
      replace = 'sync'
      plural = true
    } else if (fieldName.indexOf('get') > -1) {
      replace = 'get'
    } else if (fieldName.indexOf('delete') > -1) {
      replace = 'delete'
    } else if (fieldName.indexOf('create') > -1) {
      replace = 'create'
    } else if (fieldName.indexOf('update') > -1) {
      replace = 'update'
    }

    tableName = fieldName.replace(replace, '')

    if (plural) {
      tableName = tableName.slice(0, -1)
    }

    return tableName + 'Table'
  }

  //#endregion - Amplify AppSync <<<<<<<<<<<<<<<<<<<<<<<<<

}
