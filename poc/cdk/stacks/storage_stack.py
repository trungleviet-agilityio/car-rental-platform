"""
StorageStack - Simple S3 bucket for POC
Minimal configuration for cost optimization
"""

import aws_cdk as cdk
from aws_cdk import (
    Stack,
    aws_s3 as s3,
    RemovalPolicy,
)
from constructs import Construct
from config import PocConfig


class StorageStack(Stack):
    def __init__(
        self, 
        scope: Construct, 
        construct_id: str, 
        config: PocConfig,
        **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        self.config = config

        # Simple S3 bucket for POC - no KMS encryption to save costs
        self.bucket = s3.Bucket(
            self, "PocStorageBucket",
            bucket_name=f"{config.resource_prefix}-storage-{self.account}",
            
            # Cost optimization settings
            versioned=False,                                    # No versioning for POC
            encryption=s3.BucketEncryption.S3_MANAGED,         # Free server-side encryption
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,              # Can delete easily for POC
            auto_delete_objects=True,                          # Auto cleanup
            
            # Basic CORS for web uploads
            cors=[
                s3.CorsRule(
                    allowed_methods=[s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST],
                    allowed_origins=["*"],
                    allowed_headers=["*"],
                    max_age=3000
                )
            ],
            
            # Simple lifecycle rule - delete old files after 30 days to save costs
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldFiles",
                    enabled=True,
                    expiration=cdk.Duration.days(30)
                )
            ]
        )

        # Outputs
        cdk.CfnOutput(
            self, "BucketName",
            value=self.bucket.bucket_name,
            description="S3 bucket name for file storage"
        )
        
        cdk.CfnOutput(
            self, "BucketArn",
            value=self.bucket.bucket_arn,
            description="S3 bucket ARN"
        )