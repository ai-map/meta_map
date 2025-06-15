"""
Meta Map Utils - Python 版本
统一地图数据格式工具库
"""

from .validator import validate_for_backend, validate_meta_map_data
from .meta_types import (
    Coordinate,
    FilterConfig,
    DataPoint,
    MapData,
    ValidationResult,
)

# 工具函数

# 版本信息
__version__ = "0.5.0"
__author__ = "ai-map"

# 导出的公共接口
__all__ = [
    'Coordinate',
    'FilterConfig',
    'DataPoint',
    'MapData',
    'ValidationResult',
    'validate_for_backend',
    'validate_meta_map_data',
]
