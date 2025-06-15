"""
Meta Map 数据验证器
使用 JSON Schema 进行验证，与 TypeScript 版本保持一致
"""

import json
import os
from pathlib import Path
from typing import Any, Dict
from jsonschema import Draft7Validator
from .meta_types import ValidationResult

# 获取 schema 文件路径
def get_schema_path() -> str:
    """获取 map-schema.json 文件路径"""
    current_dir = Path(__file__).parent
    schema_path = current_dir.parent / "schemas" / "map-schema.json"
    return str(schema_path)


def load_meta_map_schema() -> Dict[str, Any]:
    """加载 Meta Map JSON Schema"""
    schema_path = get_schema_path()

    if not os.path.exists(schema_path):
        raise FileNotFoundError(f"找不到 schema 文件: {schema_path}")

    try:
        with open(schema_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        raise ValueError(f"加载 schema 文件失败: {e}")


# 全局 schema 实例
_schema = None


def get_meta_map_schema() -> Dict[str, Any]:
    """获取 Meta Map Schema（单例模式）"""
    global _schema
    if _schema is None:
        _schema = load_meta_map_schema()
    return _schema


def validate_meta_map_data(data: Any) -> ValidationResult:
    """
    使用 JSON Schema 校验标准地图数据
    与 TypeScript 版本的 validateMetaMapData 保持一致
    """
    try:
        schema = get_meta_map_schema()

        # 创建验证器
        validator = Draft7Validator(schema)

        # 执行验证
        errors = list(validator.iter_errors(data))

        if not errors:
            return ValidationResult(valid=True)
        else:
            # 格式化错误信息，与 TypeScript 版本保持一致
            error_messages = []
            for error in errors:
                # 拼接更友好的错误信息
                field = error.schema_path
                msg = error.message or "格式错误"
                error_messages.append(f"{'.'.join(map(str, field))}: {msg}")

            return ValidationResult(valid=False, errors=error_messages)

    except Exception as e:
        return ValidationResult(valid=False, errors=[f"验证过程中发生错误: {str(e)}"])


def validate_for_backend(data: Any) -> ValidationResult:
    """
    为后端API优化的验证函数
    提供更详细的错误信息和额外的检查
    """
    # 先进行基础 Schema 验证
    basic_result = validate_meta_map_data(data)
    if not basic_result.valid:
        return basic_result

    # 额外的后端特定检查
    additional_errors = []

    if isinstance(data, dict):
        # 检查数据点数量限制
        if 'data' in data and isinstance(data['data'], list):
            data_points = data['data']
            if len(data_points) > 1000:  # 限制数据点数量
                additional_errors.append(
                    f"数据点数量不能超过1000个，当前有{len(data_points)}个")

            # 检查重复的名称
            names = []
            for point in data_points:
                if isinstance(point, dict) and 'name' in point:
                    name = point['name'].strip() if isinstance(
                        point['name'], str) else ''
                    if name:
                        names.append(name)

            if len(names) != len(set(names)):
                additional_errors.append("数据点名称不能重复")

        # 检查地图名称长度
        if 'name' in data and isinstance(data['name'], str):
            name = data['name']
            if len(name) > 200:
                additional_errors.append(f"地图名称不能超过200个字符，当前{len(name)}个字符")

    if additional_errors:
        all_errors = (basic_result.errors or []) + additional_errors
        return ValidationResult(valid=False, errors=all_errors)

    return basic_result
