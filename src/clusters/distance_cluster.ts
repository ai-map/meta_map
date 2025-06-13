import {
  Cluster,
  ClusterBasePoint,
  ClusterManager,
  ClusterOptions
} from "./cluster_manager";

/**
 * 基于距离的聚类管理器实现
 * 使用简单的距离聚类算法，将地理距离小于指定半径的点聚合在一起
 */
export class DistanceClusterManager<
  T extends ClusterBasePoint = ClusterBasePoint
> extends ClusterManager<T> {
  /**
   * 执行基于距离的聚类算法
   * @param points 需要聚类的点
   * @param options 聚类选项
   * @returns 聚类结果
   */
  protected performClustering(
    points: T[],
    options: ClusterOptions
  ): Cluster<T>[] {
    if (points.length === 0) {
      return [];
    }

    const { radius = 80, minPoints = 2 } = options;
    const clusters: Cluster<T>[] = [];
    const processedPoints: Set<T> = new Set();

    // 遍历所有点
    for (const point of points) {
      // 如果点已经被处理过，跳过
      if (processedPoints.has(point)) {
        continue;
      }

      // 找到当前点半径范围内的所有点
      const nearbyPoints = this.findNearbyPoints(
        point,
        points,
        radius,
        processedPoints
      );

      // 如果找到的点数量大于等于最小聚类点数，形成聚类
      if (nearbyPoints.length >= minPoints) {
        // 计算聚类中心
        const center = this.calculateClusterCenter(nearbyPoints);

        // 创建聚类
        const cluster: Cluster<T> = {
          center,
          points: nearbyPoints,
          radius: this.calculateClusterRadius(nearbyPoints, center),
          id: `cluster_${clusters.length}`,
        };

        clusters.push(cluster);

        // 标记所有聚类中的点为已处理
        nearbyPoints.forEach((p) => processedPoints.add(p));
      } else {
        // 如果点数量不足以形成聚类，创建单点聚类
        const singlePointCluster: Cluster<T> = {
          center: { ...point },
          points: [point],
          radius: 0,
          id: `single_${clusters.length}`,
        };

        clusters.push(singlePointCluster);
        processedPoints.add(point);
      }
    }

    return clusters;
  }

  /**
   * 查找指定点地理半径范围内的所有点
   * @param centerPoint 中心点
   * @param allPoints 所有点
   * @param radius 半径（米）
   * @param excludePoints 需要排除的点集合
   * @returns 半径范围内的点数组
   */
  private findNearbyPoints(
    centerPoint: T,
    allPoints: T[],
    radius: number,
    excludePoints: Set<T>
  ): T[] {
    const result: T[] = [];

    for (const point of allPoints) {
      // 排除已处理的点
      if (excludePoints.has(point)) {
        continue;
      }

      // 计算两点之间的地理距离（米）
      const distance = this.calculateHaversineDistance(centerPoint, point);

      // 如果距离小于半径，添加到结果中
      if (distance <= radius) {
        result.push(point);
      }
    }

    return result;
  }

  /**
   * 计算聚类的地理半径
   * @param points 聚类中的点
   * @param center 聚类中心
   * @returns 聚类地理半径（米）
   */
  private calculateClusterRadius(points: T[], center: T): number {
    if (points.length === 0) {
      return 0;
    }

    if (points.length === 1) {
      return 0;
    }

    // 计算聚类中所有点到中心点的最大地理距离
    let maxDistance = 0;

    for (const point of points) {
      const distance = this.calculateHaversineDistance(center, point);
      maxDistance = Math.max(maxDistance, distance);
    }

    return maxDistance;
  }
}

/**
 * 使用示例：
 *
 * // 创建一个基于距离的聚类管理器实例
 * const clusterManager = new DistanceClusterManager({
 *   radius: 100, // 100米的聚类半径
 *   minPoints: 3
 * });
 *
 * // 添加多个点（经纬度）
 * clusterManager.addPoints([
 *   { x: 116.397428, y: 39.90923, weight: 1 }, // 北京天安门
 *   { x: 116.398438, y: 39.91023, weight: 2 }, // 附近点1
 *   { x: 116.396418, y: 39.90823, weight: 1 }, // 附近点2
 *   { x: 121.473701, y: 31.230416, weight: 1 }, // 上海人民广场
 *   { x: 121.474701, y: 31.231416, weight: 1 }  // 附近点
 * ]);
 *
 * // 执行聚类
 * const clusters = clusterManager.updateClusters();
 *
 * // 监听聚类事件
 * clusterManager.on('cluster', (event) => {
 *   const clusters = event.payload.clusters;
 *   console.log(`聚类完成，共形成 ${clusters.length} 个聚类`);
 * });
 *
 * // 移除点
 * clusterManager.removePoint({ x: 116.397428, y: 39.90923 });
 *
 * // 更新聚类，使用新的参数（500米半径）
 * clusterManager.updateClusters({ radius: 500 });
 */
