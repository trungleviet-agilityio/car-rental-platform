"""
AuthStack - Cognito User Pool with OTP-based authentication
"""

import aws_cdk as cdk
from aws_cdk import (
    Stack,
    aws_cognito as cognito,
    aws_sns as sns,
    aws_ses as ses,
    aws_iam as iam,
    Duration,
)
from constructs import Construct


class AuthStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # SNS Topic for OTP delivery
        self.otp_topic = sns.Topic(
            self, "OTPDeliveryTopic",
            display_name="Car Rental OTP Delivery"
        )

        # Cognito User Pool with OTP-based authentication
        self.user_pool = cognito.UserPool(
            self, "CarRentalUserPool",
            user_pool_name="car-rental-user-pool",
            self_sign_up_enabled=True,
            sign_in_aliases=cognito.SignInAliases(
                email=True,
                phone=True
            ),
            standard_attributes=cognito.StandardAttributes(
                email=cognito.StandardAttribute(
                    required=True,
                    mutable=True
                ),
                phone_number=cognito.StandardAttribute(
                    required=True,
                    mutable=True
                )
            ),
            password_policy=cognito.PasswordPolicy(
                min_length=8,
                require_lowercase=True,
                require_uppercase=True,
                require_digits=True,
                require_symbols=True
            ),
            mfa=cognito.Mfa.REQUIRED,
            mfa_second_factor=cognito.MfaSecondFactor(
                sms=True,
                otp=True
            ),
            account_recovery=cognito.AccountRecovery.EMAIL_ONLY,
            removal_policy=cdk.RemovalPolicy.DESTROY
        )

        # User Pool Client for OTP-based login
        self.user_pool_client = cognito.UserPoolClient(
            self, "CarRentalUserPoolClient",
            user_pool=self.user_pool,
            user_pool_client_name="car-rental-client",
            generate_secret=False,
            auth_flows=cognito.AuthFlow(
                admin_user_password=True,
                user_password=True,
                user_srp=True,
                custom=True
            ),
            o_auth=cognito.OAuthSettings(
                flows=cognito.OAuthFlows(
                    implicit_code_grant=True,
                    authorization_code_grant=True
                ),
                scopes=[
                    cognito.OAuthScope.EMAIL,
                    cognito.OAuthScope.OPENID,
                    cognito.OAuthScope.PROFILE
                ]
            ),
            prevent_user_existence_errors=True
        )

        # Identity Pool for temporary AWS credentials
        self.identity_pool = cognito.CfnIdentityPool(
            self, "CarRentalIdentityPool",
            identity_pool_name="car-rental-identity-pool",
            allow_unauthenticated_identities=False,
            cognito_identity_providers=[
                cognito.CfnIdentityPool.CognitoIdentityProviderProperty(
                    client_id=self.user_pool_client.user_pool_client_id,
                    provider_name=self.user_pool.user_pool_provider_name
                )
            ]
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
            self, "IdentityPoolId",
            value=self.identity_pool.ref,
            description="Cognito Identity Pool ID"
        )

        cdk.CfnOutput(
            self, "OTPTopicArn",
            value=self.otp_topic.topic_arn,
            description="SNS Topic ARN for OTP delivery"
        )
