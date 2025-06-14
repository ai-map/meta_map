import {
  Cluster,
  ClusterBasePoint,
  ClusterManager,
  ClusterOptions,
} from "./cluster_manager";

/**
 * 层次聚类管理器实现
 * 使用自上而下的层次聚类算法，递归地将地理点划分为更小的聚类
 */
export class HierarchicalClusterManager<
  T extends ClusterBasePoint = ClusterBasePoint
> extends ClusterManager<T> {
  /**
   * 执行层次聚类算法
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

    const { minPoints = 2 } = options;

    // 如果点数太少，直接返回单个聚类
    if (points.length < minPoints) {
      if (points.length === 1) {
        return [
          {
            center: { ...points[0] },
            points: [...points],
            radius: 0,
            id: this.generateSingleClusterId(),
          },
        ];
      }

      const center = this.calculateClusterCenter(points);
      return [
        {
          center,
          points: [...points],
          radius: this.calculateClusterRadius(points, center),
          id: this.generateClusterId(),
        },
      ];
    }

    // 开始层次聚类
    return this.divideAndCluster(points, options, 0);
  }

  /**
   * 递归地将点集合分割为更小的聚类
   * @param points 当前点集合
   * @param options 聚类选项
   * @param depth 递归深度
   * @returns 聚类结果
   */
  private divideAndCluster(
    points: T[],
    options: ClusterOptions,
    depth: number
  ): Cluster<T>[] {
    const { radius = 80, minPoints = 2, maxZoom = 18 } = options;

    // 如果点数量小于最小阈值或达到最大递归深度，返回单个聚类
    if (points.length < minPoints || depth >= maxZoom) {
      const center = this.calculateClusterCenter(points);
      return [
        {
          center,
          points: [...points],
          radius: this.calculateClusterRadius(points, center),
          id: this.generateClusterId(),
        },
      ];
    }

    // 计算当前点集的地理边界框
    const bounds = this.calculateGeoBounds(points);

    // 确定分割轴（选择更长的边作为分割轴，考虑经度和纬度的跨度差异）
    // 对于跨度较大的区域，应考虑经度在不同纬度的实际距离差异
    const latSpan = bounds.maxLat - bounds.minLat;
    const lonSpan = bounds.maxLon - bounds.minLon;

    // 估算经度和纬度跨度的实际地理距离
    const centerLat = (bounds.minLat + bounds.maxLat) / 2;
    const latDistance = this.metersToLatitude(1000); // 1公里对应的纬度差
    const lonDistance = this.metersToLongitude(1000, centerLat); // 1公里在当前纬度对应的经度差

    const normalizedLonSpan = lonSpan / lonDistance;
    const normalizedLatSpan = latSpan / latDistance;

    const splitAxis = normalizedLonSpan > normalizedLatSpan ? "x" : "y";

    // 将点按分割轴排序
    const sortedPoints = [...points].sort(
      (a, b) => a[splitAxis] - b[splitAxis]
    );

    // 分割点集为两部分
    const mid = Math.floor(sortedPoints.length / 2);
    const leftPoints = sortedPoints.slice(0, mid);
    const rightPoints = sortedPoints.slice(mid);

    // 递归地聚类两部分
    const leftClusters = this.divideAndCluster(leftPoints, options, depth + 1);
    const rightClusters = this.divideAndCluster(
      rightPoints,
      options,
      depth + 1
    );

    // 合并结果
    const clusters = [...leftClusters, ...rightClusters];

    // 尝试合并距离相近的聚类
    return this.mergeClusters(clusters, radius);
  }

  /**
   * 合并距离相近的聚类
   * @param clusters 聚类列表
   * @param maxDistance 最大合并距离（米）
   * @returns 合并后的聚类列表
   */
  private mergeClusters(
    clusters: Cluster<T>[],
    maxDistance: number
  ): Cluster<T>[] {
    if (clusters.length <= 1) {
      return clusters;
    }

    const result: Cluster<T>[] = [];
    const processed = new Set<Cluster<T>>();

    for (let i = 0; i < clusters.length; i++) {
      if (processed.has(clusters[i])) {continue;}

      let currentCluster = clusters[i];
      processed.add(currentCluster);

      let merged = true;

      while (merged) {
        merged = false;

        for (let j = 0; j < clusters.length; j++) {
          if (processed.has(clusters[j])) {continue;}

          // 计算两个聚类中心之间的地理距离（米）
          const distance = this.calculateHaversineDistance(
            currentCluster.center,
            clusters[j].center
          );

          // 如果距离小于阈值，合并聚类
          if (distance <= maxDistance) {
            // 合并点
            const mergedPoints = [
              ...currentCluster.points,
              ...clusters[j].points,
            ];
            // 计算新的中心点
            const center = this.calculateClusterCenter(mergedPoints);

            // 创建新的聚类
            currentCluster = {
              center,
              points: mergedPoints,
              radius: this.calculateClusterRadius(mergedPoints, center),
              id: this.generateMergedClusterId(),
            };

            processed.add(clusters[j]);
            merged = true;
            break;
          }
        }
      }

      result.push(currentCluster);
    }

    return result;
  }

  /**
   * 计算点集合的地理边界框
   * @param points 点集合
   * @returns 边界框（最小/最大经纬度）
   */
  private calculateGeoBounds(points: T[]): {
    minLon: number;
    minLat: number;
    maxLon: number;
    maxLat: number;
    width: number;
    height: number;
  } {
    if (points.length === 0) {
      return {
        minLon: 0,
        minLat: 0,
        maxLon: 0,
        maxLat: 0,
        width: 0,
        height: 0,
      };
    }

    let minLon = points[0].x;
    let minLat = points[0].y;
    let maxLon = points[0].x;
    let maxLat = points[0].y;

    for (const point of points) {
      minLon = Math.min(minLon, point.x);
      minLat = Math.min(minLat, point.y);
      maxLon = Math.max(maxLon, point.x);
      maxLat = Math.max(maxLat, point.y);
    }

    // 计算边界框的经纬度差
    const width = maxLon - minLon;
    const height = maxLat - minLat;

    return {
      minLon,
      minLat,
      maxLon,
      maxLat,
      width,
      height,
    };
  }

  /**
   * 计算聚类的半径
   * @param points 聚类中的点
   * @param center 聚类中心
   * @returns 聚类半径（米）
   */
  private calculateClusterRadius(points: T[], center: T): number {
    if (points.length <= 1) {
      return 0;
    }

    // 计算最大地理距离作为半径（米）
    let maxDistance = 0;
    for (const point of points) {
      const distance = this.calculateHaversineDistance(center, point);
      maxDistance = Math.max(maxDistance, distance);
    }

    return maxDistance;
  }
}
