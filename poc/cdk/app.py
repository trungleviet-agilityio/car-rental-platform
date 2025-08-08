#!/usr/bin/env python3
"""
Car Rental Platform CDK App
Main entry point for deploying infrastructure
"""

import aws_cdk as cdk
from stacks.auth_stack import AuthStack
from stacks.api_stack import ApiStack
from stacks.fargate_stack import FargateStack
from stacks.storage_stack import StorageStack

app = cdk.App()

# Create stacks (order matters for cross-stack refs)
storage_stack = StorageStack(app, "CarRentalStorageStack")
fargate_stack = FargateStack(app, "CarRentalFargateStack", storage_stack=storage_stack)
auth_stack = AuthStack(
    app,
    "CarRentalAuthStack",
    users_sync_url=f"http://{fargate_stack.load_balancer.load_balancer.load_balancer_dns_name}/api/users/sync",
)
api_stack = ApiStack(app, "CarRentalApiStack", auth_stack=auth_stack)

# Add dependencies
api_stack.add_dependency(auth_stack)
auth_stack.add_dependency(fargate_stack)
fargate_stack.add_dependency(storage_stack)

app.synth()
