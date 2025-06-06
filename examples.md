# Meta Map Utils 使用示例

## TypeScript 示例

```typescript
import { MetaMap, validateMapData, utils } from './typescript';

// 创建示例数据
const mapData = {
  name: "上海咖啡店地图",
  center: { lat: 31.230416, lng: 121.473701 },
  zoom: [12, 10, 18],
  filter: {
    inclusive: {
      "类型": ["咖啡店", "茶餐厅"],
      "营业状态": ["营业中", "即将开业"]
    },
    exclusive: {}
  },
  data: [
    {
      name: "星巴克(南京西路店)",
      address: "上海市静安区南京西路1234号",
      intro: "连锁咖啡品牌，提供各种咖啡和轻食",
      tags: ["咖啡店", "营业中", "WiFi"],
      center: { lat: 31.229853, lng: 121.459971 }
    }
  ]
};

// 验证数据
const validation = validateMapData(mapData);
if (!validation.valid) {
  console.error('数据验证失败:', validation.errors);
}

// 创建地图实例
const map = new MetaMap(mapData);

// 添加新的数据点
const newPoint = {
  name: "瑞幸咖啡(徐家汇店)",
  address: "上海市徐汇区漕溪北路18号",
  intro: "新兴咖啡连锁品牌",
  tags: ["咖啡店", "营业中"],
  center: { lat: 31.195514, lng: 121.436603 }
};

const addResult = map.addDataPoint(newPoint);
if (addResult.valid) {
  console.log('数据点添加成功');
}

// 过滤数据
const coffeShops = map.filterData({ tags: ["咖啡店"] });
console.log('咖啡店数量:', coffeShops.length);

// 获取统计信息
const stats = map.getStatistics();
console.log('地图统计:', stats);

// 查找附近的点
const nearbyPoints = map.findNearbyPoints(
  { lat: 31.230416, lng: 121.473701 }, 
  5 // 5公里半径
);
console.log('附近5公里内的点:', nearbyPoints.length);
```

## Python 示例

```python
from python import MetaMap, validate_map_data

# 创建示例数据
map_data = {
    "name": "上海咖啡店地图",
    "center": {"lat": 31.230416, "lng": 121.473701},
    "zoom": [12, 10, 18],
    "filter": {
        "inclusive": {
            "类型": ["咖啡店", "茶餐厅"],
            "营业状态": ["营业中", "即将开业"]
        },
        "exclusive": {}
    },
    "data": [
        {
            "name": "星巴克(南京西路店)",
            "address": "上海市静安区南京西路1234号",
            "intro": "连锁咖啡品牌，提供各种咖啡和轻食",
            "tags": ["咖啡店", "营业中", "WiFi"],
            "center": {"lat": 31.229853, "lng": 121.459971}
        }
    ]
}

# 验证数据
validation = validate_map_data(map_data)
if not validation.valid:
    print(f"数据验证失败: {validation.errors}")

# 创建地图实例
map_instance = MetaMap(map_data)

# 添加新的数据点
new_point = {
    "name": "瑞幸咖啡(徐家汇店)",
    "address": "上海市徐汇区漕溪北路18号", 
    "intro": "新兴咖啡连锁品牌",
    "tags": ["咖啡店", "营业中"],
    "center": {"lat": 31.195514, "lng": 121.436603}
}

add_result = map_instance.add_data_point(new_point)
if add_result.valid:
    print("数据点添加成功")

# 过滤数据
coffee_shops = map_instance.filter_data(tags=["咖啡店"])
print(f"咖啡店数量: {len(coffee_shops)}")

# 获取统计信息
stats = map_instance.get_statistics()
print(f"地图统计: {stats}")

# 查找附近的点
nearby_points = map_instance.find_nearby_points(
    {"lat": 31.230416, "lng": 121.473701},
    5  # 5公里半径
)
print(f"附近5公里内的点: {len(nearby_points)}")

# 从文件加载
try:
    map_from_file = MetaMap.from_file("data/shanghai_wenming.json")
    print(f"从文件加载成功，包含 {len(map_from_file.get_all_data_points())} 个数据点")
except ValueError as e:
    print(f"文件加载失败: {e}")

# 保存到文件
map_instance.save_to_file("output/my_map.json")
print("地图数据已保存到文件")
```

## 常见使用场景

### 1. 数据验证和清洗

```python
# 批量验证多个数据文件
import os
from python import validate_map_data, MetaMap

data_dir = "data"
for filename in os.listdir(data_dir):
    if filename.endswith('.json'):
        try:
            map_instance = MetaMap.from_file(os.path.join(data_dir, filename))
            print(f"✓ {filename} 验证通过")
        except ValueError as e:
            print(f"✗ {filename} 验证失败: {e}")
```

### 2. 数据统计分析

```python
# 分析标签使用情况
def analyze_tags(map_instance):
    tag_stats = map_instance.get_tag_statistics()
    print("标签使用统计:")
    for tag, count in sorted(tag_stats.items(), key=lambda x: x[1], reverse=True):
        print(f"  {tag}: {count} 次")

# 分析地理分布
def analyze_coordinates(map_instance):
    stats = map_instance.get_statistics()
    coords = stats['coordinates']
    print(f"地理范围:")
    print(f"  北: {coords['northernmost']:.6f}")
    print(f"  南: {coords['southernmost']:.6f}")
    print(f"  东: {coords['easternmost']:.6f}")
    print(f"  西: {coords['westernmost']:.6f}")
```

### 3. 数据合并

```python
# 合并多个地图数据
def merge_maps(*map_instances):
    if not map_instances:
        return None
    
    # 使用第一个地图作为基础
    base_map = map_instances[0]
    merged_data = base_map.export_data()
    
    # 合并其他地图的数据点
    for map_instance in map_instances[1:]:
        data_points = map_instance.get_all_data_points()
        merged_data['data'].extend(data_points)
    
    return MetaMap(merged_data)
```

### 4. 地理搜索

```python
# 在指定区域内搜索
def search_in_bounds(map_instance, north, south, east, west):
    all_points = map_instance.get_all_data_points()
    results = []
    
    for point in all_points:
        lat, lng = point['center']['lat'], point['center']['lng']
        if south <= lat <= north and west <= lng <= east:
            results.append(point)
    
    return results

# 搜索上海市中心区域的点
shanghai_center_points = search_in_bounds(
    map_instance,
    north=31.3,   # 北纬31.3度
    south=31.1,   # 北纬31.1度  
    east=121.6,   # 东经121.6度
    west=121.3    # 东经121.3度
)