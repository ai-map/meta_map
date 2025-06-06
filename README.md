# Meta Map Utils

Meta Map 数据格式工具库，作为 submodule 被其他项目引用。

## 功能特性

- 🗂️ 统一的地图数据 JSON 格式规范
- 🔍 JSON Schema 验证，确保数据入库前的格式正确性
- 🛠️ 数据封装，外部通过接口操作数据而非直接修改 JSON
- 🌐 支持 TypeScript 和 Python 双版本
- 📦 易于扩展的数据结构

## 数据格式规范

### 基础结构

```json
{
  "id": "地图唯一标识",
  "name": "地图名称",
  "description": "地图描述（可选）",
  "origin": "数据来源（可选）",
  "center": {
    "lat": 31.230416,
    "lng": 121.473701
  },
  "zoom": [11, 10, 18],
  "filter": {
    "inclusive": {
      "标签名": ["选项1", "选项2"]
    },
    "exclusive": {}
  },
  "data": [
    {
      "name": "地点名称",
      "address": "详细地址",
      "phone": "联系电话（可选）",
      "webName": "网页标题（可选）",
      "webLink": "相关链接（可选）",
      "intro": "简介描述",
      "tags": ["标签1", "标签2"],
      "center": {
        "lat": 31.200453,
        "lng": 121.479316
      }
    }
  ]
}
```

## 使用方式

### TypeScript

```typescript
import { MetaMap, validateMapData } from './typescript';

// 验证数据
const isValid = validateMapData(jsonData);

// 创建地图实例
const map = new MetaMap(jsonData);

// 添加数据点
map.addDataPoint({
  name: "新地点",
  address: "上海市...",
  intro: "描述",
  tags: ["标签"],
  center: { lat: 31.2, lng: 121.4 }
});

// 过滤数据
const filtered = map.filterData({ tags: ["标签1"] });
```

### Python

```python
from python.meta_map import MetaMap, validate_map_data

# 验证数据
is_valid = validate_map_data(json_data)

# 创建地图实例
map_instance = MetaMap(json_data)

# 添加数据点
map_instance.add_data_point({
    "name": "新地点",
    "address": "上海市...",
    "intro": "描述",
    "tags": ["标签"],
    "center": {"lat": 31.2, "lng": 121.4}
})

# 过滤数据
filtered = map_instance.filter_data(tags=["标签1"])
```

## 目录结构

```
meta_map/
├── README.md
├── schemas/
│   └── map-schema.json
├── typescript/
│   ├── index.ts
│   ├── types.ts
│   ├── validator.ts
│   ├── meta-map.ts
│   └── package.json
├── python/
│   ├── __init__.py
│   ├── meta_map.py
│   ├── validator.py
│   ├── types.py
│   └── requirements.txt
└── data/
    ├── shanghai_wenming.json
    ├── line_1_toilet.json
    ├── line_2_toilet.json
    ├── xinhua_pet.json
    ├── jingan_wenming.json
    └── bilibili_chengfeiyixia.json
```

## 开发指南

1. 所有数据修改应通过提供的接口进行
2. 添加新字段前请先更新 JSON Schema
3. 保持 TypeScript 和 Python 版本 API 的一致性
4. 新增样例数据请放在 `data/` 目录下
