"""
Meta Map 数据验证器
"""

import re
from typing import Any, Dict, List
from urllib.parse import urlparse

try:
    from .meta_types import ValidationResult, Coordinate, DataPoint, MapData
except ImportError:
    from meta_types import ValidationResult, Coordinate, DataPoint, MapData


def validate_coordinate(coord: Dict[str, Any]) -> List[str]:
    """验证坐标是否有效"""
    errors = []
    
    if not isinstance(coord, dict):
        errors.append("坐标必须是字典类型")
        return errors
    
    if 'lat' not in coord:
        errors.append("缺少纬度 (lat)")
    elif not isinstance(coord['lat'], (int, float)) or coord['lat'] < -90 or coord['lat'] > 90:
        errors.append("纬度必须是 -90 到 90 之间的数字")
    
    if 'lng' not in coord:
        errors.append("缺少经度 (lng)")
    elif not isinstance(coord['lng'], (int, float)) or coord['lng'] < -180 or coord['lng'] > 180:
        errors.append("经度必须是 -180 到 180 之间的数字")
    
    return errors


def validate_data_point(point: Dict[str, Any], index: int) -> List[str]:
    """验证数据点是否有效"""
    errors = []
    prefix = f"数据点 {index + 1}: "
    
    if not isinstance(point, dict):
        errors.append(prefix + "数据点必须是字典类型")
        return errors
    
    # 验证必需字段
    if 'name' not in point or not isinstance(point['name'], str) or not point['name'].strip():
        errors.append(prefix + "名称不能为空")
    
    if 'address' not in point or not isinstance(point['address'], str) or not point['address'].strip():
        errors.append(prefix + "地址不能为空")
    
    if 'intro' not in point or not isinstance(point['intro'], str) or not point['intro'].strip():
        errors.append(prefix + "简介不能为空")
    
    if 'center' not in point:
        errors.append(prefix + "坐标不能为空")
    else:
        coord_errors = validate_coordinate(point['center'])
        errors.extend([prefix + err for err in coord_errors])
    
    # 验证可选字段
    if 'tags' in point and not isinstance(point['tags'], list):
        errors.append(prefix + "标签必须是数组")
    elif 'tags' in point and isinstance(point['tags'], list):
        for i, tag in enumerate(point['tags']):
            if not isinstance(tag, str):
                errors.append(prefix + f"标签 {i + 1} 必须是字符串")
    
    if 'webLink' in point and isinstance(point['webLink'], str):
        try:
            parsed = urlparse(point['webLink'])
            if not all([parsed.scheme, parsed.netloc]):
                errors.append(prefix + "网页链接格式无效")
        except Exception:
            errors.append(prefix + "网页链接格式无效")
    
    return errors


def validate_map_data(data: Any) -> ValidationResult:
    """验证地图数据是否符合规范"""
    errors = []
    
    # 基础类型检查
    if not isinstance(data, dict):
        return ValidationResult(valid=False, errors=["数据必须是字典类型"])
    
    # 必需字段检查
    if 'name' not in data or not isinstance(data['name'], str) or not data['name'].strip():
        errors.append("地图名称不能为空")
    
    if 'center' not in data:
        errors.append("地图中心坐标不能为空")
    else:
        coord_errors = validate_coordinate(data['center'])
        errors.extend([f"地图中心: {err}" for err in coord_errors])
    
    if 'data' not in data or not isinstance(data['data'], list):
        errors.append("数据点列表必须是数组")
    else:
        # 验证每个数据点
        for index, point in enumerate(data['data']):
            point_errors = validate_data_point(point, index)
            errors.extend(point_errors)
    
    # 可选字段检查
    if 'zoom' in data:
        if not isinstance(data['zoom'], list) or len(data['zoom']) != 3:
            errors.append("缩放配置必须是包含3个数字的数组")
        else:
            for i, zoom in enumerate(data['zoom']):
                if not isinstance(zoom, int) or zoom < 1 or zoom > 20:
                    errors.append(f"缩放级别 {i + 1} 必须是 1-20 之间的整数")
    
    if 'filter' in data and data['filter'] is not None:
        if not isinstance(data['filter'], dict):
            errors.append("过滤器配置必须是字典类型")
        else:
            filter_config = data['filter']
            for filter_type in ['inclusive', 'exclusive']:
                if filter_type in filter_config:
                    if not isinstance(filter_config[filter_type], dict):
                        errors.append(f"{filter_type} 过滤器必须是字典类型")
                    else:
                        for key, value in filter_config[filter_type].items():
                            if not isinstance(value, list):
                                errors.append(f"{filter_type} 过滤器中的 {key} 必须是数组")
                            elif not all(isinstance(item, str) for item in value):
                                errors.append(f"{filter_type} 过滤器中的 {key} 数组元素必须都是字符串")
    
    return ValidationResult(
        valid=len(errors) == 0,
        errors=errors if errors else None
    )


def validate_new_data_point(point: Dict[str, Any]) -> ValidationResult:
    """验证新数据点是否可以添加"""
    errors = []
    
    if not isinstance(point, dict):
        return ValidationResult(valid=False, errors=["数据点必须是字典类型"])
    
    if 'name' not in point or not isinstance(point['name'], str) or not point['name'].strip():
        errors.append("名称不能为空")
    
    if 'address' not in point or not isinstance(point['address'], str) or not point['address'].strip():
        errors.append("地址不能为空")
    
    if 'intro' not in point or not isinstance(point['intro'], str) or not point['intro'].strip():
        errors.append("简介不能为空")
    
    if 'center' not in point:
        errors.append("坐标不能为空")
    else:
        coord_errors = validate_coordinate(point['center'])
        errors.extend(coord_errors)
    
    # 验证可选字段
    if 'tags' in point and not isinstance(point['tags'], list):
        errors.append("标签必须是数组")
    
    if 'webLink' in point and isinstance(point['webLink'], str):
        try:
            parsed = urlparse(point['webLink'])
            if not all([parsed.scheme, parsed.netloc]):
                errors.append("网页链接格式无效")
        except Exception:
            errors.append("网页链接格式无效")
    
    return ValidationResult(
        valid=len(errors) == 0,
        errors=errors if errors else None
    )


def validate_for_backend(data: Any) -> ValidationResult:
    """
    为后端API优化的验证函数
    提供更详细的错误信息和额外的检查
    """
    # 先进行基础验证
    basic_result = validate_map_data(data)
    if not basic_result.valid:
        return basic_result
    
    # 额外的后端特定检查
    additional_errors = []
    
    # 检查数据点数量限制
    if isinstance(data, dict) and 'data' in data:
        data_points = data['data']
        if len(data_points) > 1000:  # 限制数据点数量
            additional_errors.append(f"数据点数量不能超过1000个，当前有{len(data_points)}个")
        
        # 检查重复的名称
        names = [point.get('name', '').strip() for point in data_points if isinstance(point, dict) and point.get('name', '').strip()]
        if len(names) != len(set(names)):
            additional_errors.append("数据点名称不能重复")
    
    # 检查地图名称长度
    if isinstance(data, dict) and 'name' in data:
        name = data['name']
        if len(name) > 200:
            additional_errors.append(f"地图名称不能超过200个字符，当前{len(name)}个字符")
    
    if additional_errors:
        all_errors = (basic_result.errors or []) + additional_errors
        return ValidationResult(valid=False, errors=all_errors)
    
    return basic_result 