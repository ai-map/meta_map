// 地图页面V2
import {
  createClusterManager,
  ClusterType,
  CoordinateSystem,
  Point as ClusterBasePoint,
} from "./cluster_index";
import { DensityClusterManager } from "./density_cluster";
import { DistanceClusterManager } from "./distance_cluster";
import { HierarchicalClusterManager } from "./hierarchical_cluster";
import { ClusterManager } from "./cluster_manager";

// 标记的不同状态（默认、选中）
enum MarkerStatusV2 {
  DEFAULT = "../../static/images/a.png",
  SELECTED = "../../static/images/b.png",
}

// 聚类算法类型
enum ClusterAlgorithmType {
  DENSITY = "density",
  DISTANCE = "distance", 
  HIERARCHICAL = "hierarchical",
  NONE = "none", // 不使用聚类
}

const MAP_SCALE_TO_RATIO = {
  "3": 1000000,
  "4": 500000,
  "5": 200000,
  "6": 100000,
  "7": 50000,
  "8": 25000,
  "9": 20000,
  "10": 10000,
  "11": 5000,
  "12": 2000,
  "13": 1000,
  "14": 500,
  "15": 200,
  "16": 100,
  "17": 50,
  "18": 20,
  "19": 10,
  "20": 5,
};

// Sprite 参数
const MARKER_CONFIG_V2 = {
  markerWidth: 24,
  markerHeight: 24,
};

// 聚合距离阈值（单位：度，大约111公里/度）
const CLUSTER_DISTANCE_THRESHOLD = 0.0001; // 约11米

// 聚合标记样式
const CLUSTER_STYLE = {
  textAlign: "center",
  fontWeight: "bold",
  color: "#FFFFFF",
  fontSize: 11,
  anchorX: 0,
  anchorY: 0,
  borderWidth: 0,
  borderRadius: 0,
  bgColor: "transparent",
  padding: 0,
};

interface FilterGroup {
  [key: string]: string[];
}

interface Filter {
  inclusive: FilterGroup;
  exclusive: FilterGroup;
}

interface MapData {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  center: {
    lat: number;
    lng: number;
  };
  zoom?: number[];
  tags?: string[];
  fileID?: string;
  points?: Array<Point>;
  polyline?: any[];
  data?: Array<Point>;
  filter?: Filter;
}

interface Point {
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  phone?: string;
  intro?: string;
  index?: number;
  center: {
    lat: number;
    lng: number;
  };
  webName?: string;
  tags?: string[];
}

interface MapMarker {
  id: number;
  latitude: number;
  longitude: number;
  title: string;
  width: number;
  height: number;
  iconPath: string;
  callout?: {
    content: string;
    color: string;
    fontSize: number;
    borderRadius: number;
    padding: number;
    display: string;
    textAlign: string;
    bgColor?: string;
  };
  zIndex?: number;
  alpha?: number;
  anchor?: {
    x: number;
    y: number;
  };
  label?: {
    content: string;
    color: string;
    fontSize: number;
    textAlign: string;
    anchorX: number;
    anchorY: number;
    borderWidth: number;
    borderRadius: number;
    bgColor: string;
    padding: number;
  };
}

interface ClusterPoint {
  points: Point[];
  center: {
    latitude: number;
    longitude: number;
  };
}

interface FilterState {
  [category: string]: {
    [value: string]: boolean;
  };
}

// 聚类项目接口，继承自ClusterBasePoint
interface ClusterItem extends ClusterBasePoint {
  id: string;
  name: string;
  point: Point;
}

