/**
 * 抽象聚类管理器
 * 实现类似于Leaflet markercluster的功能，但不依赖特定框架、DOM，不实现任何绑定事件
 */

/**
 * 坐标系统枚举
 */
export enum CoordinateSystem {
  WGS84 = "wgs84", // 标准GPS坐标系统
  GCJ02 = "gcj02", // 中国国测局坐标系统(火星坐标)
  BD09 = "bd09", // 百度坐标系统
}

/**
 * 点对象接口
 * x 对应经度(longitude)，y 对应纬度(latitude)
 */
export interface ClusterBasePoint {
  x: number; // 经度 (longitude)
  y: number; // 纬度 (latitude)
  weight?: number;
  data?: any;
  id?: string | number; // 用于唯一标识点
}

/**
 * 聚类选项接口
 */
export interface ClusterOptions {
  radius?: number; // 聚类半径，单位：米
  maxZoom?: number; // 最大缩放级别，超过此级别不聚类
  minPoints?: number; // 形成聚类的最小点数
  weightFactor?: number; // 点权重因子
  coordinateSystem?: CoordinateSystem; // 坐标系统
}

/**
 * 聚类对象接口
 */
export interface Cluster<T extends ClusterBasePoint = ClusterBasePoint> {
  center: T;
  points: T[];
  radius: number;
  id?: string | number;
}

// 地球半径，单位：千米
export const EARTH_RADIUS = 6371.0;

/**
 * 抽象聚类管理器类
 */
export abstract class ClusterManager<
  T extends ClusterBasePoint = ClusterBasePoint
> {
  protected points: T[] = [];
  protected clusters: Cluster<T>[] = [];
  protected options: ClusterOptions;

  /**
   * 构造函数
   * @param options 聚类选项
   */
  constructor(options: ClusterOptions = {}) {
    this.options = {
      radius: 80,
      maxZoom: 18,
      minPoints: 2,
      weightFactor: 1,
      coordinateSystem: CoordinateSystem.WGS84,
      ...options,
    };
  }

  /**
   * 更新聚类（统一接口）
   * @param points 可选的点对象数组，如果提供则更新点数据
   * @param options 可选的聚类选项，用于覆盖默认选项
   * @returns 聚类结果
   */
  public updateClusters(
    points?: T[],
    options?: Partial<ClusterOptions>
  ): Cluster<T>[] {
    // 如果提供了新的点数据，则更新点数据
    if (points !== undefined) {
      this.points = [...points];
    }

    // 如果提供了新的选项，则更新选项
    if (options) {
      this.options = { ...this.options, ...options };
    }

    this.clusters = this.performClustering(this.points, this.options);
    return [...this.clusters];
  }

  /**
   * @deprecated 使用 updateClusters(points) 代替
   * 更新所有点数据
   * @param points 点对象数组
   */
  public updatePoints(points: T[]): Cluster<T>[] {
    return this.updateClusters(points);
  }

  /**
   * 计算两点之间的球面距离（Haversine公式）
   * @param p1 点1
   * @param p2 点2
   * @returns 距离（米）
   */
  protected calculateHaversineDistance(
    p1: ClusterBasePoint,
    p2: ClusterBasePoint
  ): number {
    // 转换为弧度
    const lat1 = (p1.y * Math.PI) / 180;
    const lon1 = (p1.x * Math.PI) / 180;
    const lat2 = (p2.y * Math.PI) / 180;
    const lon2 = (p2.x * Math.PI) / 180;

    // Haversine公式
    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    // 地球半径（千米）* 弧度 = 距离（千米）
    return EARTH_RADIUS * c * 1000; // 转换为米
  }

  /**
   * 坐标系转换（如需使用，子类可以实现）
   * @param point 原始点
   * @param from 源坐标系
   * @param to 目标坐标系
   * @returns 转换后的点
   */
  protected convertCoordinateSystem(
    point: ClusterBasePoint,
    from: CoordinateSystem,
    to: CoordinateSystem
  ): ClusterBasePoint {
    // 如果坐标系相同，直接返回原始点
    if (from === to) {
      return { ...point };
    }

    // 实际应用中需要根据不同坐标系实现转换逻辑
    console.warn("Coordinate system conversion not implemented");
    return { ...point };
  }

  /**
   * 执行聚类算法
   * 这是一个抽象方法，需要由子类实现
   * @param points 需要聚类的点
   * @param options 聚类选项
   * @returns 聚类结果
   */
  protected abstract performClustering(
    points: T[],
    options: ClusterOptions
  ): Cluster<T>[];

  /**
   * 计算聚类中心
   * 默认实现为点的加权平均位置，子类可以覆盖此方法
   * @param points 聚类中的点
   * @returns 聚类中心点
   */
  protected calculateClusterCenter(points: T[]): T {
    if (points.length === 0) {
      throw new Error("Cannot calculate center of empty points array");
    }

    if (points.length === 1) {
      return { ...points[0] };
    }

    let sumX = 0;
    let sumY = 0;
    let totalWeight = 0;

    for (const point of points) {
      const weight = point.weight || 1;
      sumX += point.x * weight;
      sumY += point.y * weight;
      totalWeight += weight;
    }

    // 创建一个新的中心点对象，复制第一个点的数据结构
    const center = { ...points[0] };
    center.x = sumX / totalWeight;
    center.y = sumY / totalWeight;
    // 数据可以设置为null，或者包含聚类的元信息
    center.data = { count: points.length };

    return center;
  }

  /**
   * 将米转换为纬度差
   * @param meters 距离（米）
   * @returns 纬度差（度）
   */
  protected metersToLatitude(meters: number): number {
    return (meters / (EARTH_RADIUS * 1000)) * (180 / Math.PI);
  }

  /**
   * 将米转换为经度差
   * @param meters 距离（米）
   * @param latitude 当前纬度（度）
   * @returns 经度差（度）
   */
  protected metersToLongitude(meters: number, latitude: number): number {
    const latRad = latitude * (Math.PI / 180);
    return (
      (meters / (EARTH_RADIUS * 1000 * Math.cos(latRad))) * (180 / Math.PI)
    );
  }
}
