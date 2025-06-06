"""
Meta Map Utils - Python 版本
统一地图数据格式工具库
"""

from .meta_map import MetaMap
from .validator import validate_map_data, validate_new_data_point
from .meta_types import (
    Coordinate,
    FilterConfig,
    DataPoint,
    MapData,
    ValidationResult,
    MapStatistics,
    FilterCriteria
)

# 工具函数
def calculate_distance(coord1: dict, coord2: dict) -> float:
    """计算两点之间的距离（千米）"""
    return MetaMap.calculate_distance(coord1, coord2)

def create_empty_map_data(name: str, center: dict) -> dict:
    """创建空的地图数据模板"""
    return {
        'name': name,
        'center': center,
        'data': []
    }

# 版本信息
__version__ = "1.0.0"
__author__ = "Meta Map Team"

# 导出的公共接口
__all__ = [
    'MetaMap',
    'validate_map_data',
    'validate_new_data_point',
    'calculate_distance',
    'create_empty_map_data',
    'Coordinate',
    'FilterConfig',
    'DataPoint',
    'MapData',
    'ValidationResult',
    'MapStatistics',
    'FilterCriteria'
] 