Page({
  data: {
    // 地图数据
    mapData: {} as MapData,
    markers: [] as MapMarker[],
    latitude: 30.274083,
    longitude: 120.15507,
    scale: 14, // map scale
    minScale: 10,
    maxScale: 18,
    polyline: [] as any[],

    // 当前缩放级别
    currentScale: 14, // data 实时保存的scale

    // 当前状态
    loading: true,
    filterExpanded: false,
    activeTab: "map",
    mapReady: false,

    // 选中的点位
    selectedPointIndex: 0, // 0表示未选择
    selectedPoint: null as Point | null,

    // 索引映射
    pointsMap: {} as { [key: number]: Point },

    // 聚合点映射
    clusterMap: {} as { [key: number]: Point[] },

    // 聚合列表相关
    clusterListVisible: false,
    clusterPoints: [] as Point[],
    selectedClusterPointIndex: -1, // 记录聚合点列表中选中的点位索引

    // 滚动视图ID
    scrollIntoView: "",
    scrollIntoClusterView: "", // 聚合点列表的滚动视图ID

    // 是否是用户主动切换Tab
    isUserTabChange: false,

    // 筛选器相关
    hasFilters: false, // 是否有筛选器
    filterCategories: {
      inclusive: [] as string[],
      exclusive: [] as string[],
    },
    filterValues: {
      inclusive: {} as { [key: string]: string[] },
      exclusive: {} as { [key: string]: string[] },
    },
    filterState: {
      inclusive: {} as FilterState,
      exclusive: {} as FilterState,
    },

    // 原始点位数据，用于筛选
    originalPoints: [] as Point[],
    filteredPoints: [] as Point[],

    // 聚类设置
    clusterEnabled: true, // 是否启用聚类
    clusterAlgorithm: ClusterAlgorithmType.DISTANCE, // 当前聚类算法
    clusterRadius: 100, // 聚类半径（米）
    clusterMinPoints: 2, // 形成聚类的最小点数
    clusterFactor: 1.2, // 聚类强度因子，值越大聚类越松散，值越小聚类越紧密
    
    // 聚类算法选项
    clusterAlgorithmOptions: [
      { label: "密度聚类", value: ClusterAlgorithmType.DENSITY },
      { label: "距离聚类", value: ClusterAlgorithmType.DISTANCE },
      { label: "层次聚类", value: ClusterAlgorithmType.HIERARCHICAL },
      { label: "不聚类", value: ClusterAlgorithmType.NONE },
    ],
  },

  // 聚类管理器实例
  clusterManager: null as ClusterManager<ClusterItem> | null,

  onLoad: function (options: any) {
    console.log("地图页面V2加载");

    // 首先尝试从options获取地图ID
    const mapId = options.id;

    // 其次尝试从缓存获取地图数据
    const mapData = wx.getStorageSync("currentMap");
    console.log("缓存地图数据:", mapData);

    if (mapData) {
      this.initMapWithData(mapData);
    } else if (mapId) {
      this.loadMapData(mapId);
    } else {
      wx.showToast({
        title: "地图ID无效",
        icon: "none",
      });

      // 2秒后返回
      setTimeout(() => {
        wx.navigateBack();
      }, 2000);
    }
  },

  /**
   * 根据当前缩放级别动态调整聚类参数
   */
  adjustClusterParameters: function () {
    if (!this.data.clusterEnabled) {
      return;
    }
    this.processRegionForClustering();
  },

  /**
   * 处理聚类参数计算
   */
  processRegionForClustering: function () {
    // 获取当前缩放级别，如果没有传入则使用当前状态中的值
    const currentScale = this.data.currentScale;

    // 向上取整缩放级别，确保能找到对应的比例尺值
    const roundedScale = Math.ceil(currentScale).toString();

    // 获取对应的比例尺值作为半径
    let clusterRadius = 100; // 默认值
    if (MAP_SCALE_TO_RATIO[roundedScale as keyof typeof MAP_SCALE_TO_RATIO]) {
      clusterRadius =
        MAP_SCALE_TO_RATIO[roundedScale as keyof typeof MAP_SCALE_TO_RATIO] *
        this.data.clusterFactor;
    } else {
      // 如果没有对应的比例尺值，使用最接近的级别
      const scales = Object.keys(MAP_SCALE_TO_RATIO)
        .map(Number)
        .sort((a, b) => a - b);
      const closestScale =
        scales.find((scale) => scale >= currentScale) ||
        scales[scales.length - 1];
      clusterRadius =
        MAP_SCALE_TO_RATIO[
          closestScale.toString() as keyof typeof MAP_SCALE_TO_RATIO
        ] * this.data.clusterFactor;
    }

    clusterRadius /= 2;

    // 打印参数
    console.log(
      `当前缩放级别: ${currentScale}, 取整: ${roundedScale}, 半径: ${clusterRadius}m`
    );

    // 如果有变化，更新参数
    if (clusterRadius !== this.data.clusterRadius) {
      this.setData({ clusterRadius }, () => {
        // 添加标志变量，表示正在更新聚类
        (this as any)._isUpdatingClusters = true;

        this.updateClusters();

        // 确保更新完成后重置标志
        (this as any)._isUpdatingClusters = false;
      });
    }
  },

  /**
   * 地图区域改变事件
   */
  regionChange(e: any) {
    console.log("regionChange", e.detail);
    // 仅在区域变化结束时更新聚类
    if (e.type === "end" && e.detail.causedBy != "update") {
      const { scale } = e.detail;
      
      // 保存新的缩放级别
      this.setData({
        currentScale: scale,
      });

      // 调整聚类参数
      this.adjustClusterParameters();
    }
  },

  /**
   * 计算两点之间的距离（Haversine公式）
   * @param point1 点1 {latitude, longitude}
   * @param point2 点2 {latitude, longitude}
   * @returns 距离（米）
   */
  calculateHaversineDistance: function (point1: any, point2: any) {
    const R = 6371000; // 地球半径，单位：米
    const lat1 = (point1.latitude * Math.PI) / 180;
    const lat2 = (point2.latitude * Math.PI) / 180;
    const dLat = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const dLon = ((point2.longitude - point1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  },

  /**
   * 使用地图数据初始化地图
   */
  initMapWithData(mapData: any) {
    console.log("初始化地图数据:", mapData);

    let processedMapData: MapData;

    // 判断数据格式，处理从云存储直接获取的JSON格式
    if (mapData.data) {
      // 数据来自云存储，需要提取points和polyline
      processedMapData = {
        _id: mapData._id || mapData.id,
        id: mapData.id || mapData._id,
        name: mapData.name,
        description: mapData.description || "",
        center: mapData.center,
        zoom: mapData.zoom || [14, 10, 18],
        tags: mapData.tags || [],
        fileID: mapData.fileID || "",
        points: mapData.data || [],
        polyline: mapData.polyline || [],
        data: mapData.data || [],
        filter: mapData.filter || { inclusive: {}, exclusive: {} },
      };
    } else {
      // 使用现有数据格式
      processedMapData = mapData;
    }

    // 设置地图中心点
    const center = processedMapData.center || {
      lat: this.data.latitude,
      lng: this.data.longitude,
    };
    const zoom = processedMapData.zoom || [14, 10, 18];

    const initialScale = zoom[0] || 14;
    this.setData({
      mapData: processedMapData,
      latitude: center.lat,
      longitude: center.lng,
      scale: initialScale,
      currentScale: initialScale, // 同步设置当前缩放级别
      minScale: zoom[1] || 10,
      maxScale: zoom[2] || 18,
    });

    // 处理筛选器数据
    this.initFilterData(processedMapData.filter);

    // 处理地图数据
    this.processMappingData(processedMapData);
  },

  /**
   * 初始化筛选器数据
   */
  initFilterData(filter?: Filter) {
    if (!filter) {
      this.setData({
        hasFilters: false,
      });
      return;
    }

    const inclusiveCategories = Object.keys(filter.inclusive || {});
    const exclusiveCategories = Object.keys(filter.exclusive || {});

    // 检查是否有筛选器
    const hasFilters =
      inclusiveCategories.length > 0 || exclusiveCategories.length > 0;

    // 准备筛选器状态
    const inclusiveState: FilterState = {};
    const exclusiveState: FilterState = {};

    // 初始化 inclusive 筛选器状态（默认全选）
    inclusiveCategories.forEach((category) => {
      inclusiveState[category] = {};
      filter.inclusive[category].forEach((value) => {
        inclusiveState[category][value] = true;
      });
    });

    // 初始化 exclusive 筛选器状态（默认全不选）
    exclusiveCategories.forEach((category) => {
      exclusiveState[category] = {};
      filter.exclusive[category].forEach((value) => {
        exclusiveState[category][value] = false;
      });
    });

    this.setData(
      {
        hasFilters,
        filterCategories: {
          inclusive: inclusiveCategories,
          exclusive: exclusiveCategories,
        },
        filterValues: {
          inclusive: filter.inclusive || {},
          exclusive: filter.exclusive || {},
        },
        filterState: {
          inclusive: inclusiveState,
          exclusive: exclusiveState,
        },
      },
      () => {
        // 如果初始化时已有原始点位数据，立即应用筛选
        if (this.data.originalPoints && this.data.originalPoints.length > 0) {
          this.applyFilters();
        }
      }
    );
  },

  /**
   * 加载地图数据
   * @param mapId 地图ID
   */
  loadMapData: function (mapId: string) {
    this.setData({
      loading: true,
    });

    // 调用云函数获取地图数据
    wx.cloud
      .callFunction({
        name: "getMapData",
        data: { mapId },
      })
      .then((res: any) => {
        const result = res.result || {};
        const mapData = result.data || ({} as MapData);

        if (!mapData) {
          wx.showToast({
            title: "地图数据不存在",
            icon: "none",
          });
          return;
        }

        // 获取成功，初始化地图数据
        this.initMapWithData(mapData);
      })
      .catch((err: Error) => {
        console.error("获取地图数据失败", err);
        wx.showToast({
          title: "加载失败",
          icon: "none",
        });
        this.setData({
          loading: false,
        });
      });
  },

  /**
   * 处理地图数据并创建标记
   */
  processMappingData(mapData: any) {
    // 确保使用正确的点位数据
    const pointsData = mapData.points || mapData.data || [];

    if (pointsData && pointsData.length > 0) {
      console.log(`处理 ${pointsData.length} 个点位数据`);

      // 为每个点位添加唯一索引
      const pointsWithIndex = pointsData.map((point: Point, i: number) => ({
        ...point,
        index: i + 1,
      }));

      // 保存原始点位数据用于筛选
      this.setData({
        originalPoints: pointsWithIndex,
      });

      // 应用筛选逻辑
      this.applyFilters();
    } else {
      console.log("没有找到点位数据");
      this.setData({
        mapReady: true,
        loading: false,
      });
    }
  },

  /**
   * 应用筛选逻辑，筛选符合条件的点位
   */
  applyFilters() {
    const { originalPoints, filterState, hasFilters } = this.data;
    let filteredPoints = [...originalPoints];

    // 如果有筛选器且有原始数据
    if (hasFilters && originalPoints && originalPoints.length > 0) {
      // 筛选逻辑
      filteredPoints = originalPoints.filter((point) => {
        // 必须有tags属性才能进行筛选
        if (!point.tags || point.tags.length === 0) {
          return false;
        }

        // 应用inclusive筛选器（必须匹配至少一个选中的标签）
        let matchesInclusive = true;
        for (const category in filterState.inclusive) {
          // 该类别中至少要匹配一个选中的标签
          const selectedTags = Object.entries(filterState.inclusive[category])
            .filter(([_, isSelected]) => isSelected)
            .map(([tag]) => tag);

          if (selectedTags.length > 0) {
            // 检查点位的tags中是否有任何一个标签匹配选中的标签
            const hasMatch = selectedTags.some((tag) =>
              point.tags?.includes(tag)
            );
            if (!hasMatch) {
              matchesInclusive = false;
              break;
            }
          }
        }

        if (!matchesInclusive) {
          return false;
        }

        // 应用exclusive筛选器（如果有选中的标签，必须完全匹配）
        for (const category in filterState.exclusive) {
          // 找出该类别中所有选中的标签
          const selectedTag = Object.entries(
            filterState.exclusive[category]
          ).find(([_, isSelected]) => isSelected);

          // 如果有选中的标签
          if (selectedTag) {
            // 检查点位是否包含该标签
            if (!point.tags?.includes(selectedTag[0])) {
              return false;
            }
          }
        }

        return true;
      });
    }

    // 创建筛选后点位的索引映射
    const pointsMap: { [key: number]: Point } = {};
    filteredPoints.forEach((point: Point) => {
      if (point.index !== undefined) {
        pointsMap[point.index] = point;
      }
    });

    // 初始化聚类
    this.initClustering(filteredPoints);

    // 设置多边形路径
    const polyline = this.generatePolyline(this.data.mapData.polyline || []);

    this.setData({
      mapData: {
        ...this.data.mapData,
        points: filteredPoints,
      },
      filteredPoints,
      polyline,
      mapReady: true,
      pointsMap, // 保存点位索引映射
      loading: false,
    });
  },

  /**
   * 初始化聚类管理器
   */
  initClustering(filteredPoints: Point[]) {
    // 将点位数据转换为聚类管理器需要的格式
    const clusterPoints: ClusterItem[] = filteredPoints.map((point, index) => {
      return {
        id: `point_${index}`,
        name: point.name,
        x: point.center.lng, // 经度
        y: point.center.lat, // 纬度
        weight: 1,
        point: point,
        points: [point],
        center: {
          latitude: point.center.lat,
          longitude: point.center.lng,
        },
      };
    });

    // 根据选择的算法创建相应的聚类管理器
    this.clusterManager = this.createClusterManager();

    if (this.clusterManager) {
      // 添加点数据到聚类管理器
      this.clusterManager.addPoints(clusterPoints);

      // 注册聚类事件监听
      this.clusterManager.on("cluster", (event) => {
        this.handleClusterUpdate(event.payload.clusters);
      });

      // 执行初始聚类
      this.updateClusters();
    } else {
      // 如果不使用聚类，直接创建标记
      const { markers, clusterMap } = this.createClusteredMarkers(filteredPoints);
      this.setData({ markers, clusterMap });
    }
  },

  /**
   * 创建聚类管理器
   */
  createClusterManager(): ClusterManager<ClusterItem> | null {
    const { clusterAlgorithm, clusterRadius, clusterMinPoints } = this.data;
    
    const options = {
      radius: clusterRadius,
      minPoints: clusterMinPoints,
      coordinateSystem: CoordinateSystem.GCJ02,
    };

    switch (clusterAlgorithm) {
      case ClusterAlgorithmType.DENSITY:
        return createClusterManager<ClusterItem>(ClusterType.DENSITY, options) as DensityClusterManager<ClusterItem>;
      
      case ClusterAlgorithmType.DISTANCE:
        return new DistanceClusterManager<ClusterItem>(options);
      
      case ClusterAlgorithmType.HIERARCHICAL:
        return new HierarchicalClusterManager<ClusterItem>(options);
      
      case ClusterAlgorithmType.NONE:
      default:
        return null;
    }
  },

  /**
   * 更新聚类
   */
  updateClusters() {
    if (!this.clusterManager || !this.data.clusterEnabled || this.data.clusterAlgorithm === ClusterAlgorithmType.NONE) {
      // 如果未启用聚类或选择不聚类，直接使用原始的聚类方法
      const { markers, clusterMap } = this.createClusteredMarkers(
        this.data.filteredPoints
      );
      this.setData({ markers, clusterMap });
      return;
    }

    // 执行聚类
    const clusters = this.clusterManager.updateClusters({
      radius: this.data.clusterRadius,
      minPoints: this.data.clusterMinPoints,
    });

    console.log(`聚类完成，形成 ${clusters.length} 个聚类`);
    (this as any)._isUpdatingClusters = false;
  },

  /**
   * 处理聚类更新
   */
  handleClusterUpdate(clusters: any[]) {
    // 处理聚类结果，转换为地图标记格式
    const markers: MapMarker[] = [];
    const clusterMap: { [key: number]: Point[] } = {};

    clusters.forEach((cluster, index) => {
      const isCluster = cluster.points.length > 1;
      const center = cluster.center;

      if (isCluster) {
        // 聚类标记
        const clusterId = -(index + 1); // 使用负数作为聚合点ID
        clusterMap[clusterId] = cluster.points.map((p: ClusterItem) => p.point);

        markers.push({
          id: clusterId,
          latitude: center.y,
          longitude: center.x,
          title: `聚合点 (${cluster.points.length})`,
          width: MARKER_CONFIG_V2.markerWidth,
          height: MARKER_CONFIG_V2.markerHeight,
          iconPath: MarkerStatusV2.DEFAULT,
          anchor: { x: 0.5, y: 0.25 },
          label: {
            content: cluster.points.length.toString(),
            color: CLUSTER_STYLE.color,
            fontSize: CLUSTER_STYLE.fontSize,
            textAlign: CLUSTER_STYLE.textAlign as any,
            anchorX: CLUSTER_STYLE.anchorX,
            anchorY: CLUSTER_STYLE.anchorY,
            borderWidth: CLUSTER_STYLE.borderWidth,
            borderRadius: CLUSTER_STYLE.borderRadius,
            bgColor: CLUSTER_STYLE.bgColor,
            padding: CLUSTER_STYLE.padding,
          },
          callout: {
            content: `包含 ${cluster.points.length} 个地点`,
            color: "#333333",
            fontSize: 14,
            borderRadius: 4,
            padding: 8,
            display: "BYCLICK",
            textAlign: "center",
          },
          zIndex: 100, // 增加聚类标记的Z轴优先级
        });
      } else {
        // 单个点标记
        const point = cluster.points[0].point;
        const pointId = point.index || 0;

        markers.push({
          id: pointId,
          latitude: point.center.lat,
          longitude: point.center.lng,
          title: point.name,
          width: MARKER_CONFIG_V2.markerWidth,
          height: MARKER_CONFIG_V2.markerHeight,
          iconPath: MarkerStatusV2.DEFAULT,
          anchor: { x: 0.5, y: 1.0 },
          callout: {
            content: point.name,
            color: "#333333",
            fontSize: 14,
            borderRadius: 4,
            padding: 8,
            display: "BYCLICK",
            textAlign: "center",
          },
        });
      }
    });

    // 更新地图标记 - 添加延迟确保渲染完成
    this.setData(
      {
        markers: markers,
        clusterMap: clusterMap,
      },
      () => {
        // 更新标记样式
        this.updateMarkerStyles();
      }
    );
  },

  /**
   * 创建聚合标记
   */
  createClusteredMarkers(pointsData: Point[]) {
    const clusters: ClusterPoint[] = [];
    const clusterMap: { [key: number]: Point[] } = {};

    // 对每个点进行聚合分析
    pointsData.forEach((point) => {
      // 获取点的经纬度
      const lat = point.center.lat;
      const lng = point.center.lng;

      // 查找是否有附近的已有聚合点
      let foundCluster = false;

      for (let i = 0; i < clusters.length; i++) {
        const cluster = clusters[i];
        const clusterLat = cluster.center.latitude;
        const clusterLng = cluster.center.longitude;

        // 计算与聚合点的距离
        const distance = Math.sqrt(
          Math.pow(lat - clusterLat, 2) + Math.pow(lng - clusterLng, 2)
        );

        // 如果距离小于阈值，加入此聚合
        if (distance <= CLUSTER_DISTANCE_THRESHOLD) {
          cluster.points.push(point);
          foundCluster = true;
          break;
        }
      }

      // 如果没有找到附近的聚合点，创建新的聚合点
      if (!foundCluster) {
        clusters.push({
          points: [point],
          center: {
            latitude: lat,
            longitude: lng,
          },
        });
      }
    });

    // 创建标记
    const markers: MapMarker[] = [];

    // 为每个聚合创建标记
    clusters.forEach((cluster, index) => {
      const clusterId = -(index + 1); // 使用负数作为聚合点ID，避免与普通点冲突

      if (cluster.points.length === 1) {
        // 单点，创建普通标记
        const point = cluster.points[0];
        const pointIndex = point.index || 1;

        markers.push({
          id: pointIndex,
          latitude: cluster.center.latitude,
          longitude: cluster.center.longitude,
          title: point.name,
          width: MARKER_CONFIG_V2.markerWidth,
          height: MARKER_CONFIG_V2.markerHeight,
          iconPath: MarkerStatusV2.DEFAULT,
          anchor: { x: 0.5, y: 1.0 },
          callout: {
            content: point.name,
            color: "#333333",
            fontSize: 14,
            borderRadius: 4,
            bgColor: "#ffffff",
            padding: 8,
            display: "BYCLICK",
            textAlign: "center",
          },
        });
      } else {
        // 多点聚合，创建聚合标记
        clusterMap[clusterId] = cluster.points;

        markers.push({
          id: clusterId,
          latitude: cluster.center.latitude,
          longitude: cluster.center.longitude,
          title: `聚合点 (${cluster.points.length})`,
          width: MARKER_CONFIG_V2.markerWidth,
          height: MARKER_CONFIG_V2.markerHeight,
          iconPath: MarkerStatusV2.DEFAULT, // 使用默认标记
          anchor: { x: 0.5, y: 1.0 },
          label: {
            content: cluster.points.length.toString(),
            color: CLUSTER_STYLE.color,
            fontSize: CLUSTER_STYLE.fontSize,
            textAlign: CLUSTER_STYLE.textAlign,
            anchorX: CLUSTER_STYLE.anchorX,
            anchorY: CLUSTER_STYLE.anchorY,
            borderWidth: CLUSTER_STYLE.borderWidth,
            borderRadius: CLUSTER_STYLE.borderRadius,
            bgColor: CLUSTER_STYLE.bgColor,
            padding: CLUSTER_STYLE.padding,
          },
          callout: {
            content: `包含 ${cluster.points.length} 个地点`,
            color: "#333333",
            fontSize: 14,
            borderRadius: 4,
            bgColor: "#ffffff",
            padding: 8,
            display: "BYCLICK",
            textAlign: "center",
          },
        });
      }
    });

    return { markers, clusterMap };
  },

  /**
   * 生成多边形路径
   */
  generatePolyline(polylineData: any[]) {
    if (!polylineData || polylineData.length === 0) return [];

    return [
      {
        points: polylineData.map((point) => ({
          latitude: point.lat,
          longitude: point.lng,
        })),
        color: "#FF99FF",
        width: 2,
        dottedLine: false,
        arrowLine: false,
        borderColor: "#FF33FF",
        borderWidth: 1,
      },
    ];
  },

  /**
   * 切换筛选器展开/折叠
   */
  toggleFilter: function () {
    this.setData({
      filterExpanded: !this.data.filterExpanded,
    });
  },

  /**
   * 阻止事件冒泡，防止点击筛选器内部区域时折叠筛选器
   */
  preventBubble: function (e: any) {
    // 阻止事件冒泡
    return;
  },

  /**
   * 阻止触摸滑动事件
   */
  preventTouchMove: function (e: any) {
    // 阻止页面滑动
    return;
  },

  /**
   * 点击 inclusive 类型的筛选项
   */
  onInclusiveFilterTap: function (e: any) {
    const { category, value } = e.currentTarget.dataset;
    const currentState = this.data.filterState.inclusive[category][value];

    // 检查如果取消选择，是否会导致该类别中没有选中项
    if (currentState) {
      let hasOtherSelected = false;
      for (const otherValue in this.data.filterState.inclusive[category]) {
        if (
          otherValue !== value &&
          this.data.filterState.inclusive[category][otherValue]
        ) {
          hasOtherSelected = true;
          break;
        }
      }

      // 如果没有其他选中项，则不允许取消选择
      if (!hasOtherSelected) {
        wx.showToast({
          title: "至少需要选择一项",
          icon: "none",
        });
        return;
      }
    }

    // 更新状态
    const newInclusiveState = { ...this.data.filterState.inclusive };
    newInclusiveState[category][value] = !currentState;

    this.setData(
      {
        ["filterState.inclusive"]: newInclusiveState,
      },
      () => {
        // 应用筛选逻辑
        this.applyFilters();
      }
    );
  },

  /**
   * 点击 exclusive 类型的筛选项
   */
  onExclusiveFilterTap: function (e: any) {
    const { category, value } = e.currentTarget.dataset;
    const currentState = this.data.filterState.exclusive[category][value];

    // 如果当前已选中，则取消选择；如果未选中，则先清除该类别中的其他选择
    const newExclusiveState = { ...this.data.filterState.exclusive };

    if (!currentState) {
      // 清除该类别中的其他选择
      for (const otherValue in newExclusiveState[category]) {
        newExclusiveState[category][otherValue] = false;
      }
      // 选中当前项
      newExclusiveState[category][value] = true;
    } else {
      // 取消选中当前项
      newExclusiveState[category][value] = false;
    }

    this.setData(
      {
        ["filterState.exclusive"]: newExclusiveState,
      },
      () => {
        // 应用筛选逻辑
        this.applyFilters();
      }
    );
  },

  /**
   * 重置所有筛选器
   */
  resetFilters: function () {
    const { filterCategories, filterValues } = this.data;

    // 重置 inclusive 筛选器（全部选中）
    const newInclusiveState: FilterState = {};
    filterCategories.inclusive.forEach((category) => {
      newInclusiveState[category] = {};
      filterValues.inclusive[category].forEach((value) => {
        newInclusiveState[category][value] = true;
      });
    });

    // 重置 exclusive 筛选器（全部不选）
    const newExclusiveState: FilterState = {};
    filterCategories.exclusive.forEach((category) => {
      newExclusiveState[category] = {};
      filterValues.exclusive[category].forEach((value) => {
        newExclusiveState[category][value] = false;
      });
    });

    this.setData(
      {
        filterState: {
          inclusive: newInclusiveState,
          exclusive: newExclusiveState,
        },
      },
      () => {
        // 应用筛选逻辑
        this.applyFilters();
      }
    );
  },

  /**
   * 切换标签页
   */
  onTabChange: function (e: any) {
    const newTab = e.detail.value;
    const oldTab = this.data.activeTab;

    // 标记为用户主动切换Tab
    this.setData({
      activeTab: newTab,
      isUserTabChange: true,
    });

    // 如果用户主动从地图切换到列表标签页，检查是否需要滚动到选中的点位
    if (newTab === "list" && oldTab === "map") {
      if (this.data.clusterListVisible && this.data.selectedPointIndex > 0) {
        // 在聚合列表中有选中项，滚动到该项
        this.setData({
          scrollIntoClusterView: `cluster-point-${this.data.selectedPointIndex}`,
        });

        // 延迟一段时间后清除scrollIntoClusterView
        setTimeout(() => {
          this.setData({
            scrollIntoClusterView: "",
            isUserTabChange: false,
          });
        }, 500);
      } else if (this.data.selectedPointIndex > 0) {
        // 确保只有当有选中点位时才滚动
        // 直接滚动到点位ID
        this.setData({
          scrollIntoView: `point-${this.data.selectedPointIndex}`,
        });

        // 延迟一段时间后清除scrollIntoView，避免后续操作受影响
        setTimeout(() => {
          this.setData({
            scrollIntoView: "",
            isUserTabChange: false,
          });
        }, 500);
      }
    }
    // 如果从列表切换到地图，检查是否有选中的点或聚类
    else if (newTab === "map" && oldTab === "list") {
      let targetLatitude = this.data.latitude;
      let targetLongitude = this.data.longitude;
      let shouldMove = false;

      // 如果在聚类列表状态下有选中点
      if (this.data.clusterListVisible && this.data.selectedPoint) {
        const selectedPoint = this.data.selectedPoint;
        if (selectedPoint.center) {
          targetLatitude = selectedPoint.center.lat;
          targetLongitude = selectedPoint.center.lng;
          shouldMove = true;
        } else if (selectedPoint.latitude && selectedPoint.longitude) {
          targetLatitude = selectedPoint.latitude;
          targetLongitude = selectedPoint.longitude;
          shouldMove = true;
        }
      }
      // 如果有选中的普通点
      else if (this.data.selectedPoint) {
        const selectedPoint = this.data.selectedPoint;
        if (selectedPoint.center) {
          targetLatitude = selectedPoint.center.lat;
          targetLongitude = selectedPoint.center.lng;
          shouldMove = true;
        } else if (selectedPoint.latitude && selectedPoint.longitude) {
          targetLatitude = selectedPoint.latitude;
          targetLongitude = selectedPoint.longitude;
          shouldMove = true;
        }
      }

      // 如果有目标位置，移动地图
      if (shouldMove) {
        // 更新地图中心点
        this.setData(
          {
            latitude: targetLatitude,
            longitude: targetLongitude,
          },
          () => {
            // 移动地图到目标位置
            const mapCtx = wx.createMapContext("myMap");
            mapCtx.moveToLocation({
              latitude: targetLatitude,
              longitude: targetLongitude,
              success: () => {
                // 确保更新标记样式
                this.updateMarkerStyles();
              },
            });
          }
        );
      } else {
        // 如果没有选中点，也要更新标记样式
        setTimeout(() => {
          this.updateMarkerStyles();
        }, 100);
      }

      // 不需要滚动时，也要重置isUserTabChange标志
      setTimeout(() => {
        this.setData({
          isUserTabChange: false,
        });
      }, 100);
    } else {
      // 其他情况，也要重置isUserTabChange标志
      setTimeout(() => {
        this.setData({
          isUserTabChange: false,
        });
      }, 100);
    }
  },

  /**
   * 更新标记样式
   */
  updateMarkerStyles: function () {
    const { markers, selectedPoint, selectedPointIndex, clusterMap } =
      this.data;
    if (!markers || markers.length === 0) return;

    // 获取选中点位的ID（如果有）
    let selectedPointId = 0; // 0表示未选择
    if (selectedPoint && selectedPoint.index) {
      selectedPointId = selectedPoint.index;
    } else if (selectedPointIndex > 0) {
      // 只有大于0的索引才表示选中了点位
      const points = this.data.mapData.points || [];
      if (
        points[selectedPointIndex - 1] &&
        points[selectedPointIndex - 1].index
      ) {
        selectedPointId = points[selectedPointIndex - 1].index || 0;
      }
    }

    // 查找选中点位所在的聚合点ID（如果有）
    let selectedClusterId = 0;
    if (selectedPointId > 0) {
      for (const [clusterId, points] of Object.entries(clusterMap)) {
        if (points.some((p) => p.index === selectedPointId)) {
          selectedClusterId = parseInt(clusterId);
          break;
        }
      }
    }

    // 更新所有标记的样式
    const updatedMarkers = markers.map((marker) => {
      const isSelected =
        marker.id === selectedPointId || marker.id === selectedClusterId;
      return {
        ...marker,
        iconPath: isSelected ? MarkerStatusV2.SELECTED : MarkerStatusV2.DEFAULT,
      };
    });

    this.setData({
      markers: updatedMarkers,
    });
  },

  /**
   * 从列表选择点位
   */
  selectPoint: function (e: any) {
    const pointIndex = e.currentTarget.dataset.index;
    const pointsMap = this.data.pointsMap;

    if (!pointsMap || Object.keys(pointsMap).length === 0) return;

    // 查找点位详情 - 注意：现在pointIndex是从0开始的数组索引，而pointsMap的键是从1开始的
    const selectedPoint = pointsMap[pointIndex + 1];
    if (!selectedPoint) return;

    this.setData(
      {
        selectedPointIndex: pointIndex + 1, // 存储为从1开始的索引
        selectedPoint: selectedPoint,
      },
      () => {
        // 更新标记样式
        this.updateMarkerStyles();
      }
    );
  },

  /**
   * 复制文本
   */
  copyText(e: any) {
    const text = e.currentTarget.dataset.text;

    if (text) {
      wx.setClipboardData({
        data: text,
        success() {
          wx.showToast({
            title: "复制成功",
            icon: "success",
          });
        },
      });
    }
  },

  /**
   * 打开导航
   */
  navigateToLocation() {
    const { selectedPoint } = this.data;
    if (!selectedPoint) return;

    // 获取点位的经纬度
    const latitude =
      selectedPoint.latitude ||
      (selectedPoint.center ? selectedPoint.center.lat : 0);
    const longitude =
      selectedPoint.longitude ||
      (selectedPoint.center ? selectedPoint.center.lng : 0);

    if (latitude && longitude) {
      // 使用微信内置地图打开导航
      wx.openLocation({
        latitude,
        longitude,
        name: selectedPoint.name,
        address: selectedPoint.address || "",
        scale: 18,
      });
    } else {
      wx.showToast({
        title: "无法获取位置信息",
        icon: "none",
      });
    }
  },

  /**
   * 重置地图视图
   */
  resetMap: function () {
    const mapData = this.data.mapData;
    let initialLatitude = 30.274083;
    let initialLongitude = 120.15507;

    if (mapData.center) {
      initialLatitude = mapData.center.lat;
      initialLongitude = mapData.center.lng;
    } else if (mapData.points && mapData.points.length > 0) {
      // 如果没有中心点，使用第一个点的位置
      const firstPoint = mapData.points[0];
      initialLatitude = firstPoint.center.lat;
      initialLongitude = firstPoint.center.lng;
    }

    // 获取初始缩放级别
    const initialScale = mapData.zoom ? mapData.zoom[0] : 14;

    this.setData(
      {
        latitude: initialLatitude,
        longitude: initialLongitude,
        currentScale: initialScale, // 同步更新当前缩放级别
        scale: initialScale,
        selectedPointIndex: 0,
        selectedPoint: null,
      },
      () => {
        // 更新标记样式
        this.updateMarkerStyles();
        this.adjustClusterParameters();
      }
    );
  },

  /**
   * 标记点被点击
   */
  markerTap: function (e: any) {
    const markerId = e.markerId;
    console.log("标记点击:", markerId);

    // 检查是否正在更新聚类，如果是则忽略点击事件
    if ((this as any)._isUpdatingClusters) {
      console.log("正在更新聚类，忽略点击事件");
      return;
    }

    if ((this as any)._processingMarkerTap) {
      console.log("正在处理点击事件，忽略点击事件");
      return;
    }

    // 标记正在处理点击事件，避免重复触发
    (this as any)._processingMarkerTap = true;

    // 如果是聚合点（ID为负数）
    if (markerId < 0) {
      // 确保聚合点在当前clusterMap中存在
      if (!this.data.clusterMap[markerId]) {
        console.log("聚合点不存在于当前clusterMap中");
        (this as any)._processingMarkerTap = false;
        return;
      }

      // 获取当前缩放级别
      const compensation = 1.5;
      // 检查是否已达到最大缩放级别
      if (this.data.currentScale < this.data.maxScale - compensation) {
        // 未达到最大缩放，放大地图
        console.log("zoomToCluster");
        this.zoomToCluster(markerId);
      } else {
        // 已达到最大缩放，显示聚合点列表
        console.log("showClusterList");
        this.showClusterList(markerId);
      }
      (this as any)._processingMarkerTap = false;
    } else if (markerId > 0) {
      // 只处理大于0的标记ID，0表示未选择
      // 普通点位
      const pointsMap = this.data.pointsMap;
      if (pointsMap && pointsMap[markerId]) {
        // 清除聚合点选择状态
        this.clearClusterSelection();

        this.setData(
          {
            // 不切换到列表标签页，保持在地图上
            selectedPointIndex: markerId, // 直接使用markerId作为索引，因为已经是从1开始了
            selectedPoint: pointsMap[markerId],
          },
          () => {
            // 更新标记样式
            this.updateMarkerStyles();
          }
        );

        (this as any)._processingMarkerTap = false;
      }
    }
  },

  /**
   * 放大到聚类位置
   */
  zoomToCluster: function (clusterId: number) {
    const markers = this.data.markers;
    const marker = markers.find((m) => m.id === clusterId);

    if (!marker) return;

    // 获取当前缩放级别
    const currentMapScale = this.data.currentScale;
    // 放大到适当级别，但不超过最大缩放
    const compensation = 1.5;
    const newScale = Math.min(
      currentMapScale + 1,
      this.data.maxScale - compensation
    );

    // 设置新的中心点和缩放级别
    this.setData(
      {
        latitude: marker.latitude,
        longitude: marker.longitude,
        currentScale: newScale, // 同步更新当前缩放级别
        scale: newScale,
      },
      () => {
        this.adjustClusterParameters();
      }
    );
  },

  /**
   * 显示聚类点列表
   */
  showClusterList: function (clusterId: number) {
    const clusterPoints = this.data.clusterMap[clusterId];
    if (clusterPoints && clusterPoints.length > 0) {
      console.log(`聚合点包含 ${clusterPoints.length} 个位置`);

      // 显示聚合点列表到详情区域
      this.setData(
        {
          activeTab: "list", // 聚合点需要切换到列表选项卡以显示聚合内容
          clusterListVisible: true,
          clusterPoints: clusterPoints,
          selectedClusterPointIndex: -1, // 重置选中状态
        },
        () => {
          // 如果已经有选中的点位，检查该点位是否在聚合点列表中
          const selectedPointIndex = this.data.selectedPointIndex;
          if (selectedPointIndex > 0) {
            // 查找该点位在聚合列表中的索引
            const clusterPointIndex = clusterPoints.findIndex(
              (p) => p.index === selectedPointIndex
            );
            if (clusterPointIndex >= 0) {
              // 更新选中状态
              setTimeout(() => {
                this.setData(
                  {
                    selectedClusterPointIndex: clusterPointIndex,
                    scrollIntoClusterView: `cluster-point-${selectedPointIndex}`,
                  },
                  () => {
                    setTimeout(() => {
                      this.setData({
                        scrollIntoClusterView: "",
                      });
                    }, 300);
                  }
                );
              }, 100);
            }
          }
        }
      );
    }
  },

  /**
   * 清除聚合点选择状态
   */
  clearClusterSelection: function () {
    this.setData(
      {
        clusterListVisible: false,
        clusterPoints: [],
        selectedClusterPointIndex: -1,
        // 不重置selectedPointIndex，因为它可能指向一个普通点位
        scrollIntoClusterView: "",
      },
      () => {
        // 更新标记样式
        this.updateMarkerStyles();
      }
    );
  },

  /**
   * 退出聚合点选择
   */
  exitClusterSelection: function () {
    // 保存当前选中的点位索引(如果有的话)
    const selectedIndex = this.data.selectedPointIndex;

    // 清除聚合选择状态
    this.clearClusterSelection();

    // 保持在列表标签页
    this.setData({
      activeTab: "list",
    });

    // 如果有选中的点位，滚动到该点位
    if (selectedIndex > 0) {
      // 使用setTimeout确保DOM更新后再滚动
      setTimeout(() => {
        this.setData(
          {
            scrollIntoView: `point-${selectedIndex}`,
          },
          () => {
            // 延迟清除scrollIntoView，避免影响后续操作
            setTimeout(() => {
              this.setData({
                scrollIntoView: "",
              });
            }, 300);
          }
        );
      }, 100);
    }
  },

  /**
   * 从聚合列表中选择点位
   */
  selectClusterPoint: function (e: any) {
    const index = e.currentTarget.dataset.index;
    const pointId = e.currentTarget.dataset.pointId; // 获取点位的原始ID
    const clusterPoints = this.data.clusterPoints || [];

    if (index >= 0 && index < clusterPoints.length) {
      const selectedPoint = clusterPoints[index];

      // 设置选中的点位，但不隐藏聚合列表
      this.setData(
        {
          selectedPoint: selectedPoint,
          selectedPointIndex: pointId, // 使用点位的原始ID
          selectedClusterPointIndex: index, // 同时记录数组索引，方便其他操作
        },
        () => {
          // 更新标记样式
          this.updateMarkerStyles();

          // 立即滚动到聚合列表中的该项
          this.setData(
            {
              scrollIntoClusterView: `cluster-point-${pointId}`,
            },
            () => {
              // 延迟清除滚动视图ID
              setTimeout(() => {
                this.setData({
                  scrollIntoClusterView: "",
                });
              }, 300);
            }
          );
        }
      );
    }
  },

  /**
   * 设置地图缩放级别
   * @param e 事件对象，可以从data-scale获取缩放值
   */
  setScale: function (e: any) {
    // 从事件数据中获取缩放级别，如果没有则保持当前值
    let newScale = this.data.currentScale;
    if (
      e &&
      e.currentTarget &&
      e.currentTarget.dataset &&
      e.currentTarget.dataset.scale !== undefined
    ) {
      newScale = parseFloat(e.currentTarget.dataset.scale);
    }

    // 确保缩放级别在有效范围内
    const validScale = Math.max(
      this.data.minScale,
      Math.min(this.data.maxScale, newScale)
    );

    if (validScale == this.data.currentScale) {
      return;
    }

    // 更新缩放级别
    this.setData(
      {
        scale: validScale,
        currentScale: validScale, // 同步更新当前缩放级别
      },
      () => {
        this.adjustClusterParameters();
        wx.showToast({
          title: `缩放级别: ${validScale.toFixed(1)}`,
          icon: "none",
        });
      }
    );
  },
});
