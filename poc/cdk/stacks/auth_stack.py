"""
AuthStack - Simple Cognito setup for POC
Minimal configuration for authentication
"""

import aws_cdk as cdk
from aws_cdk import (
    Stack,
    aws_cognito as cognito,
    aws_sns as sns,
    RemovalPolicy,
)
from constructs import Construct
from config import PocConfig


class AuthStack(Stack):
    def __init__(
        self, 
        scope: Construct, 
        construct_id: str, 
        config: PocConfig,
        **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        self.config = config

        # Simple SNS Topic for OTP delivery
        self.otp_topic = sns.Topic(
            self, "PocOTPTopic",
            display_name="Car Rental POC OTP"
        )

        # Simple Cognito User Pool
        self.user_pool = cognito.UserPool(
            self, "PocUserPool",
            user_pool_name="car-rental-poc-users",
            self_sign_up_enabled=True,
            sign_in_aliases=cognito.SignInAliases(
                email=True,
                phone=True
            ),
            standard_attributes=cognito.StandardAttributes(
                email=cognito.StandardAttribute(required=False, mutable=True),
                phone_number=cognito.StandardAttribute(required=False, mutable=True)
            ),
            # Simple password policy for POC
            password_policy=cognito.PasswordPolicy(
                min_length=6,  # Relaxed for POC
                require_lowercase=False,
                require_uppercase=False,
                require_digits=False,
                require_symbols=False
            ),
            mfa=cognito.Mfa.OPTIONAL,  # Optional for ease of use
            removal_policy=RemovalPolicy.DESTROY  # Easy cleanup
        )

        # Simple User Pool Client
        self.user_pool_client = cognito.UserPoolClient(
            self, "PocUserPoolClient",
            user_pool=self.user_pool,
            user_pool_client_name="car-rental-poc-client",
            generate_secret=False,
            auth_flows=cognito.AuthFlow(
                admin_user_password=True,
                user_password=True,
                user_srp=True,
                custom=True
            ),
            prevent_user_existence_errors=True
        )

        # Outputs
        cdk.CfnOutput(
            self, "UserPoolId",
            value=self.user_pool.user_pool_id,
            description="Cognito User Pool ID"
        )

        cdk.CfnOutput(
            self, "UserPoolClientId",
            value=self.user_pool_client.user_pool_client_id,
            description="Cognito User Pool Client ID"
        )

        cdk.CfnOutput(
            self, "OTPTopicArn",
            value=self.otp_topic.topic_arn,
            description="SNS Topic ARN for OTP"
        )