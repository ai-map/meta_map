import { ClusterAlgorithmType } from "../types";
import { BasicClusterManager } from "./basic_cluster";
import {
  ClusterBasePoint,
  ClusterManager,
  ClusterOptions,
} from "./cluster_manager";
import { DensityClusterManager } from "./density_cluster";
import { DistanceClusterManager } from "./distance_cluster";
import { HierarchicalClusterManager } from "./hierarchical_cluster";

export { BasicClusterManager } from "./basic_cluster";
export { ClusterManager } from "./cluster_manager";
export type { Cluster, ClusterBasePoint, ClusterOptions } from "./cluster_manager";
export { DensityClusterManager } from "./density_cluster";
export { DistanceClusterManager } from "./distance_cluster";
export { HierarchicalClusterManager } from "./hierarchical_cluster";

export function createClusterManager<
  T extends ClusterBasePoint = ClusterBasePoint
>(
  type: ClusterAlgorithmType = ClusterAlgorithmType.DENSITY,
  options?: ClusterOptions
): ClusterManager<T> {
  switch (type) {
    case ClusterAlgorithmType.DENSITY:
      return new DensityClusterManager<T>(options);
    case ClusterAlgorithmType.DISTANCE:
      return new DistanceClusterManager<T>(options);
    case ClusterAlgorithmType.HIERARCHICAL:
      return new HierarchicalClusterManager<T>(options);
    case ClusterAlgorithmType.BASIC:
      return new BasicClusterManager<T>(options);
    default:
      return new DensityClusterManager<T>(options);
  }
}
