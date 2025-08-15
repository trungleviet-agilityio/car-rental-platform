"""
FargateStack - Simple ECS container service for POC
Cost-optimized with minimal RDS database
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
    aws_rds as rds,
    aws_logs as logs,
    Duration,
    RemovalPolicy,
)
from constructs import Construct
from config import PocConfig


class FargateStack(Stack):
    def __init__(
        self, 
        scope: Construct, 
        construct_id: str, 
        config: PocConfig,
        storage_stack=None,
        **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        self.config = config
        self.storage_stack = storage_stack

        # Simple VPC with minimal AZs to save costs
        self.vpc = ec2.Vpc(
            self, "PocVPC",
            ip_addresses=ec2.IpAddresses.cidr("10.1.0.0/16"),
            max_azs=2,
            nat_gateways=0,  # No NAT gateway = save $32/month
            subnet_configuration=[
                # Only public subnets for cost optimization
                ec2.SubnetConfiguration(
                    subnet_type=ec2.SubnetType.PUBLIC,
                    name="Public",
                    cidr_mask=24
                )
            ]
        )

        # ECS Cluster
        self.cluster = ecs.Cluster(
            self, "PocCluster",
            vpc=self.vpc,
            cluster_name="car-rental-poc-cluster"
        )

        # ECR repository (import existing or create)
        try:
            self.repository = ecr.Repository.from_repository_name(
                self, "PocRepository",
                repository_name="car-rental-backend"
            )
        except:
            self.repository = ecr.Repository(
                self, "PocRepository",
                repository_name="car-rental-backend",
                removal_policy=RemovalPolicy.DESTROY
            )

        # Minimal RDS database - cheapest possible
        db_sg = ec2.SecurityGroup(
            self, "DbSecurityGroup", 
            vpc=self.vpc,
            description="RDS security group"
        )
        
        self.db = rds.DatabaseInstance(
            self, "PocDatabase",
            engine=rds.DatabaseInstanceEngine.postgres(version=rds.PostgresEngineVersion.VER_14),
            instance_type=ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),  # Cheapest
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC),  # Public subnet
            allocated_storage=20,  # Minimum
            security_groups=[db_sg],
            credentials=rds.Credentials.from_generated_secret("postgres"),
            database_name="car_rental",
            removal_policy=RemovalPolicy.DESTROY,  # Easy cleanup for POC
            deletion_protection=False,
            multi_az=False,  # No multi-AZ for cost savings
            publicly_accessible=False,
            backup_retention=Duration.days(0),  # No backups for POC
        )

        # Task Definition with minimal resources
        task_definition = ecs.FargateTaskDefinition(
            self, "PocTaskDef",
            memory_limit_mib=config.memory,
            cpu=config.cpu,
            execution_role=self._create_execution_role(),
            task_role=self._create_task_role()
        )

        # Container log group
        log_group = logs.LogGroup(
            self, "PocLogGroup",
            log_group_name="/ecs/car-rental-poc",
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Get image tag from context
        image_tag = self.node.try_get_context("imageTag") or "latest"

        # Container definition
        container = task_definition.add_container(
            "PocBackend",
            image=ecs.ContainerImage.from_ecr_repository(self.repository, image_tag),
            port_mappings=[ecs.PortMapping(container_port=3000)],
            environment={
                "NODE_ENV": "production",
                "PORT": "3000",
                "AWS_REGION": Stack.of(self).region,
                "S3_BUCKET_NAME": storage_stack.bucket.bucket_name if storage_stack else "",
                "DB_DISABLE": "false",  # Use RDS
                "DB_HOST": self.db.instance_endpoint.hostname,
                "DB_PORT": str(self.db.instance_endpoint.port),
                "DB_USER": "postgres",
                "DB_NAME": "car_rental",
                # Provider settings for POC
                "AUTH_PROVIDER": "mock",
                "STORAGE_PROVIDER": "s3" if storage_stack else "mock",
                "NOTIFICATION_PROVIDER": "mock",
                "PAYMENT_PROVIDER": "mock",
                "LAMBDA_PROVIDER": "mock",
            },
            logging=ecs.LogDrivers.aws_logs(stream_prefix="car-rental-poc", log_group=log_group)
        )

        # Add DB password secret
        if self.db.secret:
            container.add_secret(
                "DB_PASSWORD",
                ecs.Secret.from_secrets_manager(self.db.secret, field="password")
            )
            self.db.secret.grant_read(task_definition.task_role)
            self.db.secret.grant_read(task_definition.execution_role)

        # Simple Fargate Service with ALB
        self.load_balancer = ecs_patterns.ApplicationLoadBalancedFargateService(
            self, "PocService",
            cluster=self.cluster,
            task_definition=task_definition,
            service_name="car-rental-poc-service",
            desired_count=config.desired_count,
            public_load_balancer=True,
            listener_port=80,
            health_check_grace_period=Duration.seconds(120),
            task_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC),
            assign_public_ip=True  # Required for public subnets
        )

        # Configure health check
        self.load_balancer.target_group.configure_health_check(
            path="/api",
            healthy_http_codes="200-399",
            interval=Duration.seconds(60),
            timeout=Duration.seconds(30),
            unhealthy_threshold_count=5,
            healthy_threshold_count=2
        )

        # Grant S3 permissions if storage stack exists
        if storage_stack:
            storage_stack.bucket.grant_read_write(task_definition.task_role)

        # Allow ECS to connect to RDS
        db_sg.add_ingress_rule(
            peer=self.load_balancer.service.connections.security_groups[0],
            connection=ec2.Port.tcp(self.db.instance_endpoint.port),
            description="Allow ECS to connect to RDS"
        )

        # Outputs
        cdk.CfnOutput(
            self, "ClusterName",
            value=self.cluster.cluster_name,
            description="ECS Cluster Name"
        )
        
        cdk.CfnOutput(
            self, "LoadBalancerDNS",
            value=self.load_balancer.load_balancer.load_balancer_dns_name,
            description="Application Load Balancer DNS"
        )
        
        cdk.CfnOutput(
            self, "DatabaseEndpoint",
            value=self.db.instance_endpoint.hostname,
            description="RDS Database Endpoint"
        )

    def _create_execution_role(self):
        """Create IAM role for ECS task execution"""
        return iam.Role(
            self, "PocTaskExecutionRole",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AmazonECSTaskExecutionRolePolicy")
            ]
        )

    def _create_task_role(self):
        """Create IAM role for ECS task"""
        return iam.Role(
            self, "PocTaskRole",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com")
        )