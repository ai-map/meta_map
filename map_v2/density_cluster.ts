import { ClusterManager, ClusterOptions, Point, Cluster, EARTH_RADIUS } from './cluster_manager';

/**
 * 基于密度的聚类管理器实现
 * 使用DBSCAN算法思想，通过地理距离密度连接形成聚类
 */
export class DensityClusterManager<T extends Point = Point> extends ClusterManager<T> {
  /**
   * 执行基于密度的聚类算法（类似DBSCAN）
   * @param points 需要聚类的点
   * @param options 聚类选项
   * @returns 聚类结果
   */
  protected performClustering(points: T[], options: ClusterOptions): Cluster<T>[] {
    if (points.length === 0) {
      return [];
    }

    const { radius = 80, minPoints = 3 } = options;
    
    // 点的状态：0=未处理，1=已处理（在聚类中），-1=噪声点
    const pointStatus = new Map<T, number>();
    points.forEach(p => pointStatus.set(p, 0));
    
    const clusters: Cluster<T>[] = [];
    let currentClusterId = 0;

    // 遍历所有点
    for (const point of points) {
      // 如果点已经处理过，跳过
      if (pointStatus.get(point) !== 0) {
        continue;
      }

      // 获取邻域点
      const neighbors = this.getNeighbors(point, points, radius);
      
      // 如果邻域点数量小于最小点数，标记为噪声点
      if (neighbors.length < minPoints) {
        pointStatus.set(point, -1);
        continue;
      }
      
      // 否则，创建一个新的聚类
      const currentClusterPoints: T[] = [point];
      pointStatus.set(point, 1);
      
      // 处理每个邻域点
      let i = 0;
      while (i < neighbors.length) {
        const neighbor = neighbors[i];
        
        // 如果是噪声点，将其添加到当前聚类
        if (pointStatus.get(neighbor) === -1) {
          pointStatus.set(neighbor, 1);
          currentClusterPoints.push(neighbor);
        } 
        // 如果尚未处理，将其添加到当前聚类并获取邻域
        else if (pointStatus.get(neighbor) === 0) {
          pointStatus.set(neighbor, 1);
          currentClusterPoints.push(neighbor);
          
          // 获取当前邻域点的邻域
          const neighborNeighbors = this.getNeighbors(neighbor, points, radius);
          
          // 如果邻域点数量满足密度要求，扩展当前邻域
          if (neighborNeighbors.length >= minPoints) {
            // 将新的邻域点合并到当前处理队列
            for (const nn of neighborNeighbors) {
              if (!neighbors.includes(nn)) {
                neighbors.push(nn);
              }
            }
          }
        }
        
        i++;
      }
      
      // 创建聚类对象
      const center = this.calculateClusterCenter(currentClusterPoints);
      const clusterRadius = this.calculateClusterRadius(currentClusterPoints, center);
      
      const cluster: Cluster<T> = {
        center,
        points: currentClusterPoints,
        radius: clusterRadius,
        id: `cluster_${currentClusterId++}`
      };
      
      clusters.push(cluster);
    }
    
    // 处理噪声点为单点聚类
    for (const [point, status] of pointStatus.entries()) {
      if (status === -1) {
        const singlePointCluster: Cluster<T> = {
          center: { ...point },
          points: [point],
          radius: 0,
          id: `noise_${currentClusterId++}`
        };
        
        clusters.push(singlePointCluster);
      }
    }

    return clusters;
  }

  /**
   * 获取指定点的邻域点
   * @param centerPoint 中心点
   * @param allPoints 所有点
   * @param radius 邻域半径（米）
   * @returns 邻域内的点数组
   */
  private getNeighbors(centerPoint: T, allPoints: T[], radius: number): T[] {
    return allPoints.filter(point => {
      if (point === centerPoint) return false;
      return this.calculateHaversineDistance(centerPoint, point) <= radius;
    });
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
    
    // 计算聚类中所有点到中心点的最大距离
    return Math.max(...points.map(point => this.calculateHaversineDistance(center, point)));
  }
  
  /**
   * 重写聚类中心计算方法，使用加权平均
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
    
    // 对于地理坐标，简单的加权平均可能不准确
    // 对于小区域，这种方法足够，对于跨越大区域的点，应使用更复杂的方法
    let sumX = 0;
    let sumY = 0;
    let totalWeight = 0;
    
    for (const point of points) {
      // 使用点的权重，默认为1
      const weight = point.weight || 1;
      sumX += point.x * weight;
      sumY += point.y * weight;
      totalWeight += weight;
    }
    
    // 创建一个新的中心点对象
    const center = { ...points[0] };
    center.x = sumX / totalWeight;
    center.y = sumY / totalWeight;
    center.data = { 
      count: points.length,
      // 可以在这里添加额外的聚类元数据
      density: points.length / this.calculateClusterArea(points, center)
    };
    
    return center;
  }
  
  /**
   * 计算聚类的面积
   * 注意：这是一个简化的估算，对于小区域是合理的
   * @param points 聚类中的点
   * @param center 聚类中心
   * @returns 聚类面积（平方米）
   */
  private calculateClusterArea(points: T[], center: T): number {
    if (points.length <= 1) {
      return 0;
    }
    
    const radius = this.calculateClusterRadius(points, center);
    // 使用圆面积公式: π * r²
    return Math.PI * radius * radius;
  }
} 