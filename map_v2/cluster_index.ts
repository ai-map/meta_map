/**
 * 聚类管理器索引文件
 * 导出所有聚类管理器相关功能，方便统一引用
 */

// 导出基础抽象类和接口
export * from './cluster_manager';

// 导出密度聚类实现
export * from './density_cluster';

/**
 * 聚类管理器工厂函数类型
 */
export enum ClusterType {
  DENSITY = 'density',  // 基于密度的聚类
}

/**
 * 聚类管理器工厂函数
 * 根据提供的类型创建相应的聚类管理器实例
 * 
 * @param type 聚类类型
 * @param options 聚类选项
 * @returns 聚类管理器实例
 */
import { ClusterManager, ClusterOptions, Point, CoordinateSystem } from './cluster_manager';
import { DensityClusterManager } from './density_cluster';

export function createClusterManager<T extends Point = Point>(
  type: ClusterType = ClusterType.DENSITY,
  options?: ClusterOptions
): ClusterManager<T> {
  switch (type) {
    case ClusterType.DENSITY:
    default:
      return new DensityClusterManager<T>(options);
  }
} 