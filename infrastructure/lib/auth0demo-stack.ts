import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as s3Deployment from '@aws-cdk/aws-s3-deployment';
import * as cloudfront from '@aws-cdk/aws-cloudfront';

export class Auth0demoStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const hosting = new s3.Bucket(this, 'Hosting', {
      publicReadAccess: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,        
      websiteIndexDocument: "index.html"
    });

    const deployment = new s3Deployment.BucketDeployment(this, 'FrontendDeployment', {
      destinationBucket: hosting,
      sources: [s3Deployment.Source.asset('../frontend/public')]
    });

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

    
  }
}
