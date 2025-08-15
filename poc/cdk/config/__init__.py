"""
Simple POC Configuration for Car Rental Platform CDK
"""

from .environments import (
    PocConfig,
    get_poc_config,
    get_current_environment,
    ENVIRONMENTS
)

__all__ = [
    "PocConfig",
    "get_poc_config",
    "get_current_environment", 
    "ENVIRONMENTS"
]
