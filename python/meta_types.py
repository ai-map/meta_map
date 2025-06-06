"""
Meta Map 数据类型定义
"""

from typing import Dict, List, Optional, TypedDict, Union
from dataclasses import dataclass


class Coordinate(TypedDict):
    """坐标类型"""
    lat: float
    lng: float


class FilterConfig(TypedDict, total=False):
    """过滤器配置类型"""
    inclusive: Optional[Dict[str, List[str]]]
    exclusive: Optional[Dict[str, List[str]]]


class DataPoint(TypedDict, total=False):
    """地图数据点类型"""
    name: str
    address: str
    phone: Optional[str]
    webName: Optional[str]
    webLink: Optional[str]
    intro: str
    tags: Optional[List[str]]
    center: Coordinate


class MapData(TypedDict, total=False):
    """地图数据类型"""
    id: Optional[str]
    name: str
    description: Optional[str]
    origin: Optional[str]
    center: Coordinate
    zoom: Optional[List[int]]  # [默认, 最小, 最大]
    filter: Optional[FilterConfig]
    data: List[DataPoint]


@dataclass
class ValidationResult:
    """验证结果"""
    valid: bool
    errors: Optional[List[str]] = None


@dataclass
class MapStatistics:
    """地图统计信息"""
    total_points: int
    tags: Dict[str, int]
    coordinates: Dict[str, float]  # northernmost, southernmost, easternmost, westernmost


class FilterCriteria(TypedDict, total=False):
    """过滤条件"""
    tags: Optional[List[str]]
    name: Optional[str]
    address: Optional[str] 