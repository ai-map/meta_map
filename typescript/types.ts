/**
 * 坐标接口
 */
export interface Coordinate {
  lat: number;
  lng: number;
}

/**
 * 过滤器配置接口
 */
export interface FilterConfig {
  inclusive?: Record<string, string[]>;
  exclusive?: Record<string, string[]>;
}

/**
 * 地图数据点接口
 */
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

/**
 * 地图数据接口
 */
export interface MapData {
  id?: string;
  name: string;
  description?: string;
  origin?: string;
  center: Coordinate;
  zoom?: [number, number, number];
  filter?: FilterConfig;
  data: DataPoint[];
}

/**
 * 验证结果接口
 */
export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

/**
 * 过滤条件接口
 */
export interface FilterCriteria {
  tags?: string[];
  name?: string;
  address?: string;
  [key: string]: any;
}

/**
 * 统计信息接口
 */
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