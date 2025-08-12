"""
ApiStack - API Gateway with Lambda proxy for authentication
"""

import aws_cdk as cdk
from aws_cdk import (
    Stack,
    aws_apigateway as apigateway,
    aws_lambda as lambda_,
    aws_iam as iam,
    Duration,
)
from constructs import Construct


class ApiStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, auth_stack=None, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        self.auth_stack = auth_stack

        # Lambda function for login handler
        self.login_handler = lambda_.Function(
            self, "LoginHandler",
            runtime=lambda_.Runtime.NODEJS_18_X,
            handler="login_handler.lambda_handler",
            code=lambda_.Code.from_asset("../lambda/login_handler"),
            timeout=Duration.seconds(30),
            memory_size=256,
            environment={
                "USER_POOL_ID": auth_stack.user_pool.user_pool_id if auth_stack else "",
                "USER_POOL_CLIENT_ID": auth_stack.user_pool_client.user_pool_client_id if auth_stack else "",
                "OTP_TOPIC_ARN": auth_stack.otp_topic.topic_arn if auth_stack else ""
            }
        )

        # Grant permissions to Lambda
        if auth_stack:
            auth_stack.user_pool.grant(
                self.login_handler,
                "cognito-idp:AdminInitiateAuth",
                "cognito-idp:AdminRespondToAuthChallenge",
                "cognito-idp:AdminGetUser"
            )
            auth_stack.otp_topic.grant_publish(self.login_handler)

        # API Gateway
        self.api = apigateway.RestApi(
            self, "CarRentalAPI",
            rest_api_name="car-rental-api",
            description="Car Rental Platform API",
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=apigateway.Cors.ALL_ORIGINS,
                allow_methods=apigateway.Cors.ALL_METHODS,
                allow_headers=[
                    "Content-Type",
                    "X-Amz-Date",
                    "Authorization",
                    "X-Api-Key",
                    "X-Amz-Security-Token"
                ]
            )
        )

        # Lambda integration
        login_integration = apigateway.LambdaIntegration(
            self.login_handler,
            request_templates={"application/json": '{"statusCode": "200"}'}
        )

        # Auth resource and methods
        auth_resource = self.api.root.add_resource("auth")
        login_resource = auth_resource.add_resource("login")
        
        login_resource.add_method(
            "POST",
            login_integration,
            authorization_type=apigateway.AuthorizationType.NONE,
            request_models={
                "application/json": apigateway.Model.EMPTY_MODEL
            }
        )

        # Outputs
        cdk.CfnOutput(
            self, "ApiGatewayUrl",
            value=self.api.url,
            description="API Gateway URL"
        )
        
        cdk.CfnOutput(
            self, "LoginEndpoint",
            value=f"{self.api.url}auth/login",
            description="Login endpoint URL"
        )


        api_key = self.api.add_api_key("DefaultApiKey")
        plan = self.api.add_usage_plan("DefaultUsagePlan",
            throttle=apigateway.ThrottleSettings(rate_limit=50, burst_limit=100))
        plan.add_api_stage(stage=self.api.deployment_stage)
        plan.add_api_key(api_key)
