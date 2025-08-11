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
    def __init__(self, scope: Construct, construct_id: str, users_sync_url: str | None = None, **kwargs) -> None:
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

        # Optional Post-Confirmation trigger to sync user to backend
        if users_sync_url:
            self.post_confirmation_fn = cognito.UserPoolOperation.POST_CONFIRMATION
            # Use a Lambda-backed custom resource to call backend on confirmation
            # For PoC simplicity, we attach a simple Lambda trigger here
            post_conf_lambda = self._create_post_confirmation_lambda(users_sync_url)
            self.user_pool.add_trigger(
                self.post_confirmation_fn,
                post_conf_lambda,
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

    def _create_post_confirmation_lambda(self, users_sync_url: str):
        import aws_cdk.aws_lambda as lambda_
        import aws_cdk.aws_iam as iam
        from aws_cdk import Duration

        fn = lambda_.Function(
            self,
            "PostConfirmationSync",
            runtime=lambda_.Runtime.NODEJS_18_X,
            handler="index.handler",
            code=lambda_.Code.from_inline(
                """
                const http = require('http');
                const https = require('https');
                exports.handler = async (event) => {
                  const body = JSON.stringify({
                    cognitoSub: event.request.userAttributes.sub,
                    username: event.userName,
                    phoneNumber: event.request.userAttributes.phone_number,
                    email: event.request.userAttributes.email,
                  });
                  const url = process.env.USERS_SYNC_URL;
                  const client = url.startsWith('https') ? https : http;
                  await new Promise((resolve, reject) => {
                    const req = client.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, (res) => {
                      res.on('data', () => {});
                      res.on('end', resolve);
                    });
                    req.on('error', reject);
                    req.write(body);
                    req.end();
                  });
                  return event;
                };
                """
            ),
            timeout=Duration.seconds(10),
            environment={"USERS_SYNC_URL": users_sync_url},
        )
        # Allow CloudWatch Logs
        fn.add_to_role_policy(
            iam.PolicyStatement(
                actions=["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
                resources=["*"]
            )
        )
        return fn
