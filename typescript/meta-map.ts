import { MapData, DataPoint, FilterCriteria, MapStatistics, ValidationResult } from './types';
import { validateMapData, validateNewDataPoint } from './validator';

/**
 * MetaMap 地图数据管理类
 */
export class MetaMap {
  private data: MapData;
  
  constructor(initialData: MapData) {
    const validation = validateMapData(initialData);
    if (!validation.valid) {
      throw new Error(`数据验证失败: ${validation.errors?.join(', ')}`);
    }
    this.data = JSON.parse(JSON.stringify(initialData)); // 深拷贝
  }
  
  /**
   * 获取地图基本信息
   */
  getMapInfo() {
    return {
      id: this.data.id,
      name: this.data.name,
      description: this.data.description,
      origin: this.data.origin,
      center: this.data.center,
      zoom: this.data.zoom,
      filter: this.data.filter
    };
  }
  
  /**
   * 获取所有数据点
   */
  getAllDataPoints(): DataPoint[] {
    return JSON.parse(JSON.stringify(this.data.data)); // 返回深拷贝
  }
  
  /**
   * 根据索引获取数据点
   */
  getDataPoint(index: number): DataPoint | null {
    if (index < 0 || index >= this.data.data.length) {
      return null;
    }
    return JSON.parse(JSON.stringify(this.data.data[index]));
  }
  
  /**
   * 添加数据点
   */
  addDataPoint(point: Omit<DataPoint, 'id'>): ValidationResult {
    const validation = validateNewDataPoint(point);
    if (!validation.valid) {
      return validation;
    }
    
    this.data.data.push({ ...point });
    return { valid: true };
  }
  
  /**
   * 更新数据点
   */
  updateDataPoint(index: number, point: Partial<DataPoint>): ValidationResult {
    if (index < 0 || index >= this.data.data.length) {
      return { valid: false, errors: ['索引超出范围'] };
    }
    
    const updatedPoint = { ...this.data.data[index], ...point };
    const validation = validateNewDataPoint(updatedPoint);
    if (!validation.valid) {
      return validation;
    }
    
    this.data.data[index] = updatedPoint;
    return { valid: true };
  }
  
  /**
   * 删除数据点
   */
  removeDataPoint(index: number): boolean {
    if (index < 0 || index >= this.data.data.length) {
      return false;
    }
    
    this.data.data.splice(index, 1);
    return true;
  }
  
  /**
   * 根据名称查找数据点
   */
  findDataPointByName(name: string): DataPoint[] {
    return this.data.data.filter(point => 
      point.name.toLowerCase().includes(name.toLowerCase())
    );
  }
  
  /**
   * 过滤数据点
   */
  filterData(criteria: FilterCriteria): DataPoint[] {
    return this.data.data.filter(point => {
      // 标签过滤
      if (criteria.tags && criteria.tags.length > 0) {
        if (!point.tags || !criteria.tags.some(tag => point.tags?.includes(tag))) {
          return false;
        }
      }
      
      // 名称过滤
      if (criteria.name && !point.name.toLowerCase().includes(criteria.name.toLowerCase())) {
        return false;
      }
      
      // 地址过滤
      if (criteria.address && !point.address.toLowerCase().includes(criteria.address.toLowerCase())) {
        return false;
      }
      
      // 其他自定义过滤条件
      for (const [key, value] of Object.entries(criteria)) {
        if (['tags', 'name', 'address'].includes(key)) continue;
        
        if (key in point) {
          const pointValue = (point as any)[key];
          if (typeof value === 'string' && typeof pointValue === 'string') {
            if (!pointValue.toLowerCase().includes(value.toLowerCase())) {
              return false;
            }
          } else if (pointValue !== value) {
            return false;
          }
        }
      }
      
      return true;
    });
  }
  
  /**
   * 获取所有标签及其使用次数
   */
  getTagStatistics(): Record<string, number> {
    const tagCounts: Record<string, number> = {};
    
    this.data.data.forEach(point => {
      if (point.tags) {
        point.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });
    
    return tagCounts;
  }
  
  /**
   * 获取地图统计信息
   */
  getStatistics(): MapStatistics {
    const coordinates = this.data.data.map(point => point.center);
    
    return {
      totalPoints: this.data.data.length,
      tags: this.getTagStatistics(),
      coordinates: {
        northernmost: Math.max(...coordinates.map(c => c.lat)),
        southernmost: Math.min(...coordinates.map(c => c.lat)),
        easternmost: Math.max(...coordinates.map(c => c.lng)),
        westernmost: Math.min(...coordinates.map(c => c.lng))
      }
    };
  }
  
  /**
   * 计算两点之间的距离（千米）
   */
  static calculateDistance(coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }): number {
    const R = 6371; // 地球半径（千米）
    const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
    const dLon = (coord2.lng - coord1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
  
  /**
   * 查找指定坐标附近的数据点
   */
  findNearbyPoints(center: { lat: number; lng: number }, radiusKm: number): DataPoint[] {
    return this.data.data.filter(point => {
      const distance = MetaMap.calculateDistance(center, point.center);
      return distance <= radiusKm;
    });
  }
  
  /**
   * 导出数据（返回深拷贝）
   */
  exportData(): MapData {
    return JSON.parse(JSON.stringify(this.data));
  }
  
  /**
   * 更新地图基本信息
   */
  updateMapInfo(info: Partial<Pick<MapData, 'name' | 'description' | 'origin' | 'center' | 'zoom' | 'filter'>>): ValidationResult {
    const updatedData = { ...this.data, ...info };
    const validation = validateMapData(updatedData);
    
    if (!validation.valid) {
      return validation;
    }
    
    Object.assign(this.data, info);
    return { valid: true };
  }
} 