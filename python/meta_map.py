"""
Meta Map 地图数据管理类
"""

import json
import math
from typing import Any, Dict, List, Optional, Union
from copy import deepcopy

from .meta_types import MapData, DataPoint, ValidationResult, MapStatistics, FilterCriteria
from .validator import validate_map_data, validate_new_data_point


class MetaMap:
    """Meta Map 地图数据管理类"""
    
    def __init__(self, initial_data: Dict[str, Any]):
        """初始化地图数据
        
        Args:
            initial_data: 地图初始数据
            
        Raises:
            ValueError: 当数据验证失败时
        """
        validation = validate_map_data(initial_data)
        if not validation.valid:
            raise ValueError(f"数据验证失败: {', '.join(validation.errors or [])}")
        
        self._data = deepcopy(initial_data)
    
    def get_map_info(self) -> Dict[str, Any]:
        """获取地图基本信息"""
        return {
            'id': self._data.get('id'),
            'name': self._data['name'],
            'description': self._data.get('description'),
            'origin': self._data.get('origin'),
            'center': self._data['center'],
            'zoom': self._data.get('zoom'),
            'filter': self._data.get('filter')
        }
    
    def get_all_data_points(self) -> List[Dict[str, Any]]:
        """获取所有数据点"""
        return deepcopy(self._data['data'])
    
    def get_data_point(self, index: int) -> Optional[Dict[str, Any]]:
        """根据索引获取数据点
        
        Args:
            index: 数据点索引
            
        Returns:
            数据点字典，如果索引无效则返回 None
        """
        if index < 0 or index >= len(self._data['data']):
            return None
        return deepcopy(self._data['data'][index])
    
    def add_data_point(self, point: Dict[str, Any]) -> ValidationResult:
        """添加数据点
        
        Args:
            point: 要添加的数据点
            
        Returns:
            验证结果
        """
        validation = validate_new_data_point(point)
        if not validation.valid:
            return validation
        
        self._data['data'].append(deepcopy(point))
        return ValidationResult(valid=True)
    
    def update_data_point(self, index: int, point: Dict[str, Any]) -> ValidationResult:
        """更新数据点
        
        Args:
            index: 要更新的数据点索引
            point: 更新的数据点信息（部分字段）
            
        Returns:
            验证结果
        """
        if index < 0 or index >= len(self._data['data']):
            return ValidationResult(valid=False, errors=['索引超出范围'])
        
        updated_point = {**self._data['data'][index], **point}
        validation = validate_new_data_point(updated_point)
        if not validation.valid:
            return validation
        
        self._data['data'][index] = updated_point
        return ValidationResult(valid=True)
    
    def remove_data_point(self, index: int) -> bool:
        """删除数据点
        
        Args:
            index: 要删除的数据点索引
            
        Returns:
            是否删除成功
        """
        if index < 0 or index >= len(self._data['data']):
            return False
        
        del self._data['data'][index]
        return True
    
    def find_data_point_by_name(self, name: str) -> List[Dict[str, Any]]:
        """根据名称查找数据点
        
        Args:
            name: 搜索的名称（模糊匹配）
            
        Returns:
            匹配的数据点列表
        """
        name_lower = name.lower()
        return [
            point for point in self._data['data']
            if name_lower in point['name'].lower()
        ]
    
    def filter_data(self, **criteria) -> List[Dict[str, Any]]:
        """过滤数据点
        
        Args:
            **criteria: 过滤条件
            
        Returns:
            过滤后的数据点列表
        """
        filtered_points = []
        
        for point in self._data['data']:
            should_include = True
            
            # 标签过滤
            if 'tags' in criteria and criteria['tags']:
                if not point.get('tags') or not any(tag in point['tags'] for tag in criteria['tags']):
                    should_include = False
                    continue
            
            # 名称过滤
            if 'name' in criteria and criteria['name']:
                if criteria['name'].lower() not in point['name'].lower():
                    should_include = False
                    continue
            
            # 地址过滤
            if 'address' in criteria and criteria['address']:
                if criteria['address'].lower() not in point['address'].lower():
                    should_include = False
                    continue
            
            # 其他自定义过滤条件
            for key, value in criteria.items():
                if key in ['tags', 'name', 'address']:
                    continue
                
                if key in point:
                    point_value = point[key]
                    if isinstance(value, str) and isinstance(point_value, str):
                        if value.lower() not in point_value.lower():
                            should_include = False
                            break
                    elif point_value != value:
                        should_include = False
                        break
            
            if should_include:
                filtered_points.append(point)
        
        return filtered_points
    
    def get_tag_statistics(self) -> Dict[str, int]:
        """获取所有标签及其使用次数"""
        tag_counts = {}
        
        for point in self._data['data']:
            if point.get('tags'):
                for tag in point['tags']:
                    tag_counts[tag] = tag_counts.get(tag, 0) + 1
        
        return tag_counts
    
    def get_statistics(self) -> Dict[str, Any]:
        """获取地图统计信息"""
        coordinates = [point['center'] for point in self._data['data']]
        
        if not coordinates:
            return {
                'total_points': 0,
                'tags': {},
                'coordinates': {
                    'northernmost': 0,
                    'southernmost': 0,
                    'easternmost': 0,
                    'westernmost': 0
                }
            }
        
        return {
            'total_points': len(self._data['data']),
            'tags': self.get_tag_statistics(),
            'coordinates': {
                'northernmost': max(c['lat'] for c in coordinates),
                'southernmost': min(c['lat'] for c in coordinates),
                'easternmost': max(c['lng'] for c in coordinates),
                'westernmost': min(c['lng'] for c in coordinates)
            }
        }
    
    @staticmethod
    def calculate_distance(coord1: Dict[str, float], coord2: Dict[str, float]) -> float:
        """计算两点之间的距离（千米）
        
        Args:
            coord1: 第一个坐标点
            coord2: 第二个坐标点
            
        Returns:
            距离（千米）
        """
        R = 6371  # 地球半径（千米）
        
        lat1_rad = math.radians(coord1['lat'])
        lat2_rad = math.radians(coord2['lat'])
        dlat = math.radians(coord2['lat'] - coord1['lat'])
        dlng = math.radians(coord2['lng'] - coord1['lng'])
        
        a = (math.sin(dlat / 2) * math.sin(dlat / 2) +
             math.cos(lat1_rad) * math.cos(lat2_rad) *
             math.sin(dlng / 2) * math.sin(dlng / 2))
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        return R * c
    
    def find_nearby_points(self, center: Dict[str, float], radius_km: float) -> List[Dict[str, Any]]:
        """查找指定坐标附近的数据点
        
        Args:
            center: 中心坐标
            radius_km: 搜索半径（千米）
            
        Returns:
            附近的数据点列表
        """
        nearby_points = []
        
        for point in self._data['data']:
            distance = self.calculate_distance(center, point['center'])
            if distance <= radius_km:
                nearby_points.append(point)
        
        return nearby_points
    
    def export_data(self) -> Dict[str, Any]:
        """导出数据（返回深拷贝）"""
        return deepcopy(self._data)
    
    def update_map_info(self, **info) -> ValidationResult:
        """更新地图基本信息
        
        Args:
            **info: 要更新的地图信息
            
        Returns:
            验证结果
        """
        updated_data = {**self._data, **info}
        validation = validate_map_data(updated_data)
        
        if not validation.valid:
            return validation
        
        self._data.update(info)
        return ValidationResult(valid=True)
    
    def to_json(self, indent: Optional[int] = None) -> str:
        """导出为JSON字符串
        
        Args:
            indent: JSON缩进空格数
            
        Returns:
            JSON字符串
        """
        return json.dumps(self._data, ensure_ascii=False, indent=indent)
    
    @classmethod
    def from_json(cls, json_str: str) -> 'MetaMap':
        """从JSON字符串创建MetaMap实例
        
        Args:
            json_str: JSON字符串
            
        Returns:
            MetaMap实例
            
        Raises:
            ValueError: JSON解析失败或数据验证失败
        """
        try:
            data = json.loads(json_str)
            return cls(data)
        except json.JSONDecodeError as e:
            raise ValueError(f"JSON解析失败: {e}")
    
    @classmethod
    def from_file(cls, file_path: str) -> 'MetaMap':
        """从文件创建MetaMap实例
        
        Args:
            file_path: 文件路径
            
        Returns:
            MetaMap实例
            
        Raises:
            ValueError: 文件读取失败或数据验证失败
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            return cls(data)
        except (IOError, json.JSONDecodeError) as e:
            raise ValueError(f"文件读取失败: {e}")
    
    def save_to_file(self, file_path: str, indent: Optional[int] = 2) -> None:
        """保存到文件
        
        Args:
            file_path: 文件路径
            indent: JSON缩进空格数
            
        Raises:
            IOError: 文件写入失败
        """
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(self._data, f, ensure_ascii=False, indent=indent) 