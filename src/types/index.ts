/**
 * 地图数据相关类型定义
 * 基于 Meta Map 标准 Schema 定义
 */

// 坐标接口
export interface Coordinate {
  lat: number;
  lng: number;
}

// 筛选器配置接口 (兼容原有格式)
export interface FilterGroup {
  [key: string]: string[];
}

export interface Filter {
  inclusive: Record<string, Record<string, boolean>>;
  exclusive: Record<string, Record<string, boolean>>;
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

// 地图点位类型 (兼容微信小程序格式)
export interface MapPoint extends DataPoint {
  latitude: number;   // 兼容字段，映射自 center.lat
  longitude: number;  // 兼容字段，映射自 center.lng
  index?: number;
}

// 标准地图数据接口 (基于 Schema)
export interface StandardMapData {
  id?: string;
  name: string;
  description?: string;
  origin?: string;
  center: Coordinate;
  zoom?: [number, number, number]; // [默认, 最小, 最大]
  filter?: Filter;
  data: DataPoint[];
}

// 兼容的地图数据类型 (向后兼容)
export interface MapData extends Omit<StandardMapData, 'data' | 'zoom'> {
  _id?: string;
  fileID?: string;
  zoom?: number[] | [number, number, number];
  tags?: string[];
  points?: MapPoint[];
  polyline?: any[];
  data?: DataPoint[] | MapPoint[];
  filter?: Filter;
}

// 聚类点位类型
export interface ClusterPoint {
  points: MapPoint[];
  center: {
    latitude: number;
    longitude: number;
  };
}

// 筛选器状态类型
export interface FilterState {
  [category: string]: {
    [value: string]: boolean;
  };
}

// 验证结果接口
export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

// 过滤条件接口
export interface FilterCriteria {
  tags?: string[];
  name?: string;
  address?: string;
  [key: string]: any;
}

// 统计信息接口
export interface MapStatistics {
  totalPoints: number;
  tags: Record<string, number>;
  coordinates: {
    northernmost: number;
    southernmost: number;
    easternmost: number;
    westernmost: number;
  };
}

// 聚类算法类型
export enum ClusterAlgorithmType {
  DENSITY = "density",
  DISTANCE = "distance", 
  HIERARCHICAL = "hierarchical",
  NONE = "none",
}

// 坐标系统类型
export enum CoordinateSystem {
  WGS84 = 'wgs84',
  GCJ02 = 'gcj02',
  BD09 = 'bd09'
}

// MapViewer 组件属性类型
export interface MapViewerProps {
  mapData: MapData | StandardMapData;
  className?: string;
  style?: { [key: string]: any };
  onPointSelect?: (point: MapPoint | null) => void;
  onMapReady?: () => void;
  clusterAlgorithm?: ClusterAlgorithmType;
  enableClustering?: boolean;
  minClusterSize?: number;
  clusterDistance?: number;
  defaultView?: 'map' | 'list';
  showControls?: boolean;
  enableNavigation?: boolean;
} 