"""
Meta Map 数据类型定义
"""

from dataclasses import dataclass
from typing import Dict, List, Optional, TypedDict


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
