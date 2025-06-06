/**
 * Meta Map Utils - TypeScript 版本
 * 统一地图数据格式工具库
 */

// 导出类型定义
export type {
  Coordinate,
  FilterConfig,
  DataPoint,
  MapData,
  ValidationResult,
  FilterCriteria,
  MapStatistics
} from './types';

// 导入类型用于内部使用
import type { MapData } from './types';

// 导出验证器
export {
  validateMapData,
  validateNewDataPoint
} from './validator';

// 导出核心类
export { MetaMap } from './meta-map';

// 工具函数
export const utils = {
  /**
   * 计算两点之间的距离（千米）
   */
  calculateDistance: (coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }): number => {
    const R = 6371; // 地球半径（千米）
    const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
    const dLon = (coord2.lng - coord1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  },

  /**
   * 生成随机坐标（用于测试）
   */
  generateRandomCoordinate: (center: { lat: number; lng: number }, radiusKm: number = 10) => {
    const radiusInDegrees = radiusKm / 111.32; // 大约1度 = 111.32公里
    const lat = center.lat + (Math.random() - 0.5) * 2 * radiusInDegrees;
    const lng = center.lng + (Math.random() - 0.5) * 2 * radiusInDegrees;
    return { lat, lng };
  },

  /**
   * 创建空的地图数据模板
   */
  createEmptyMapData: (name: string, center: { lat: number; lng: number }): MapData => ({
    name,
    center,
    data: []
  })
}; 