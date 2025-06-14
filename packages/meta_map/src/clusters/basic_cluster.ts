import {
  Cluster,
  ClusterBasePoint,
  ClusterManager,
  ClusterOptions,
} from "./cluster_manager";

/**
 * 基础聚类管理器 - 简单的距离聚类
 * 当两个点之间的距离小于10米时会进行聚类
 * 提供最基础的聚类功能，适合简单场景使用
 */
export class BasicClusterManager<
  T extends ClusterBasePoint = ClusterBasePoint
> extends ClusterManager<T> {
  constructor(options: ClusterOptions = {}) {
    super(options);
  }

  /**
   * 执行基础聚类算法 - 当两个点之间距离小于10米时进行聚类
   * @param points 需要聚类的点
   * @param options 聚类选项（在此实现中被忽略）
   * @returns 聚类结果
   */
  protected performClustering(
    points: T[],
    _options: ClusterOptions
  ): Cluster<T>[] {
    console.log("🏗️ 使用基础聚类管理器 - 距离小于10米时聚类", {
      points: points.length,
    });

    if (points.length === 0) {
      return [];
    }

    const clusters: Cluster<T>[] = [];
    const processed = new Set<number>(); // 记录已处理的点的索引
    const CLUSTER_DISTANCE = 10; // 10米

    for (let i = 0; i < points.length; i++) {
      if (processed.has(i)) {
        continue; // 如果这个点已经被处理过，跳过
      }

      const currentPoint = points[i];
      const clusterPoints: T[] = [currentPoint];
      processed.add(i);

      // 查找距离当前点小于10米的其他点
      for (let j = i + 1; j < points.length; j++) {
        if (processed.has(j)) {
          continue; // 如果这个点已经被处理过，跳过
        }

        const otherPoint = points[j];
        const distance = this.calculateHaversineDistance(
          currentPoint,
          otherPoint
        );

        if (distance < CLUSTER_DISTANCE) {
          clusterPoints.push(otherPoint);
          processed.add(j);
        }
      }

      // 创建聚类
      if (clusterPoints.length === 1) {
        // 单独的点
        clusters.push({
          center: { ...currentPoint },
          points: clusterPoints,
          radius: 0,
          id: this.generateSingleClusterId(),
        });
      } else {
        // 聚类（多个点）
        const center = this.calculateClusterCenter(clusterPoints);
        clusters.push({
          center,
          points: clusterPoints,
          radius: CLUSTER_DISTANCE, // 使用聚类距离作为半径
          id: this.generateClusterId(),
        });
      }
    }

    console.log(
      `🏗️ 基础聚类完成: ${points.length} 个点 -> ${clusters.length} 个聚类`
    );
    return clusters;
  }

  /**
   * 重写计算聚类中心方法
   * 计算聚类中所有点的重心
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

    // 计算所有点的重心
    let sumX = 0;
    let sumY = 0;
    let totalWeight = 0;

    for (const point of points) {
      const weight = point.weight || 1;
      sumX += point.x * weight;
      sumY += point.y * weight;
      totalWeight += weight;
    }

    // 创建中心点，复制第一个点的结构
    const center = { ...points[0] };
    center.x = sumX / totalWeight;
    center.y = sumY / totalWeight;
    center.data = { count: points.length, type: "basic_cluster" };

    return center;
  }
}
