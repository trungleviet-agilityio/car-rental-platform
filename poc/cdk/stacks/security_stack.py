"""
SecurityStack - Centralized security services and configurations
Includes WAF, Security Hub, Config, CloudTrail, and VPC Flow Logs
"""

import aws_cdk as cdk
from aws_cdk import (
    Stack,
    aws_wafv2 as waf,
    aws_config as config,
    aws_cloudtrail as cloudtrail,
    aws_s3 as s3,
    aws_iam as iam,
    aws_securityhub as securityhub,
    aws_guardduty as guardduty,
    aws_kms as kms,
    aws_logs as logs,
    RemovalPolicy,
    Duration,
)
from constructs import Construct
from config import EnvironmentConfig


class SecurityStack(Stack):
    def __init__(
        self, 
        scope: Construct, 
        construct_id: str, 
        config: EnvironmentConfig,
        **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        self.config = config
        
        # KMS Key for encryption
        self.kms_key = kms.Key(
            self, "SecurityKMSKey",
            description=f"KMS key for {config.name} environment encryption",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY if config.name == "dev" else RemovalPolicy.RETAIN
        )
        
        # CloudTrail for audit logging
        if config.security.enable_cloudtrail:
            self._create_cloudtrail()
        
        # AWS Config for compliance monitoring
        if config.security.enable_config:
            self._create_config()
        
        # WAF for web application protection
        if config.security.enable_waf:
            self.web_acl = self._create_waf()
        
        # Security Hub for centralized security findings
        if config.name in ["staging", "prod"]:
            self._create_security_hub()
        
        # GuardDuty for threat detection
        if config.name in ["staging", "prod"]:
            self._create_guardduty()
        
        # Outputs
        cdk.CfnOutput(
            self, "KMSKeyId",
            value=self.kms_key.key_id,
            description="KMS Key ID for encryption"
        )
        
        if config.security.enable_waf and hasattr(self, 'web_acl'):
            cdk.CfnOutput(
                self, "WebACLArn",
                value=self.web_acl.attr_arn,
                description="WAF Web ACL ARN"
            )

    def _create_cloudtrail(self):
        """Create CloudTrail for audit logging"""
        
        # S3 bucket for CloudTrail logs
        cloudtrail_bucket = s3.Bucket(
            self, "CloudTrailBucket",
            bucket_name=f"{self.config.resource_prefix}-cloudtrail-{self.account}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY if self.config.name == "dev" else RemovalPolicy.RETAIN,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldLogs",
                    enabled=True,
                    expiration=Duration.days(365 if self.config.name == "prod" else 90)
                )
            ]
        )
        
        # CloudTrail
        self.cloudtrail = cloudtrail.Trail(
            self, "CloudTrail",
            trail_name=f"{self.config.resource_prefix}-trail",
            bucket=cloudtrail_bucket,
            include_global_service_events=True,
            is_multi_region_trail=True,
            enable_file_validation=True,
            kms_key=self.kms_key
        )
        
        # CloudWatch Logs for CloudTrail
        cloudtrail_log_group = logs.LogGroup(
            self, "CloudTrailLogGroup",
            log_group_name=f"/aws/cloudtrail/{self.config.resource_prefix}",
            retention=logs.RetentionDays.ONE_MONTH if self.config.name == "dev" else logs.RetentionDays.ONE_YEAR,
            encryption_key=self.kms_key,
            removal_policy=RemovalPolicy.DESTROY
        )
        
        self.cloudtrail.log_to_cloud_watch_logs(cloudtrail_log_group)

    def _create_config(self):
        """Create AWS Config for compliance monitoring"""
        
        # S3 bucket for Config
        config_bucket = s3.Bucket(
            self, "ConfigBucket",
            bucket_name=f"{self.config.resource_prefix}-config-{self.account}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY if self.config.name == "dev" else RemovalPolicy.RETAIN
        )
        
        # Config delivery channel
        config.CfnDeliveryChannel(
            self, "ConfigDeliveryChannel",
            s3_bucket_name=config_bucket.bucket_name
        )
        
        # Config configuration recorder
        config.CfnConfigurationRecorder(
            self, "ConfigRecorder",
            role_arn=self._create_config_role().role_arn,
            recording_group=config.CfnConfigurationRecorder.RecordingGroupProperty(
                all_supported=True,
                include_global_resource_types=True,
                resource_types=[]
            )
        )

    def _create_config_role(self) -> iam.Role:
        """Create IAM role for AWS Config"""
        return iam.Role(
            self, "ConfigRole",
            assumed_by=iam.ServicePrincipal("config.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/ConfigRole")
            ]
        )

    def _create_waf(self) -> waf.CfnWebACL:
        """Create WAF Web ACL for application protection"""
        
        # WAF rules for common attacks
        rules = [
            # AWS Managed Rules - Core Rule Set
            waf.CfnWebACL.RuleProperty(
                name="AWSManagedRulesCommonRuleSet",
                priority=1,
                override_action=waf.CfnWebACL.OverrideActionProperty(none={}),
                statement=waf.CfnWebACL.StatementProperty(
                    managed_rule_group_statement=waf.CfnWebACL.ManagedRuleGroupStatementProperty(
                        vendor_name="AWS",
                        name="AWSManagedRulesCommonRuleSet"
                    )
                ),
                visibility_config=waf.CfnWebACL.VisibilityConfigProperty(
                    cloud_watch_metrics_enabled=True,
                    metric_name="CommonRuleSetMetric",
                    sampled_requests_enabled=True
                )
            ),
            
            # AWS Managed Rules - Known Bad Inputs
            waf.CfnWebACL.RuleProperty(
                name="AWSManagedRulesKnownBadInputsRuleSet",
                priority=2,
                override_action=waf.CfnWebACL.OverrideActionProperty(none={}),
                statement=waf.CfnWebACL.StatementProperty(
                    managed_rule_group_statement=waf.CfnWebACL.ManagedRuleGroupStatementProperty(
                        vendor_name="AWS",
                        name="AWSManagedRulesKnownBadInputsRuleSet"
                    )
                ),
                visibility_config=waf.CfnWebACL.VisibilityConfigProperty(
                    cloud_watch_metrics_enabled=True,
                    metric_name="KnownBadInputsMetric",
                    sampled_requests_enabled=True
                )
            ),
            
            # Rate limiting rule
            waf.CfnWebACL.RuleProperty(
                name="RateLimitRule",
                priority=3,
                action=waf.CfnWebACL.RuleActionProperty(
                    block={}
                ),
                statement=waf.CfnWebACL.StatementProperty(
                    rate_based_statement=waf.CfnWebACL.RateBasedStatementProperty(
                        limit=2000,  # requests per 5-minute window
                        aggregate_key_type="IP"
                    )
                ),
                visibility_config=waf.CfnWebACL.VisibilityConfigProperty(
                    cloud_watch_metrics_enabled=True,
                    metric_name="RateLimitMetric",
                    sampled_requests_enabled=True
                )
            )
        ]
        
        # IP allowlist rule for production
        if self.config.name == "prod":
            rules.append(
                waf.CfnWebACL.RuleProperty(
                    name="IPAllowlistRule",
                    priority=0,  # Highest priority
                    action=waf.CfnWebACL.RuleActionProperty(allow={}),
                    statement=waf.CfnWebACL.StatementProperty(
                        ip_set_reference_statement=waf.CfnWebACL.IPSetReferenceStatementProperty(
                            arn=self._create_ip_allowlist().attr_arn
                        )
                    ),
                    visibility_config=waf.CfnWebACL.VisibilityConfigProperty(
                        cloud_watch_metrics_enabled=True,
                        metric_name="IPAllowlistMetric",
                        sampled_requests_enabled=True
                    )
                )
            )
        
        # Create Web ACL
        web_acl = waf.CfnWebACL(
            self, "WebACL",
            name=f"{self.config.resource_prefix}-waf",
            scope="REGIONAL",  # For ALB
            default_action=waf.CfnWebACL.DefaultActionProperty(allow={}),
            rules=rules,
            visibility_config=waf.CfnWebACL.VisibilityConfigProperty(
                cloud_watch_metrics_enabled=True,
                metric_name=f"{self.config.resource_prefix}WebACL",
                sampled_requests_enabled=True
            )
        )
        
        return web_acl

    def _create_ip_allowlist(self) -> waf.CfnIPSet:
        """Create IP allowlist for production"""
        return waf.CfnIPSet(
            self, "IPAllowlist",
            name=f"{self.config.resource_prefix}-ip-allowlist",
            scope="REGIONAL",
            ip_address_version="IPV4",
            addresses=self.config.security.allowed_cidr_blocks,
            description="Allowed IP addresses for production environment"
        )

    def _create_security_hub(self):
        """Enable Security Hub for centralized security findings"""
        securityhub.CfnHub(
            self, "SecurityHub",
            enable_default_standards=True
        )

    def _create_guardduty(self):
        """Enable GuardDuty for threat detection"""
        guardduty.CfnDetector(
            self, "GuardDuty",
            enable=True,
            finding_publishing_frequency="FIFTEEN_MINUTES"
        )
