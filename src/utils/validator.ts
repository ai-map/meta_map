import { MapData, StandardMapData, DataPoint, ValidationResult, Coordinate } from '../types';

/**
 * 验证坐标是否有效
 */
function validateCoordinate(coord: Coordinate): string[] {
  const errors: string[] = [];
  
  if (typeof coord.lat !== 'number' || coord.lat < -90 || coord.lat > 90) {
    const error = `纬度必须是 -90 到 90 之间的数字，当前值：${coord.lat} (${typeof coord.lat})`;
    errors.push(error);
    console.log('纬度验证失败:', error);
  }
  
  if (typeof coord.lng !== 'number' || coord.lng < -180 || coord.lng > 180) {
    const error = `经度必须是 -180 到 180 之间的数字，当前值：${coord.lng} (${typeof coord.lng})`;
    errors.push(error);
    console.log('经度验证失败:', error);
  }
  
  return errors;
}

/**
 * 验证数据点是否有效
 */
function validateDataPoint(point: DataPoint, index: number): string[] {
  const errors: string[] = [];
  const pointName = point.name || '未命名';
  const prefix = `数据点 ${index + 1} [${pointName}]: `;
  
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
    if (coordErrors.length > 0) {
      console.log(`坐标验证失败 [${pointName}]:`, point.center, coordErrors);
    }
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
 * 验证标准地图数据是否符合规范
 */
export function validateStandardMapData(data: any): ValidationResult {
  const errors: string[] = [];
  
  // 基础类型检查
  if (!data || typeof data !== 'object') {
    console.log('验证失败: 数据不是对象');
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
    console.log(`数据点验证完成，发现 ${errors.length} 个错误`);
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
  
  const result = {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
  
  return result;
}

/**
 * 验证兼容格式的地图数据
 */
export function validateMapData(data: any): ValidationResult {
  const errors: string[] = [];
  
  // 基础类型检查
  if (!data || typeof data !== 'object') {
    console.log('验证失败: 数据不是对象');
    return { valid: false, errors: ['数据必须是对象'] };
  }
  
  // 必需字段检查
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('地图名称不能为空');
  } else {
    console.log('地图名称:', data.name);
  }
  
  if (!data.center) {
    errors.push('地图中心坐标不能为空');
  } else {
    console.log('地图中心坐标:', data.center);
    const coordErrors = validateCoordinate(data.center);
    errors.push(...coordErrors.map(err => '地图中心: ' + err));
  }
  
  // 验证数据点 (支持 data 或 points 字段)
  const dataPoints = data.data || data.points;
  const formatType = data.data ? '标准格式' : '微信小程序格式';
  
  if (!dataPoints || !Array.isArray(dataPoints)) {
    errors.push('数据点列表必须是数组 (data 或 points 字段)');
  } else {
    console.log(`开始验证 ${dataPoints.length} 个数据点 (${formatType})`);
    
    // 验证每个数据点
    dataPoints.forEach((point: any, index: number) => {
      const pointName = point.name || '未命名';
      
      if (data.points) {
        // 微信小程序格式验证
        console.log(`验证微信小程序格式数据点 ${index + 1} [${pointName}]:`, {
          name: pointName,
          hasCenter: !!point.center,
          center: point.center
        });
        
        if (!point.name || !point.center) {
          errors.push(`点位 ${index + 1} [${pointName}]: 缺少必要字段`);
        }
      } else {
        // 标准格式验证
        const pointErrors = validateDataPoint(point, index);
        errors.push(...pointErrors);
      }
    });
    
    console.log(`${formatType}数据点验证完成，发现 ${errors.length} 个错误`);
  }
  
  const result = {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
  
  console.log('兼容格式地图数据验证结果:', result);
  return result;
}

/**
 * 验证数据点是否可以添加
 */
export function validateNewDataPoint(point: Partial<DataPoint>): ValidationResult {
  const errors: string[] = [];
  const pointName = point.name || '未命名';
  
  console.log(`验证新数据点 [${pointName}]:`, {
    name: pointName,
    address: point.address,
    intro: point.intro,
    center: point.center,
    hasName: !!point.name,
    hasAddress: !!point.address,
    hasIntro: !!point.intro,
    hasCenter: !!point.center
  });
  
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
    if (coordErrors.length > 0) {
      console.log(`坐标验证失败 [${pointName}]:`, point.center, coordErrors);
    }
    errors.push(...coordErrors);
  }
  
  const result = {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
  
  console.log(`新数据点验证结果 [${pointName}]:`, result);
  return result;
} 