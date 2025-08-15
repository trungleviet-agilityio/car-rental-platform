"""
Simple POC configuration for Car Rental Platform
Cost-optimized and minimal setup for proof of concept
"""

from dataclasses import dataclass
from typing import Dict
import os


@dataclass
class PocConfig:
    """Simple POC configuration"""
    name: str
    account_id: str
    region: str
    
    # Basic compute
    cpu: int
    memory: int
    desired_count: int
    
    # Cost optimization flags
    enable_database: bool          # False = use in-memory SQLite
    enable_nat_gateway: bool      # False = save costs
    enable_monitoring: bool       # False = basic logging only
    
    # Resource naming
    resource_prefix: str
    
    # Basic tagging
    tags: Dict[str, str]


# Simple POC environments
ENVIRONMENTS: Dict[str, PocConfig] = {
    "dev": PocConfig(
        name="dev",
        account_id=os.environ.get("AWS_ACCOUNT_ID", "123456789012"),
        region="ap-southeast-1",
        
        # Minimal compute for cost savings
        cpu=256,
        memory=512,
        desired_count=1,
        
        # Cost optimization - minimal but functional
        enable_database=True,       # Keep RDS but minimal size
        enable_nat_gateway=False,   # Use public subnets to save $32/month
        enable_monitoring=False,    # Basic CloudWatch only
        
        resource_prefix="car-rental-poc",
        
        tags={
            "Environment": "poc",
            "Project": "car-rental-platform",
            "Purpose": "proof-of-concept",
            "CostOptimized": "true"
        }
    ),
    
    # If you need staging later, add it here with slightly more resources
    "staging": PocConfig(
        name="staging",
        account_id=os.environ.get("AWS_ACCOUNT_ID", "123456789012"),
        region="ap-southeast-1",
        
        cpu=512,
        memory=1024,
        desired_count=1,
        
        enable_database=True,       # Real database for staging
        enable_nat_gateway=False,   # Still save costs
        enable_monitoring=True,     # Basic monitoring
        
        resource_prefix="car-rental-staging",
        
        tags={
            "Environment": "staging",
            "Project": "car-rental-platform",
            "Purpose": "testing"
        }
    )
}


def get_poc_config(environment: str) -> PocConfig:
    """Get POC configuration for environment"""
    if environment not in ENVIRONMENTS:
        raise ValueError(f"Unknown environment: {environment}. Available: {list(ENVIRONMENTS.keys())}")
    
    return ENVIRONMENTS[environment]


def get_current_environment() -> str:
    """Get current environment from context or environment variable"""
    # CDK context takes precedence
    import aws_cdk as cdk
    app = cdk.App()
    env_from_context = app.node.try_get_context("environment")
    
    if env_from_context:
        return env_from_context
    
    # Fall back to environment variable (default to dev for POC)
    return os.environ.get("ENVIRONMENT", "dev")
