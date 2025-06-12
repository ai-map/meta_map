// 主要组件导出
export { default as MapViewer } from './components/MapViewer';

// 类型导出
export type {
  MapViewerProps,
  MapViewerRef,
  MetaMapData,
  DataPoint,
  MapPoint,
  Coordinate,
  Filter,
  FilterGroup,
  FilterState,
  FilterCriteria,
  ClusterPoint,
  ValidationResult,
  MapStatistics
} from './types';

export {
  ClusterAlgorithmType,
  CoordinateSystem
} from './types';

// 聚类工具导出
export {
  createClusterManager,
  mapPointToClusterItem,
  ClusterManager,
  DistanceClusterManager
} from './utils/clusterManager';

export type {
  Point,
  ClusterOptions,
  Cluster,
  ClusterItem
} from './utils/clusterManager';

// MetaMap 工具导出
export {
  MetaMap,
  metaMapUtils
} from './utils/metaMap';

// 验证器导出
export {
  validateNewDataPoint
} from './utils/validator'; 