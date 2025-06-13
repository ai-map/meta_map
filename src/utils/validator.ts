import Ajv from "ajv";
import addFormats from "ajv-formats";
import { metaMapSchema } from "../schemas";
import { ValidationResult } from "../types";

/**
 * 使用 JSON Schema 校验标准地图数据
 */
export function validateMetaMapData(data: any): ValidationResult {
  const ajv = new Ajv({ 
    allErrors: true, 
    strict: false
  });
  
  // 添加格式支持
  addFormats(ajv);
  
  const validate = ajv.compile(metaMapSchema);
  const valid = validate(data);
  
  if (valid) {
    return { valid: true };
  } else {
    const errors = validate.errors?.map((err) => {
      // 拼接更友好的错误信息
      let field = err.instancePath || err.schemaPath;
      let msg = err.message || "格式错误";
      return `${field}: ${msg}`;
    }) || ["未知错误"];
    return { valid: false, errors };
  }
}
