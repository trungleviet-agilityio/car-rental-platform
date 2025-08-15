"""
MonitoringStack - Comprehensive monitoring and observability
Includes CloudWatch dashboards, alarms, X-Ray tracing, and log aggregation
"""

import aws_cdk as cdk
from aws_cdk import (
    Stack,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cloudwatch_actions,
    aws_sns as sns,
    aws_sns_subscriptions as sns_subscriptions,
    aws_logs as logs,
    aws_xray as xray,
    aws_iam as iam,
    aws_lambda as lambda_,
    Duration,
    RemovalPolicy,
)
from constructs import Construct
from config import EnvironmentConfig
from typing import Optional


class MonitoringStack(Stack):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        config: EnvironmentConfig,
        fargate_stack=None,
        auth_stack=None,
        api_stack=None,
        **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        self.config = config
        self.fargate_stack = fargate_stack
        self.auth_stack = auth_stack
        self.api_stack = api_stack
        
        # SNS topic for alerts
        self.alarm_topic = self._create_alarm_topic()
        
        # CloudWatch dashboard
        self.dashboard = self._create_dashboard()
        
        # Application alarms
        self._create_application_alarms()
        
        # Infrastructure alarms
        self._create_infrastructure_alarms()
        
        # X-Ray tracing (if enabled)
        if config.monitoring.enable_xray:
            self._setup_xray()
        
        # Log insights queries
        self._create_log_insights_queries()
        
        # Custom metrics Lambda
        self._create_custom_metrics_lambda()
        
        # Outputs
        cdk.CfnOutput(
            self, "DashboardURL",
            value=f"https://{self.region}.console.aws.amazon.com/cloudwatch/home?region={self.region}#dashboards:name={self.dashboard.dashboard_name}",
            description="CloudWatch Dashboard URL"
        )
        
        cdk.CfnOutput(
            self, "AlarmTopicArn",
            value=self.alarm_topic.topic_arn,
            description="SNS Topic ARN for alarms"
        )

    def _create_alarm_topic(self) -> sns.Topic:
        """Create SNS topic for alarm notifications"""
        topic = sns.Topic(
            self, "AlarmTopic",
            topic_name=f"{self.config.resource_prefix}-alarms",
            display_name=f"Car Rental {self.config.name.title()} Alarms"
        )
        
        # Add email subscription if configured
        if self.config.monitoring.alarm_email:
            topic.add_subscription(
                sns_subscriptions.EmailSubscription(self.config.monitoring.alarm_email)
            )
        
        return topic

    def _create_dashboard(self) -> cloudwatch.Dashboard:
        """Create comprehensive CloudWatch dashboard"""
        dashboard = cloudwatch.Dashboard(
            self, "Dashboard",
            dashboard_name=f"{self.config.resource_prefix}-dashboard",
            period_override=cloudwatch.PeriodOverride.AUTO
        )
        
        # Application health row
        dashboard.add_widgets(
            cloudwatch.TextWidget(
                markdown="# 🚗 Car Rental Platform - Application Health",
                width=24, height=1
            )
        )
        
        # ECS service metrics
        if self.fargate_stack:
            dashboard.add_widgets(
                cloudwatch.GraphWidget(
                    title="ECS Service - CPU & Memory",
                    left=[
                        cloudwatch.Metric(
                            namespace="AWS/ECS",
                            metric_name="CPUUtilization",
                            dimensions_map={
                                "ServiceName": f"car-rental-alb-service",
                                "ClusterName": "car-rental-cluster"
                            },
                            statistic="Average"
                        )
                    ],
                    right=[
                        cloudwatch.Metric(
                            namespace="AWS/ECS",
                            metric_name="MemoryUtilization", 
                            dimensions_map={
                                "ServiceName": f"car-rental-alb-service",
                                "ClusterName": "car-rental-cluster"
                            },
                            statistic="Average"
                        )
                    ],
                    width=12
                ),
                
                cloudwatch.GraphWidget(
                    title="ECS Service - Task Count",
                    left=[
                        cloudwatch.Metric(
                            namespace="AWS/ECS",
                            metric_name="RunningTaskCount",
                            dimensions_map={
                                "ServiceName": f"car-rental-alb-service",
                                "ClusterName": "car-rental-cluster"
                            },
                            statistic="Average"
                        )
                    ],
                    width=12
                )
            )
        
        # API Gateway metrics
        if self.api_stack:
            dashboard.add_widgets(
                cloudwatch.GraphWidget(
                    title="API Gateway - Requests & Latency",
                    left=[
                        cloudwatch.Metric(
                            namespace="AWS/ApiGateway",
                            metric_name="Count",
                            dimensions_map={"ApiName": "car-rental-api"},
                            statistic="Sum"
                        )
                    ],
                    right=[
                        cloudwatch.Metric(
                            namespace="AWS/ApiGateway", 
                            metric_name="Latency",
                            dimensions_map={"ApiName": "car-rental-api"},
                            statistic="Average"
                        )
                    ],
                    width=12
                ),
                
                cloudwatch.GraphWidget(
                    title="API Gateway - Errors",
                    left=[
                        cloudwatch.Metric(
                            namespace="AWS/ApiGateway",
                            metric_name="4XXError",
                            dimensions_map={"ApiName": "car-rental-api"},
                            statistic="Sum"
                        ),
                        cloudwatch.Metric(
                            namespace="AWS/ApiGateway",
                            metric_name="5XXError", 
                            dimensions_map={"ApiName": "car-rental-api"},
                            statistic="Sum"
                        )
                    ],
                    width=12
                )
            )
        
        # Infrastructure health row
        dashboard.add_widgets(
            cloudwatch.TextWidget(
                markdown="# 🏗️ Infrastructure Health",
                width=24, height=1
            )
        )
        
        # ALB metrics
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Load Balancer - Response Times",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/ApplicationELB",
                        metric_name="TargetResponseTime",
                        statistic="Average"
                    )
                ],
                width=12
            ),
            
            cloudwatch.GraphWidget(
                title="Load Balancer - Request Count",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/ApplicationELB",
                        metric_name="RequestCount",
                        statistic="Sum"
                    )
                ],
                width=12
            )
        )
        
        # Database metrics (if enabled)
        if self.config.enable_database:
            dashboard.add_widgets(
                cloudwatch.GraphWidget(
                    title="RDS - CPU & Connections",
                    left=[
                        cloudwatch.Metric(
                            namespace="AWS/RDS",
                            metric_name="CPUUtilization",
                            statistic="Average"
                        )
                    ],
                    right=[
                        cloudwatch.Metric(
                            namespace="AWS/RDS",
                            metric_name="DatabaseConnections",
                            statistic="Average"
                        )
                    ],
                    width=24
                )
            )
        
        return dashboard

    def _create_application_alarms(self):
        """Create application-level CloudWatch alarms"""
        
        # High error rate alarm
        if self.api_stack:
            api_error_alarm = cloudwatch.Alarm(
                self, "ApiErrorRateAlarm",
                alarm_name=f"{self.config.resource_prefix}-api-error-rate",
                alarm_description="API Gateway error rate is too high",
                metric=cloudwatch.Metric(
                    namespace="AWS/ApiGateway",
                    metric_name="5XXError",
                    dimensions_map={"ApiName": "car-rental-api"},
                    statistic="Sum",
                    period=Duration.minutes(5)
                ),
                threshold=5,
                evaluation_periods=2,
                treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
            )
            api_error_alarm.add_alarm_action(
                cloudwatch_actions.SnsAction(self.alarm_topic)
            )
        
        # High latency alarm
        if self.api_stack:
            api_latency_alarm = cloudwatch.Alarm(
                self, "ApiLatencyAlarm",
                alarm_name=f"{self.config.resource_prefix}-api-latency",
                alarm_description="API Gateway latency is too high",
                metric=cloudwatch.Metric(
                    namespace="AWS/ApiGateway",
                    metric_name="Latency",
                    dimensions_map={"ApiName": "car-rental-api"},
                    statistic="Average",
                    period=Duration.minutes(5)
                ),
                threshold=5000,  # 5 seconds
                evaluation_periods=3,
                treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
            )
            api_latency_alarm.add_alarm_action(
                cloudwatch_actions.SnsAction(self.alarm_topic)
            )

    def _create_infrastructure_alarms(self):
        """Create infrastructure-level CloudWatch alarms"""
        
        # ECS CPU utilization alarm
        if self.fargate_stack:
            ecs_cpu_alarm = cloudwatch.Alarm(
                self, "EcsCpuAlarm",
                alarm_name=f"{self.config.resource_prefix}-ecs-cpu",
                alarm_description="ECS service CPU utilization is too high",
                metric=cloudwatch.Metric(
                    namespace="AWS/ECS",
                    metric_name="CPUUtilization",
                    dimensions_map={
                        "ServiceName": f"car-rental-alb-service",
                        "ClusterName": "car-rental-cluster"
                    },
                    statistic="Average",
                    period=Duration.minutes(5)
                ),
                threshold=self.config.compute.auto_scaling_target_cpu + 20,  # 20% above scaling threshold
                evaluation_periods=3,
                treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
            )
            ecs_cpu_alarm.add_alarm_action(
                cloudwatch_actions.SnsAction(self.alarm_topic)
            )
        
        # ECS memory utilization alarm
        if self.fargate_stack:
            ecs_memory_alarm = cloudwatch.Alarm(
                self, "EcsMemoryAlarm",
                alarm_name=f"{self.config.resource_prefix}-ecs-memory",
                alarm_description="ECS service memory utilization is too high",
                metric=cloudwatch.Metric(
                    namespace="AWS/ECS",
                    metric_name="MemoryUtilization",
                    dimensions_map={
                        "ServiceName": f"car-rental-alb-service",
                        "ClusterName": "car-rental-cluster"
                    },
                    statistic="Average",
                    period=Duration.minutes(5)
                ),
                threshold=85,  # 85%
                evaluation_periods=3,
                treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
            )
            ecs_memory_alarm.add_alarm_action(
                cloudwatch_actions.SnsAction(self.alarm_topic)
            )

    def _setup_xray(self):
        """Setup X-Ray tracing for distributed tracing"""
        # X-Ray is enabled at the service level
        # This creates any additional X-Ray resources if needed
        pass

    def _create_log_insights_queries(self):
        """Create CloudWatch Log Insights saved queries"""
        
        # Error analysis query
        logs.CfnQueryDefinition(
            self, "ErrorAnalysisQuery",
            name=f"{self.config.resource_prefix}-error-analysis",
            log_group_names=[f"/ecs/car-rental-backend"],
            query_string="""
                fields @timestamp, @message, level
                | filter level = "ERROR"
                | sort @timestamp desc
                | limit 100
            """
        )
        
        # Performance analysis query
        logs.CfnQueryDefinition(
            self, "PerformanceAnalysisQuery",
            name=f"{self.config.resource_prefix}-performance-analysis",
            log_group_names=[f"/ecs/car-rental-backend"],
            query_string="""
                fields @timestamp, @message, @duration
                | filter @message like /request/
                | stats avg(@duration), max(@duration), min(@duration) by bin(5m)
                | sort @timestamp desc
            """
        )

    def _create_custom_metrics_lambda(self):
        """Create Lambda function for custom metrics collection"""
        
        # IAM role for custom metrics Lambda
        metrics_role = iam.Role(
            self, "CustomMetricsRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole"),
                iam.ManagedPolicy.from_aws_managed_policy_name("CloudWatchFullAccess")
            ]
        )
        
        # Custom metrics Lambda function
        metrics_lambda = lambda_.Function(
            self, "CustomMetricsLambda",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="index.handler",
            role=metrics_role,
            timeout=Duration.minutes(5),
            environment={
                "ENVIRONMENT": self.config.name,
                "RESOURCE_PREFIX": self.config.resource_prefix
            },
            code=lambda_.Code.from_inline("""
import boto3
import json
import os
from datetime import datetime

cloudwatch = boto3.client('cloudwatch')

def handler(event, context):
    environment = os.environ['ENVIRONMENT']
    resource_prefix = os.environ['RESOURCE_PREFIX']
    
    try:
        # Custom metric: Application Health Score
        health_score = calculate_health_score()
        
        cloudwatch.put_metric_data(
            Namespace=f'CarRental/{environment}',
            MetricData=[
                {
                    'MetricName': 'ApplicationHealthScore',
                    'Value': health_score,
                    'Unit': 'Percent',
                    'Dimensions': [
                        {
                            'Name': 'Environment',
                            'Value': environment
                        }
                    ]
                }
            ]
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps(f'Custom metrics published for {environment}')
        }
        
    except Exception as e:
        print(f'Error publishing custom metrics: {str(e)}')
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error: {str(e)}')
        }

def calculate_health_score():
    # Simple health score calculation
    # In practice, this would aggregate multiple health indicators
    return 95.0  # Placeholder
            """)
        )
        
        # EventBridge rule to trigger custom metrics every 5 minutes
        from aws_cdk import aws_events as events
        from aws_cdk import aws_events_targets as targets
        
        metrics_rule = events.Rule(
            self, "CustomMetricsRule",
            schedule=events.Schedule.rate(Duration.minutes(5)),
            description="Trigger custom metrics collection"
        )
        
        metrics_rule.add_target(targets.LambdaFunction(metrics_lambda))
