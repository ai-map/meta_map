import Ajv from "ajv";
import { metaMapSchema } from "../schemas";
import { ValidationResult } from "../types";

/**
 * 使用 JSON Schema 校验标准地图数据
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validateMetaMapData(data: any): ValidationResult {
  const ajv = new Ajv({
    allErrors: true,
  });

  const validate = ajv.compile(metaMapSchema);
  const valid = validate(data);

  if (valid) {
    return { valid: true };
  } else {
    const errors = validate.errors?.map((err) => {
      // 拼接更友好的错误信息
      const field = err.schemaPath;
      const msg = err.message || "格式错误";
      return `${field}: ${msg}`;
    }) || ["未知错误"];
    return { valid: false, errors };
  }
}
