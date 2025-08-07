"""
FargateStack - ECS cluster and Fargate service for NestJS backend
"""

import aws_cdk as cdk
from aws_cdk import (
    Stack,
    aws_ecs as ecs,
    aws_ecs_patterns as ecs_patterns,
    aws_ec2 as ec2,
    aws_ecr as ecr,
    aws_iam as iam,
    aws_elasticloadbalancingv2 as elbv2,
    Duration,
)
from constructs import Construct


class FargateStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, storage_stack=None, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        self.storage_stack = storage_stack

        # VPC for ECS cluster
        self.vpc = ec2.Vpc(
            self, "CarRentalVPC",
            max_azs=2,
            nat_gateways=1
        )

        # ECS Cluster
        self.cluster = ecs.Cluster(
            self, "CarRentalCluster",
            vpc=self.vpc,
            cluster_name="car-rental-cluster"
        )

        # ECR Repository for container images
        self.repository = ecr.Repository(
            self, "CarRentalRepository",
            repository_name="car-rental-backend",
            removal_policy=cdk.RemovalPolicy.DESTROY
        )

        # Task Definition
        task_definition = ecs.FargateTaskDefinition(
            self, "CarRentalTaskDef",
            memory_limit_mib=512,
            cpu=256,
            execution_role=self.create_execution_role(),
            task_role=self.create_task_role()
        )

        # Container definition
        container = task_definition.add_container(
            "CarRentalBackend",
            image=ecs.ContainerImage.from_ecr_repository(self.repository, "latest"),
            container_name="car-rental-backend",
            port_mappings=[ecs.PortMapping(container_port=3000)],
            environment={
                "NODE_ENV": "production",
                "PORT": "3000"
            },
            logging=ecs.LogDrivers.aws_logs(
                stream_prefix="car-rental-backend"
            )
        )

        # Fargate Service
        self.service = ecs.FargateService(
            self, "CarRentalService",
            cluster=self.cluster,
            task_definition=task_definition,
            service_name="car-rental-service",
            desired_count=1,
            assign_public_ip=True,
            health_check_grace_period=Duration.seconds(60)
        )

        # Application Load Balancer
        self.load_balancer = ecs_patterns.ApplicationLoadBalancedFargateService(
            self, "CarRentalALBService",
            cluster=self.cluster,
            task_definition=task_definition,
            service_name="car-rental-alb-service",
            desired_count=1,
            public_load_balancer=True,
            listener_port=80,
            target_protocol=elbv2.ApplicationProtocol.HTTP,
            health_check_grace_period=Duration.seconds(60)
        )

        # Grant S3 permissions if storage stack exists
        if storage_stack:
            storage_stack.bucket.grant_read_write(task_definition.task_role)

        # Outputs
        cdk.CfnOutput(
            self, "ClusterName",
            value=self.cluster.cluster_name,
            description="ECS Cluster Name"
        )
        
        cdk.CfnOutput(
            self, "RepositoryUri",
            value=self.repository.repository_uri,
            description="ECR Repository URI"
        )
        
        cdk.CfnOutput(
            self, "LoadBalancerDNS",
            value=self.load_balancer.load_balancer.load_balancer_dns_name,
            description="Application Load Balancer DNS"
        )

    def create_execution_role(self):
        """Create IAM role for ECS task execution"""
        return iam.Role(
            self, "CarRentalTaskExecutionRole",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AmazonECSTaskExecutionRolePolicy")
            ]
        )

    def create_task_role(self):
        """Create IAM role for ECS task"""
        return iam.Role(
            self, "CarRentalTaskRole",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("AmazonS3FullAccess")
            ]
        )
