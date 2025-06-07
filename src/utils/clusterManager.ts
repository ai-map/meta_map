/**
 * 聚类管理器 - React版本
 * 基于微信小程序版本转换而来
 */

import { MapPoint, CoordinateSystem, ClusterAlgorithmType } from '../types';

// 地球半径，单位：千米
export const EARTH_RADIUS = 6371.0;

// 聚类基础点接口
export interface Point {
  x: number;  // 经度 (longitude)
  y: number;  // 纬度 (latitude)
  weight?: number;
  data?: any;
  id?: string | number;
}

// 聚类选项接口
export interface ClusterOptions {
  radius?: number; // 聚类半径，单位：米
  maxZoom?: number; // 最大缩放级别，超过此级别不聚类
  minPoints?: number; // 形成聚类的最小点数
  weightFactor?: number; // 点权重因子
  coordinateSystem?: CoordinateSystem; // 坐标系统
}

// 聚类对象接口
export interface Cluster<T extends Point = Point> {
  center: T;
  points: T[];
  radius: number;
  id?: string | number;
}

// 聚类项目接口
export interface ClusterItem extends Point {
  id: string;
  name: string;
  point: MapPoint;
}

/**
 * 抽象聚类管理器类
 */
export abstract class ClusterManager<T extends Point = Point> {
  protected points: T[] = [];
  protected clusters: Cluster<T>[] = [];
  protected options: ClusterOptions;

  constructor(options: ClusterOptions = {}) {
    this.options = {
      radius: 80,
      maxZoom: 18,
      minPoints: 2,
      weightFactor: 1,
      coordinateSystem: CoordinateSystem.WGS84,
      ...options
    };
  }

  /**
   * 添加单个点
   */
  public addPoint(point: T): void {
    this.points.push(point);
  }

  /**
   * 批量添加多个点
   */
  public addPoints(points: T[]): void {
    this.points.push(...points);
  }

  /**
   * 移除指定点
   */
  public removePoint(pointOrId: T | string | number): void {
    const id = typeof pointOrId === 'object' ? pointOrId.id : pointOrId;
    
    if (id === undefined) {
      console.warn('Cannot remove point without ID');
      return;
    }
    
    const index = this.points.findIndex(p => p.id === id);
    if (index !== -1) {
      this.points.splice(index, 1);
    }
  }

  /**
   * 清除所有点
   */
  public clearPoints(): void {
    this.points = [];
    this.clusters = [];
  }

  /**
   * 更新聚类
   */
  public updateClusters(options?: Partial<ClusterOptions>): Cluster<T>[] {
    if (options) {
      this.options = { ...this.options, ...options };
    }
    
    this.clusters = this.performClustering(this.points, this.options);
    return [...this.clusters];
  }

  /**
   * 获取所有聚类
   */
  public getClusters(): Cluster<T>[] {
    return [...this.clusters];
  }

  /**
   * 根据ID查找点
   */
  public getPointById(id: string | number): T | undefined {
    return this.points.find(p => p.id === id);
  }

  /**
   * 计算两点间距离（Haversine公式）
   */
  protected calculateHaversineDistance(p1: Point, p2: Point): number {
    const lat1Rad = (p1.y * Math.PI) / 180;
    const lat2Rad = (p2.y * Math.PI) / 180;
    const deltaLatRad = ((p2.y - p1.y) * Math.PI) / 180;
    const deltaLngRad = ((p2.x - p1.x) * Math.PI) / 180;

    const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS * c * 1000; // 转换为米
  }

  /**
   * 抽象方法：执行聚类算法
   */
  protected abstract performClustering(points: T[], options: ClusterOptions): Cluster<T>[];

  /**
   * 计算聚类中心点
   */
  protected calculateClusterCenter(points: T[]): T {
    if (points.length === 0) {
      throw new Error('Cannot calculate center of empty cluster');
    }

    if (points.length === 1) {
      return { ...points[0] };
    }

    const totalWeight = points.reduce((sum, p) => sum + (p.weight || 1), 0);
    const centerX = points.reduce((sum, p) => sum + p.x * (p.weight || 1), 0) / totalWeight;
    const centerY = points.reduce((sum, p) => sum + p.y * (p.weight || 1), 0) / totalWeight;

    return {
      ...points[0],
      x: centerX,
      y: centerY,
      weight: totalWeight
    };
  }
}

/**
 * 距离聚类管理器
 */
export class DistanceClusterManager extends ClusterManager<ClusterItem> {
  protected performClustering(points: ClusterItem[], options: ClusterOptions): Cluster<ClusterItem>[] {
    if (points.length === 0) return [];

    const clusters: Cluster<ClusterItem>[] = [];
    const visited = new Set<string>();
    const radius = options.radius || 80;

    for (const point of points) {
      if (visited.has(point.id)) continue;

      const clusterPoints: ClusterItem[] = [point];
      visited.add(point.id);

      // 查找距离内的其他点
      for (const otherPoint of points) {
        if (visited.has(otherPoint.id)) continue;

        const distance = this.calculateHaversineDistance(point, otherPoint);
        if (distance <= radius) {
          clusterPoints.push(otherPoint);
          visited.add(otherPoint.id);
        }
      }

      // 如果聚类点数满足最小要求，创建聚类
      if (clusterPoints.length >= (options.minPoints || 2)) {
        const center = this.calculateClusterCenter(clusterPoints);
        clusters.push({
          center,
          points: clusterPoints,
          radius,
          id: `cluster_${clusters.length}`
        });
      } else {
        // 单个点也作为单点聚类
        clusterPoints.forEach(p => {
          clusters.push({
            center: p,
            points: [p],
            radius: 0,
            id: `single_${p.id}`
          });
        });
      }
    }

    return clusters;
  }
}

/**
 * 创建聚类管理器
 */
export function createClusterManager(
  type: ClusterAlgorithmType,
  options?: ClusterOptions
): ClusterManager<ClusterItem> | null {
  switch (type) {
    case ClusterAlgorithmType.DISTANCE:
      return new DistanceClusterManager(options);
    case ClusterAlgorithmType.NONE:
      return null;
    default:
      return new DistanceClusterManager(options);
  }
}

/**
 * 将MapPoint转换为ClusterItem
 */
export function mapPointToClusterItem(point: MapPoint, index: number): ClusterItem {
  return {
    id: `point_${index}`,
    name: point.name,
    x: point.longitude,
    y: point.latitude,
    point: point,
    data: point
  };
} 