#!/usr/bin/env python3
"""
Car Rental Platform - Simple POC App
Minimal infrastructure for proof of concept
"""

import aws_cdk as cdk
from config import get_poc_config, get_current_environment
from stacks.auth_stack import AuthStack
from stacks.api_stack import ApiStack
from stacks.fargate_stack import FargateStack
from stacks.storage_stack import StorageStack

# Initialize CDK app
app = cdk.App()

# Get environment configuration
environment = get_current_environment()
config = get_poc_config(environment)

print(f"🚀 Deploying Car Rental POC to: {environment}")
print(f"💰 Cost-optimized mode: NAT Gateway disabled, minimal RDS instance")

# Environment setup for CDK
env = cdk.Environment(
    account=config.account_id,
    region=config.region
)

# Create environment-specific stack names
stack_prefix = f"CarRental{environment.title()}"

# 1. Storage Stack - Simple S3 bucket
storage_stack = StorageStack(
    app, 
    f"{stack_prefix}StorageStack",
    config=config,
    env=env
)

# 2. Fargate Stack - Simple container service with minimal RDS
fargate_stack = FargateStack(
    app, 
    f"{stack_prefix}FargateStack",
    config=config,
    storage_stack=storage_stack,
    env=env
)

# 3. Auth Stack - Simple Cognito setup
auth_stack = AuthStack(
    app,
    f"{stack_prefix}AuthStack",
    config=config,
    env=env
)

# 4. API Stack - Simple API Gateway
api_stack = ApiStack(
    app, 
    f"{stack_prefix}ApiStack",
    auth_stack=auth_stack,
    env=env
)

# Simple dependencies (minimal)
fargate_stack.add_dependency(storage_stack)
api_stack.add_dependency(auth_stack)

# Apply tags to all stacks
for stack in [storage_stack, fargate_stack, auth_stack, api_stack]:
    for key, value in config.tags.items():
        cdk.Tags.of(stack).add(key, value)

# Add environment output to the first stack
cdk.CfnOutput(
    storage_stack,
    f"{stack_prefix}Environment",
    value=environment,
    description="Environment name"
)

print(f"✅ POC stacks configured: Storage, Fargate (with RDS), Auth, API")
print(f"💡 Monitoring and Security stacks skipped for cost optimization")
print(f"💰 Monthly cost estimate: ~$25-35 (t3.micro RDS + minimal Fargate)")

app.synth()
