import { DataPoint, MetaMapData, ValidationResult } from "../types";
import { validateMetaMapData } from "./validator";

/**
 * MetaMap 地图数据管理类
 */
export class MetaMap {
  private data: MetaMapData;

  constructor(initialData: MetaMapData) {
    // 直接使用 MetaMapData，进行深拷贝
    const validation: ValidationResult =
      validateMetaMapData(initialData);
    if (!validation.valid) {
      throw new Error(`数据验证失败: ${validation.errors?.join(", ")}`);
    }
    this.data = JSON.parse(JSON.stringify(initialData));
  }

  /**
   * 获取所有数据点 (标准格式)
   */
  getAllDataPoints(): DataPoint[] {
    return this.data.data;
  }
}
