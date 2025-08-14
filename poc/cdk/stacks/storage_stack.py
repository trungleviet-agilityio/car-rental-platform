"""
StorageStack - S3 bucket for file storage (KYC documents, etc.)
"""

import aws_cdk as cdk
from aws_cdk import (
    Stack,
    aws_s3 as s3,
    aws_s3_deployment as s3_deployment,
    aws_iam as iam,
    RemovalPolicy,
)
from constructs import Construct


class StorageStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # S3 Bucket for file storage
        self.bucket = s3.Bucket(
            self, "CarRentalStorageBucket",
            bucket_name=f"car-rental-storage-{self.account}",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            cors=[
                s3.CorsRule(
                    allowed_methods=[
                        s3.HttpMethods.GET,
                        s3.HttpMethods.PUT,
                        s3.HttpMethods.POST,
                        s3.HttpMethods.DELETE,
                        s3.HttpMethods.HEAD
                    ],
                    allowed_origins=["*"],
                    allowed_headers=["*"],
                    exposed_headers=[
                        "ETag",
                        "x-amz-meta-custom-header"
                    ],
                    max_age=3000
                )
            ]
        )

        # Security: deny insecure transport and uploads without SSE header
        self.bucket.add_to_resource_policy(
            iam.PolicyStatement(
                sid="DenyInsecureTransport",
                effect=iam.Effect.DENY,
                principals=[iam.AnyPrincipal()],
                actions=["s3:*"],
                resources=[self.bucket.bucket_arn, f"{self.bucket.bucket_arn}/*"],
                conditions={"Bool": {"aws:SecureTransport": False}},
            )
        )

        self.bucket.add_to_resource_policy(
            iam.PolicyStatement(
                sid="DenyUnencryptedObjectUploads",
                effect=iam.Effect.DENY,
                principals=[iam.AnyPrincipal()],
                actions=["s3:PutObject"],
                resources=[f"{self.bucket.bucket_arn}/*"],
                conditions={"Null": {"s3:x-amz-server-side-encryption": True}},
            )
        )

        # Lifecycle rules
        self.bucket.add_lifecycle_rule(
            id="DeleteIncompleteMultipartUploads",
            enabled=True,
            abort_incomplete_multipart_upload_after=cdk.Duration.days(1)
        )

        # Outputs
        cdk.CfnOutput(
            self, "BucketName",
            value=self.bucket.bucket_name,
            description="S3 Storage Bucket Name"
        )
        
        cdk.CfnOutput(
            self, "StorageBucketArn",
            value=self.bucket.bucket_arn,
            description="S3 Storage Bucket ARN"
        )
