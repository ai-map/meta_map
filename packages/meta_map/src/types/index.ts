/**
 * 地图数据相关类型定义
 * 基于 Meta Map 标准 Schema 定义
 */

// 坐标接口
export interface Coordinate {
  lat: number;
  lng: number;
}

// 标准数据点接口 (基于 Schema)
export interface DataPoint {
  name: string;
  address: string;
  phone?: string;
  webName?: string;
  webLink?: string;
  intro: string;
  tags?: string[];
  center: Coordinate;
}

export interface Filter {
  inclusive: Record<string, Record<string, boolean>>;
  exclusive: Record<string, Record<string, boolean>>;
}

export interface MetaMapData {
  id: string;
  name: string;
  description: string;
  origin: string;
  center: Coordinate;
  zoom: number;
  filter?: Filter;
  data: DataPoint[];
}

// 验证结果接口
export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

// 聚类算法类型
export enum ClusterAlgorithmType {
  DENSITY = "density",
  DISTANCE = "distance",
  HIERARCHICAL = "hierarchical",
  BASIC = "basic",
}

// MapViewer 组件属性类型
export interface MapViewerProps {
  mapData: MetaMapData;
  clusterAlgorithm?: ClusterAlgorithmType;
  minClusterSize?: number;
  clusterDistance?: number;
  defaultView?: "map" | "list";
}
