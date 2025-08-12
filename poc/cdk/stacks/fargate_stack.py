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
    aws_rds as rds,
    aws_secretsmanager as secretsmanager,
    aws_lambda as lambda_,
    aws_stepfunctions as sfn,
    aws_stepfunctions_tasks as tasks,
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

        # Add S3 endpoint to VPC
        self.vpc.add_gateway_endpoint("S3Endpoint", service=ec2.GatewayVpcEndpointAwsService.S3)

        # ECS Cluster
        self.cluster = ecs.Cluster(
            self, "CarRentalCluster",
            vpc=self.vpc,
            cluster_name="car-rental-cluster"
        )

        # ECR repository (import existing to avoid recreate failures)
        self.repository = ecr.Repository.from_repository_name(
            self,
            "CarRentalRepository",
            repository_name="car-rental-backend",
        )

        # Security group for RDS
        db_sg = ec2.SecurityGroup(self, "DbSecurityGroup", vpc=self.vpc, description="RDS SG")

        # RDS Postgres instance (for PoC)
        self.db = rds.DatabaseInstance(
            self,
            "Postgres",
            engine=rds.DatabaseInstanceEngine.postgres(version=rds.PostgresEngineVersion.VER_14),
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            instance_type=ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
            allocated_storage=20,
            security_groups=[db_sg],
            credentials=rds.Credentials.from_generated_secret("postgres"),
            database_name="car_rental",
            removal_policy=cdk.RemovalPolicy.DESTROY,
            deletion_protection=False,
            multi_az=False,
            publicly_accessible=False,
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
                "PORT": "3000",
                "AWS_REGION": Stack.of(self).region,
                "S3_BUCKET_NAME": storage_stack.bucket.bucket_name if storage_stack else "",
                "DB_HOST": self.db.instance_endpoint.hostname,
                "DB_PORT": str(self.db.instance_endpoint.port),
                "DB_USER": "postgres",
                "DB_NAME": "car_rental",
            },
            logging=ecs.LogDrivers.aws_logs(
                stream_prefix="car-rental-backend"
            )
        )

        # Pass DB password via secret
        if self.db.secret is not None:
            container.add_secret(
                "DB_PASSWORD",
                ecs.Secret.from_secrets_manager(self.db.secret, field="password"),
            )

        # Fargate Service with public ALB
        self.load_balancer = ecs_patterns.ApplicationLoadBalancedFargateService(
            self, "CarRentalALBService",
            cluster=self.cluster,
            task_definition=task_definition,
            service_name="car-rental-alb-service",
            desired_count=1,
            public_load_balancer=True,
            listener_port=80,
            target_protocol=elbv2.ApplicationProtocol.HTTP,
            health_check_grace_period=Duration.seconds(60),
            circuit_breaker=ecs.DeploymentCircuitBreaker(rollback=True),
        )

        # Configure health check to hit Nest global prefix '/api'
        self.load_balancer.target_group.configure_health_check(
            path="/api",
            healthy_http_codes="200-399"
        )

        # Grant S3 permissions if storage stack exists
        if storage_stack:
            storage_stack.bucket.grant_read_write(task_definition.task_role)

        # Allow ECS service to reach RDS
        db_sg.add_ingress_rule(
            peer=self.load_balancer.service.connections.security_groups[0],
            connection=ec2.Port.tcp(self.db.instance_endpoint.port),
            description="Allow ECS service to connect to Postgres",
        )

        # KYC Step Functions: mock validator Lambda + callback Lambda + state machine
        validator_fn = lambda_.Function(
            self,
            "KycValidator",
            runtime=lambda_.Runtime.NODEJS_18_X,
            handler="index.handler",
            code=lambda_.Code.from_inline(
                """
                exports.handler = async (event) => {
                  await new Promise(r => setTimeout(r, 500));
                  return { status: 'verified', input: event };
                };
                """
            ),
            timeout=Duration.seconds(10),
        )
        # Callback Lambda to notify NestJS
        callback_fn = lambda_.Function(
            self,
            "KycCallback",
            runtime=lambda_.Runtime.NODEJS_18_X,
            handler="index.handler",
            code=lambda_.Code.from_inline(
                """
                const http = require('http');
                exports.handler = async (event) => {
                  const payload = JSON.stringify({
                    cognitoSub: event.cognitoSub,
                    key: event.key,
                    status: event.status || 'verified',
                  });
                  const url = process.env.CALLBACK_URL;
                  await new Promise((resolve, reject) => {
                    const req = http.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } }, (res) => {
                      res.on('data', () => {});
                      res.on('end', resolve);
                    });
                    req.on('error', reject);
                    req.write(payload);
                    req.end();
                  });
                  return { ok: true };
                };
                """
            ),
            timeout=Duration.seconds(10),
            environment={
                "CALLBACK_URL": f"http://{self.load_balancer.load_balancer.load_balancer_dns_name}/api/kyc/callback",
            },
        )
        task = tasks.LambdaInvoke(self, "ValidateKyc", lambda_function=validator_fn, output_path="$.Payload")
        callback_task = tasks.LambdaInvoke(
            self,
            "NotifyBackend",
            lambda_function=callback_fn,
            payload=sfn.TaskInput.from_object({
                "cognitoSub": sfn.JsonPath.string_at("$.input.cognitoSub"),
                "key": sfn.JsonPath.string_at("$.input.key"),
                "status": sfn.JsonPath.string_at("$.status"),
            }),
            output_path="$.Payload",
        )
        definition = task.next(callback_task).next(sfn.Succeed(self, "Done"))
        self.kyc_state_machine = sfn.StateMachine(
            self,
            "KycStateMachine",
            definition_body=sfn.DefinitionBody.from_chainable(definition),
            timeout=Duration.minutes(5),
        )

        # Allow backend to start executions and read state machine
        self.kyc_state_machine.grant_start_execution(task_definition.task_role)

        # Provide SFN ARN to container env
        container.add_environment("KYC_SFN_ARN", self.kyc_state_machine.state_machine_arn)

        # Outputs
        cdk.CfnOutput(
            self, "ClusterName",
            value=self.cluster.cluster_name,
            description="ECS Cluster Name"
        )
        
        cdk.CfnOutput(
            self,
            "RepositoryUri",
            value=self.repository.repository_uri,
            description="ECR Repository URI",
        )
        
        cdk.CfnOutput(
            self, "LoadBalancerDNS",
            value=self.load_balancer.load_balancer.load_balancer_dns_name,
            description="Application Load Balancer DNS"
        )

        cdk.CfnOutput(
            self,
            "RdsEndpoint",
            value=self.db.instance_endpoint.hostname,
            description="RDS endpoint",
        )

        cdk.CfnOutput(
            self,
            "KycStateMachineArn",
            value=self.kyc_state_machine.state_machine_arn,
            description="KYC Step Functions ARN",
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
        return iam.Role(
            self, "CarRentalTaskRole",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
            inline_policies={
                "S3LeastPrivilege": iam.PolicyDocument(statements=[
                    iam.PolicyStatement(
                        actions=["s3:PutObject","s3:GetObject","s3:DeleteObject","s3:ListBucket"],
                        resources=[
                            self.storage_stack.bucket.bucket_arn,
                            f"{self.storage_stack.bucket.bucket_arn}/kyc/*"
                        ]
                    )
                ])
            }
        )
