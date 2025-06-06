import { MapData, DataPoint, ValidationResult, Coordinate } from './types';

/**
 * 验证坐标是否有效
 */
function validateCoordinate(coord: Coordinate): string[] {
  const errors: string[] = [];
  
  if (typeof coord.lat !== 'number' || coord.lat < -90 || coord.lat > 90) {
    errors.push('纬度必须是 -90 到 90 之间的数字');
  }
  
  if (typeof coord.lng !== 'number' || coord.lng < -180 || coord.lng > 180) {
    errors.push('经度必须是 -180 到 180 之间的数字');
  }
  
  return errors;
}

/**
 * 验证数据点是否有效
 */
function validateDataPoint(point: DataPoint, index: number): string[] {
  const errors: string[] = [];
  const prefix = `数据点 ${index + 1}: `;
  
  if (!point.name || typeof point.name !== 'string' || point.name.trim().length === 0) {
    errors.push(prefix + '名称不能为空');
  }
  
  if (!point.address || typeof point.address !== 'string' || point.address.trim().length === 0) {
    errors.push(prefix + '地址不能为空');
  }
  
  if (!point.intro || typeof point.intro !== 'string' || point.intro.trim().length === 0) {
    errors.push(prefix + '简介不能为空');
  }
  
  if (!point.center) {
    errors.push(prefix + '坐标不能为空');
  } else {
    const coordErrors = validateCoordinate(point.center);
    errors.push(...coordErrors.map(err => prefix + err));
  }
  
  if (point.tags && !Array.isArray(point.tags)) {
    errors.push(prefix + '标签必须是数组');
  }
  
  if (point.webLink && typeof point.webLink === 'string') {
    try {
      new URL(point.webLink);
    } catch {
      errors.push(prefix + '网页链接格式无效');
    }
  }
  
  return errors;
}

/**
 * 验证地图数据是否符合规范
 */
export function validateMapData(data: any): ValidationResult {
  const errors: string[] = [];
  
  // 基础类型检查
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['数据必须是对象'] };
  }
  
  // 必需字段检查
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('地图名称不能为空');
  }
  
  if (!data.center) {
    errors.push('地图中心坐标不能为空');
  } else {
    const coordErrors = validateCoordinate(data.center);
    errors.push(...coordErrors.map(err => '地图中心: ' + err));
  }
  
  if (!data.data || !Array.isArray(data.data)) {
    errors.push('数据点列表必须是数组');
  } else {
    // 验证每个数据点
    data.data.forEach((point: any, index: number) => {
      const pointErrors = validateDataPoint(point, index);
      errors.push(...pointErrors);
    });
  }
  
  // 可选字段检查
  if (data.zoom && (!Array.isArray(data.zoom) || data.zoom.length !== 3)) {
    errors.push('缩放配置必须是包含3个数字的数组');
  }
  
  if (data.zoom && Array.isArray(data.zoom)) {
    data.zoom.forEach((zoom: any, index: number) => {
      if (typeof zoom !== 'number' || zoom < 1 || zoom > 20) {
        errors.push(`缩放级别 ${index + 1} 必须是 1-20 之间的整数`);
      }
    });
  }
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * 验证数据点是否可以添加
 */
export function validateNewDataPoint(point: Partial<DataPoint>): ValidationResult {
  const errors: string[] = [];
  
  if (!point.name || typeof point.name !== 'string' || point.name.trim().length === 0) {
    errors.push('名称不能为空');
  }
  
  if (!point.address || typeof point.address !== 'string' || point.address.trim().length === 0) {
    errors.push('地址不能为空');
  }
  
  if (!point.intro || typeof point.intro !== 'string' || point.intro.trim().length === 0) {
    errors.push('简介不能为空');
  }
  
  if (!point.center) {
    errors.push('坐标不能为空');
  } else {
    const coordErrors = validateCoordinate(point.center);
    errors.push(...coordErrors);
  }
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
} 