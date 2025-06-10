import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  MapViewerProps,
  MapViewerRef,
  MapPoint,
  FilterState,
  MapData,
  StandardMapData,
  DataPoint,
} from "../types";
import { MetaMap } from "../utils/metaMap";
import "./MapViewer.css";

// 聚类相关导入
import {
  ClusterManager,
  Point as ClusterBasePoint,
  Cluster,
  CoordinateSystem,
  ClusterOptions,
} from "../clusters/cluster_manager";

// 腾讯地图API导入
import { MultiMarker, BaseMap, MultiLabel } from "tlbs-map-react";

// 聚类算法类型
enum ClusterAlgorithmType {
  DISTANCE = "distance",
  NONE = "none", // 不使用聚类
}

// 缩放级别对应的聚类半径映射
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

// 聚类项目接口
interface ClusterItem extends ClusterBasePoint {
  id: string;
  name: string;
  point: MapPoint;
}

// 简单的距离聚类管理器实现
class DistanceClusterManager extends ClusterManager<ClusterItem> {
  protected performClustering(
    points: ClusterItem[],
    options: ClusterOptions
  ): Cluster<ClusterItem>[] {
    if (points.length === 0) return [];

    const clusters: Cluster<ClusterItem>[] = [];
    const used = new Set<string>();

    for (const point of points) {
      if (used.has(point.id)) continue;

      const clusterPoints: ClusterItem[] = [point];
      used.add(point.id);

      // 查找附近的点
      for (const otherPoint of points) {
        if (used.has(otherPoint.id)) continue;

        const distance = this.calculateHaversineDistance(point, otherPoint);
        if (distance <= (options.radius || 100)) {
          clusterPoints.push(otherPoint);
          used.add(otherPoint.id);
        }
      }

      // 创建聚类
      const center = this.calculateClusterCenter(clusterPoints);
      clusters.push({
        center,
        points: clusterPoints,
        radius: options.radius || 100,
        id: `cluster_${clusters.length}`,
      });
    }

    return clusters;
  }
}

// 确保Font Awesome样式可用
if (
  typeof document !== "undefined" &&
  !document.querySelector('link[href*="font-awesome"]')
) {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href =
    "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css";
  document.head.appendChild(link);
}

// 腾讯地图API密钥
const TENCENT_MAP_API_KEY = "T3ABZ-2VOLB-ZVTU2-NYO2E-C7K2O-RKBQJ";

// Base64图标数据
const MARKER_ICON_DEFAULT =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAC4jAAAuIwF4pT92AAAF8WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDggNzkuMTY0MDM2LCAyMDE5LzA4LzEzLTAxOjA2OjU3ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjEuMCAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDI1LTA1LTE4VDE1OjM1OjE5KzA4OjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDI1LTA1LTE4VDE1OjM1OjE5KzA4OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyNS0wNS0xOFQxNTozNToxOSswODowMCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpjMDQzYmJjMC04ZTU2LTA4NGEtYjA3Zi01MGYwNmI1ZTU4YmQiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDpmODFiYmYyNy0yMWU3LTM5NDctODhkZC1mMTNkMjY5Y2YwNjUiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDpkNjdiODU3NS05MzA4LTU4NGYtYmZiNS0xMTc1ZmY1NWNkZjYiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0ic1JHQiBJRUM2MTk2Ni0yLjEiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOmQ2N2I4NTc1LTkzMDgtNTg0Zi1iZmI1LTExNzVmZjU1Y2RmNiIgc3RFdnQ6d2hlbj0iMjAyNS0wNS0xOFQxNTozNToxOSswODowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIxLjAgKFdpbmRvd3MpIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDpjMDQzYmJjMC04ZTU2LTA4NGEtYjA3Zi01MGYwNmI1ZTU4YmQiIHN0RXZ0OndoZW49IjIwMjUtMDUtMThUMTU6MzU6MTkrMDg6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMS4wIChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4eUCE2AAACsklEQVRIia2WT0iTYRzHP3vanFtuzmqjWRi0DDMvBeohmxl6CnpPWhQdgv4cIuIlwg528mAeagfxEgZCYm2ddu6vL3mwoA4lRrKlZSbO0rbp5t7xrsteqWiW+n6Pvwc+Hx4e+H0fU8udHIUSCPsrgFNAE1ANuAEVmAImgedAUJaUj4UYpr8J8uCbSxZH2+udzZvee+qYLt1D3LoFs6ZSmp7DnfxM1exLDk491uxqIghclyXl0z8FgbD/eFYUDTzae8Yx5Gtj2WwreEMAazZFYyREy4d7SbOWuSBLyv2CgkDYf+W7ffvtu/VdYtrpWxX8Z7zxKOdGrue2LM1clSUloM/FL/ATCzZ3oKehd81wgK/O3fQ09JoWbO5bgbD/xG+CQNhfkRVFff21naYFm3vNcD0LNjf9tZ2mrCjqy7/jyg26hnytJZNl1euG65ksq2bI11oCdAOY3h07vGvJ4oh2toRE2rJ5wwKAYnWRG4/aNLua2C2Ak6PbDxkGB0hbNvNmZ7MATgqg6a23wTC4njFPHUCTAGo+u6oMF3wprQSoEcC2hLXMcEGe6RYAZk01XKBHAHPO9DfDwY7leYCYAEa9iYLLcN3Z8WMc4J0Anu6fGTZcsG/2JcAzAQRrZoa1YnXRMHixusiBqccaEBSypEzYM/FQ8/iAYYLm8QHsaiIkS8qEvovaGyMPkxXzYxuGV8yP0Rh5mATaIb/sZEn5ZNYy58++6si5UrF1w12pGGdfdeTMWua83m4rfSBLygNXKiZffnFJK49H1gz3xqNcfnEp50rFrsmS8kCfF6zMIV+r40nlaVKWklXBNjXJ0fFBjkRCSbOWuShLyuCv56uVfne+9MV7Tz3TpT7i1q0AOJe/Uf4jQtXsiF76IaD9v0r/LyL927If8OSPZoFR4BkQkiUlWojxE+S6D1X97GenAAAAAElFTkSuQmCC";
const MARKER_ICON_SELECTED =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAC4jAAAuIwF4pT92AAAF8WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDggNzkuMTY0MDM2LCAyMDE5LzA4LzEzLTAxOjA2OjU3ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjEuMCAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDI1LTA1LTE4VDE2OjM0OjEyKzA4OjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDI1LTA1LTE4VDE2OjM0OjEyKzA4OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyNS0wNS0xOFQxNjozNDoxMiswODowMCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo1NzM0NzJlNS0wMzhiLWFkNGMtYjQ3ZC0yZWFjY2ZlODRmMzQiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDo2MGIxOGExYy1lNzU2LTU0NDYtOGM4MC0xMjI3NzIyNTgyZjYiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo5MzA1ZDU3ZC0yMDY2LTY3NGYtYTA1NS0wZTVhMmJmNWZlYjQiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0ic1JHQiBJRUM2MTk2Ni0yLjEiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjkzMDVkNTdkLTIwNjYtNjc0Zi1hMDU1LTBlNWEyYmY1ZmViNCIgc3RFdnQ6d2hlbj0iMjAyNS0wNS0xOFQxNjozNDoxMiswODowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIxLjAgKFdpbmRvd3MpIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo1NzM0NzJlNS0wMzhiLWFkNGMtYjQ3ZC0yZWFjY2ZlODRmMzQiIHN0RXZ0OndoZW49IjIwMjUtMDUtMThUMTY6MzQ6MTIrMDg6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMS4wIChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz5VDH8EAAAChUlEQVRIia2Wv0sbYRjHP/d6yUWTuyw1ooOFiA6NawTFxX+gi1Clg7jYDg7FoVjexe1ah9Kpm1PoDxWk/0HtFETXZhJTK0UwFqG5U3Pxcm8HPbFitOo94/vA5/M+vPB8X03NzdGsqrbdDTwFRoBHQDtwAvwCfgLfgCVLyh/NGNpVgjPwGy2ReBLL5Vr0bBbR0YFIJlGNBspxCA4O8MtlTkqlQNVqS8ArS8qdGwVV236Mrn8whobM+MAAWjzedEIAVa9TX1/HKxZdfP+ZJeXni31xCf5CpNNfkpOTpjE8fCMcQIvHMYaHSU1OpkQ6/bFq2zNXCqq2PSZM813bxIRoyWRuBF8ukcnQNjGhCdN8W7XtsX8EVdvuRtcXWkdHNWGat4afw0yT1tFRDV1fOHvH8wleG/l8qqWr687wsFq6ujDy+RQwD6D9icUeaolEOTU9LTTDuLcAQHke7vv3garVsgIY13t7I4MDaIZBLJcTwLgARmJ9fZHBw9KzWYARAfSLzs7IBaKjA6BfAA9EMhm94JTZLgBUoxG54FwE/FauGzk4ODwE2BdAqbG/H71gbw/guwC++pubkQv8chlgVQBL/uZmoDwvMrjyPE5KpQBYEpaU2+r4eLleLEYmqBeLqFpt2ZJyO9xFs97GhtvY3b03vLG7i7ex4QKzcLbsLCl38P2p45UVFTjOneGB43C8sqLw/akw3c7zwJJyMXCcmaNCIWhUKreHVyocFQoqcJyXlpSL4XnzyMznzfjgIFoicS1Y1WrU19bw1tddfP+5JeWni/3rQn/+LPSF3tODyGQQqdTpbV2XoFLB39oKQ38ZmP2v0L9CFH5bckCYpRWgBKwCy5aU5WaMv+OBCH36scpNAAAAAElFTkSuQmCC";

// 标记样式配置
const markerStyles = {
  default: {
    width: 24,
    height: 24,
    anchor: { x: 12, y: 24 },
    src: MARKER_ICON_DEFAULT,
  },
  selected: {
    width: 24,
    height: 24,
    anchor: { x: 12, y: 24 },
    src: MARKER_ICON_SELECTED,
  },
};

// 聚类标记样式
const labelStyles = {
  clusterLabel: {
    color: "#FFFFFF",
    size: 12,
    offset: { x: 0, y: -10 },
    angle: 0,
    alignment: "center" as const,
    verticalAlignment: "middle" as const,
  },
};

const MapViewer = forwardRef<MapViewerRef, MapViewerProps>(({
  mapData,
  className = "",
  style = {},
  onPointSelect,
  onMapReady,
  defaultView = "map",
}, ref) => {
  // 基本状态管理
  // points 通过 pointsRef 管理，不使用状态
  const [filteredPoints, setFilteredPoints] = useState<MapPoint[]>([]);
  const [availableFilters, setAvailableFilters] = useState<FilterState>({});
  const [filterState, setFilterState] = useState<{
    inclusive: FilterState;
    exclusive: FilterState;
  }>({
    inclusive: {},
    exclusive: {},
  });
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  // selectedPointIndex 通过 selectedPointIndexRef 管理，不使用状态
  const [activeTab, setActiveTab] = useState<"map" | "list">(defaultView);
  const [filterExpanded, setFilterExpanded] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [mapLoading, setMapLoading] = useState<boolean>(true); // 地图加载状态

  // 地图相关状态
  const [mapCenter, setCurrentCenter] = useState<{ lat: number; lng: number }>({
    lat: 39.9042,
    lng: 116.4074,
  });
  const [currentScale, setCurrentScale] = useState<number>(10);
  const [minScale] = useState<number>(3);
  const [maxScale] = useState<number>(18);

  // 地图事件状态

  // 聚类配置参数 - 使用 ref 管理，避免不必要的重新渲染
  const clusterEnabledRef = useRef<boolean>(true);
  const clusterAlgorithmRef = useRef<ClusterAlgorithmType>(ClusterAlgorithmType.DISTANCE);
  const clusterMinPointsRef = useRef<number>(2);
  const clusterFactorRef = useRef<number>(1.2);
  // clusters 使用 ref 管理，避免不必要的重新渲染
  const clustersRef = useRef<Cluster<ClusterItem>[]>([]);
  const [markers, setMarkers] = useState<any[]>([]); // 地图标记状态
  // clusterMap 使用 ref 管理，避免不必要的重新渲染
  const clusterMapRef = useRef<{ [key: string]: MapPoint[] }>({});
  const [clusterLabels, setClusterLabels] = useState<any[]>([]); // 聚类数字标签

  // 聚类列表相关状态
  const [clusterListVisible, setClusterListVisible] = useState<boolean>(false);
  const [clusterPoints, setClusterPoints] = useState<MapPoint[]>([]);
  const [selectedClusterPointIndex, setSelectedClusterPointIndex] =
    useState<number>(-1);

  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const boundsChangeTimerRef = useRef<number | null>(null); // 防抖定时器
  const clusterManagerRef = useRef<ClusterManager<ClusterItem> | null>(null);
  const processingMarkerTapRef = useRef<boolean>(false); // 防止重复处理点击事件
  const isUpdatingClustersRef = useRef<boolean>(false); // 防止聚类更新期间的点击事件
  const clusterRadiusRef = useRef<number>(100); // 聚类半径（米）
  
  // Point 相关的 ref，避免不必要的重新渲染
  const pointsRef = useRef<MapPoint[]>([]);
  const filteredPointsRef = useRef<MapPoint[]>([]);
  const selectedPointIndexRef = useRef<number | null>(null);

  // 检查是否有筛选器
  const hasFilters = useMemo(() => {
    return Object.keys(availableFilters).length > 0;
  }, [availableFilters]);

  // 获取标签的分类 - 从mapData.filter中获取
  const getCategoryForTag = useCallback(
    (tag: string): string => {
      if (mapData.filter) {
        // 检查inclusive筛选器
        for (const [category, tags] of Object.entries(
          mapData.filter.inclusive
        )) {
          if (Array.isArray(tags) && tags.includes(tag)) {
            return category;
          }
        }
        // 检查exclusive筛选器
        for (const [category, tags] of Object.entries(
          mapData.filter.exclusive
        )) {
          if (Array.isArray(tags) && tags.includes(tag)) {
            return category;
          }
        }
      }
      // 如果在filter中找不到，返回默认分类
      return "其他";
    },
    [mapData.filter]
  );

  // 初始化数据和筛选器
  useEffect(() => {
    let metaMap: MetaMap;

    try {
      setLoading(true);

      if ("data" in mapData && Array.isArray(mapData.data)) {
        metaMap = new MetaMap(mapData as StandardMapData);
      } else {
        metaMap = new MetaMap(mapData as MapData);
      }

      const convertedPoints = metaMap.getAllDataPoints().map(
        (point: DataPoint, index: number): MapPoint => ({
          ...point,
          latitude: point.center.lat,
          longitude: point.center.lng,
          index: index + 1,
        })
      );

      pointsRef.current = convertedPoints;
      setFilteredPoints(convertedPoints);

      // 生成可用筛选器
      const newAvailableFilters: FilterState = {};
      const initialInclusiveState: FilterState = {};
      const initialExclusiveState: FilterState = {};

      convertedPoints.forEach((point) => {
        if (point.tags) {
          point.tags.forEach((tag) => {
            const category = getCategoryForTag(tag);

            if (!newAvailableFilters[category]) {
              newAvailableFilters[category] = {};
              initialInclusiveState[category] = {};
              initialExclusiveState[category] = {};
            }

            if (!newAvailableFilters[category][tag]) {
              newAvailableFilters[category][tag] = true;
              initialInclusiveState[category][tag] = true;
              initialExclusiveState[category][tag] = false;
            }
          });
        }
      });

      setAvailableFilters(newAvailableFilters);
      setFilterState({
        inclusive: initialInclusiveState,
        exclusive: initialExclusiveState,
      });

      setLoading(false);
    } catch (error) {
      console.error("地图数据初始化失败:", error);
      setLoading(false);
    }
  }, [mapData, getCategoryForTag]);

  // 应用筛选器
  const applyFilters = useCallback(() => {
    return pointsRef.current.filter((point) => {
      if (!point.tags) return true;

      // 检查 inclusive 筛选器
      for (const [category, filters] of Object.entries(filterState.inclusive)) {
        const activeFilters = Object.entries(filters)
          .filter(([_, active]) => active)
          .map(([value, _]) => value);
        if (activeFilters.length > 0) {
          const hasMatchingTag = activeFilters.some((filter) =>
            point.tags!.includes(filter)
          );
          if (!hasMatchingTag) return false;
        }
      }

      // 检查 exclusive 筛选器
      for (const [category, filters] of Object.entries(filterState.exclusive)) {
        const activeFilters = Object.entries(filters)
          .filter(([_, active]) => active)
          .map(([value, _]) => value);
        if (activeFilters.length > 0) {
          const hasMatchingTag = activeFilters.some((filter) =>
            point.tags!.includes(filter)
          );
          if (!hasMatchingTag) return false;
        }
      }

      return true;
    });
  }, [filterState]); // 移除 points 依赖，使用 ref

  // 更新筛选后的点位
  // 创建一个 ref 来存储当前选中的点位，避免在筛选 useEffect 中产生依赖
  const selectedPointRef = useRef(selectedPoint);
  selectedPointRef.current = selectedPoint;

  // 筛选points并初始化聚类 - 只响应筛选条件变化
  useEffect(() => {
    console.log("🔄 筛选和聚类初始化 useEffect 触发（仅响应筛选变化）");
    
    const filtered = applyFilters();
    setFilteredPoints(filtered);

    // 检查当前选中的点位是否在筛选结果中，如果不在则清除选择
    const currentSelectedPoint = selectedPointRef.current;
    if (
      currentSelectedPoint &&
      !filtered.find((p) => p.index === currentSelectedPoint.index)
    ) {
      console.log("🔄 选中点位不在筛选结果中，清除选择");
      setSelectedPoint(null);
      selectedPointIndexRef.current = null;
    }

    // 延迟执行聚类初始化，确保 initClustering 已定义
    setTimeout(() => {
      initClustering(filtered);
    }, 0);
  }, [applyFilters]);

  // 统一的标记和聚类地图更新函数 - 确保两者始终同步更新
  const updateMarkersAndClusterMap = useCallback(
    (newMarkers: any[], newClusterMap: { [key: string]: MapPoint[] }) => {
      console.log("🔄 updateMarkersAndClusterMap 被调用:", {
        markersCount: newMarkers.length,
        clusterMapKeys: Object.keys(newClusterMap),
      });

      // 原子性地更新标记状态和聚类映射ref
      setMarkers(newMarkers);
      clusterMapRef.current = newClusterMap;
    },
    []
  );

  // 仅更新标记样式的函数（用于选中状态变化）- 参考 map_v2.ts 实现
  const updateMarkerStyles = useCallback(() => {
    console.log("🎨 updateMarkerStyles 开始执行");
    
    if (!markers || markers.length === 0) {
      console.log("🎨 没有标记，跳过样式更新");
      return;
    }

    // 获取选中点位的ID（如果有）
    let selectedPointId = 0;
    if (selectedPoint && selectedPoint.index) {
      selectedPointId = selectedPoint.index;
    } else if (selectedPointIndexRef.current && selectedPointIndexRef.current > 0) {
      selectedPointId = selectedPointIndexRef.current;
    }

    // 查找选中点位所在的聚合点ID（如果有）
    let selectedClusterId = "";
    if (selectedPointId > 0) {
      for (const [clusterId, points] of Object.entries(clusterMapRef.current)) {
        if (points.some((p: MapPoint) => p.index === selectedPointId)) {
          selectedClusterId = clusterId;
          break;
        }
      }
    }

    console.log("🎨 选中状态:", {
      selectedPointId,
      selectedClusterId,
      selectedPoint: selectedPoint?.name,
    });

    // 检查是否需要更新样式（避免不必要的更新）
    let needsUpdate = false;
    const updatedMarkers = markers.map((marker) => {
      let isSelected = false;

      if (marker.id.startsWith("marker-")) {
        const markerId = parseInt(marker.id.replace("marker-", ""));
        isSelected = markerId === selectedPointId;
      } else if (marker.id.startsWith("cluster-")) {
        const clusterId = marker.id.replace("cluster-", "");
        isSelected = clusterId === selectedClusterId;
      }

      const newStyleId = isSelected ? "selected" : "default";
      if (marker.styleId !== newStyleId) {
        needsUpdate = true;
      }

      return {
        ...marker,
        styleId: newStyleId,
      };
    });

    // 只在确实需要更新时才调用 setMarkers
    if (needsUpdate) {
      console.log("🎨 样式需要更新，应用新样式");
      setMarkers(updatedMarkers);
    } else {
      console.log("🎨 样式无需更新");
    }
  }, [markers, selectedPoint]); // 移除 selectedPointIndex 和 clusterMap 依赖，使用 ref

  // 当选中状态变化时更新标记样式 - 参考 map_v2.ts 实现
  // useEffect(() => {
  //   console.log("🎨 选中状态变化，触发样式更新 useEffect");
  //   updateMarkerStyles();
  // }, [updateMarkerStyles]);

  // 生成腾讯地图标记 - 直接使用状态中的markers
  const tencentMarkers = useMemo(() => {
    return markers;
  }, [markers]);

  // 筛选器切换处理
  const handleInclusiveFilterTap = useCallback(
    (category: string, value: string) => {
      setFilterState((prev) => ({
        ...prev,
        inclusive: {
          ...prev.inclusive,
          [category]: {
            ...prev.inclusive[category],
            [value]: !prev.inclusive[category][value],
          },
        },
      }));
    },
    []
  );

  const handleExclusiveFilterTap = useCallback(
    (category: string, value: string) => {
      setFilterState((prev) => {
        const newState = { ...prev };

        // exclusive 是单选模式
        Object.keys(newState.exclusive[category] || {}).forEach((key) => {
          newState.exclusive[category][key] =
            key === value ? !newState.exclusive[category][key] : false;
        });

        return newState;
      });
    },
    []
  );

  // 重置筛选器
  const resetFilters = useCallback(() => {
    const newInclusiveState: FilterState = {};
    const newExclusiveState: FilterState = {};

    pointsRef.current.forEach((point) => {
      if (point.tags) {
        point.tags.forEach((tag) => {
          const category = getCategoryForTag(tag);

          if (!newInclusiveState[category]) {
            newInclusiveState[category] = {};
            newExclusiveState[category] = {};
          }

          if (!newInclusiveState[category][tag]) {
            newInclusiveState[category][tag] = true;
            newExclusiveState[category][tag] = false;
          }
        });
      }
    });

    setFilterState({
      inclusive: newInclusiveState,
      exclusive: newExclusiveState,
    });
  }, [getCategoryForTag]); // 移除 points 依赖，使用 ref

  // 切换筛选器展开状态
  const toggleFilter = useCallback(() => {
    setFilterExpanded(!filterExpanded);
  }, [filterExpanded]);

  // Tab切换
  const onTabChange = useCallback((value: string) => {
    setActiveTab(value as "map" | "list");
  }, []);

  // 点位选择
  const selectPoint = useCallback(
    (point: MapPoint, index: number) => {
      setSelectedPoint(point);
      selectedPointIndexRef.current = point.index || null;
      onPointSelect?.(point);

      // 更新地图中心
      setCurrentCenter({ lat: point.latitude, lng: point.longitude });
      if (mapRef.current?.setCenter) {
        mapRef.current.setCenter({ lat: point.latitude, lng: point.longitude });
      }
      
      // 参考 map_v2.ts，在选中点位后更新样式
      setTimeout(() => {
        updateMarkerStyles();
      }, 0);
    },
    [onPointSelect, updateMarkerStyles]
  );

  // 清除聚类选择状态
  const clearClusterSelection = useCallback(() => {
    setClusterListVisible(false);
    setClusterPoints([]);
    setSelectedClusterPointIndex(-1);
  }, []);

  // 放大到聚类位置
  const zoomToCluster = useCallback(
    (clusterId: string) => {
      console.log("🔍 zoomToCluster 开始执行，clusterId:", clusterId);
      
      const cluster = clustersRef.current.find((c: Cluster<ClusterItem>) => c.id === clusterId);
      if (!cluster) return;

      // 获取当前缩放级别
      const currentMapScale = mapRef.current?.getZoom() || currentScale;
      // 放大到适当级别，但不超过最大缩放
      const compensation = 1.5;
      const newScale = Math.min(currentMapScale + 1, maxScale - compensation);

      console.log("🔍 缩放信息:", {
        currentScale: currentMapScale,
        newScale,
        center: { lat: cluster.center.y, lng: cluster.center.x }
      });

      // 设置新的中心点和缩放级别
      setCurrentCenter({
        lat: cluster.center.y,
        lng: cluster.center.x,
      });
      if (mapRef.current?.setCenter) {
        mapRef.current.setCenter(
          {
            lat: cluster.center.y,
            lng: cluster.center.x,
          },
          { duration: 200 }
        );
      }
      setCurrentScale(newScale);

      // 使用地图API直接设置缩放级别
      if (mapRef.current?.setZoom) {
        mapRef.current.setZoom(newScale, { duration: 200 });
      }
      
      console.log("🔍 zoomToCluster 执行完成");
    },
    [currentScale, maxScale] // 移除 clusters 依赖，使用 ref
  );

  // 显示聚类点列表
  const showClusterList = useCallback(
    (clusterId: string) => {
      const clusterPointsData = clusterMapRef.current[clusterId];
      if (clusterPointsData && clusterPointsData.length > 0) {
        console.log(`聚合点包含 ${clusterPointsData.length} 个位置`);

        // 显示聚合点列表到详情区域
        setClusterListVisible(true);
        setClusterPoints(clusterPointsData);
        setSelectedClusterPointIndex(-1); // 重置选中状态
        setActiveTab("list"); // 聚合点需要切换到列表选项卡以显示聚合内容

        // 如果已经有选中的点位，检查该点位是否在聚合点列表中
        if (selectedPointIndexRef.current) {
          const clusterPointIndex = clusterPointsData.findIndex(
            (p) => p.index === selectedPointIndexRef.current
          );
          if (clusterPointIndex >= 0) {
            // 更新选中状态
            setTimeout(() => {
              setSelectedClusterPointIndex(clusterPointIndex);
            }, 100);
          }
        }
      }
    },
    [] // 移除 clusterMap 和 selectedPointIndex 依赖，使用 ref
  );

  // 标记点击处理
  const markerTap = useCallback(
    (event: any) => {
      try {
        const clickedMarkerId = event.geometry.id;
        console.log("🎯 标记点击:", clickedMarkerId);

        // 检查是否正在更新聚类，如果是则忽略点击事件
        if (isUpdatingClustersRef.current) {
          console.log("正在更新聚类，忽略点击事件");
          return;
        }

        // 检查是否正在处理点击事件，避免重复触发
        if (processingMarkerTapRef.current) {
          console.log("正在处理点击事件，忽略点击事件");
          return;
        }

        // 标记正在处理点击事件
        processingMarkerTapRef.current = true;

        if (clickedMarkerId.startsWith("cluster-")) {
          // 聚类标记点击
          const clusterId = clickedMarkerId.replace("cluster-", "");

          // 确保聚类点在当前clusterMap中存在
          if (!clusterMapRef.current[clusterId]) {
            console.warn("聚类点不存在于当前clusterMap中", {
              clickedClusterId: clusterId,
              availableClusterIds: Object.keys(clusterMapRef.current),
              currentMarkersCount: markers.length,
              clusterMapKeysCount: Object.keys(clusterMapRef.current).length,
            });
            processingMarkerTapRef.current = false;
            return;
          }

          // 获取当前缩放级别
          const currentMapScale = mapRef.current?.getZoom() || currentScale;
          const compensation = 1.5;

          // 检查是否已达到最大缩放级别
          if (currentMapScale < maxScale - compensation) {
            // 未达到最大缩放，放大地图
            console.log("📍 执行 zoomToCluster");
            zoomToCluster(clusterId);
          } else {
            // 已达到最大缩放，显示聚类点列表
            console.log("📋 执行 showClusterList");
            showClusterList(clusterId);
          }

          processingMarkerTapRef.current = false;
        } else if (clickedMarkerId.startsWith("marker-")) {
          // 普通点位
          const pointIndex = parseInt(clickedMarkerId.split("-")[1]);
          const point = filteredPointsRef.current.find((p) => p.index === pointIndex);
          if (point) {
            // 清除聚类选择状态
            clearClusterSelection();
            selectPoint(point, pointIndex - 1);
          }

          processingMarkerTapRef.current = false;
        }
      } catch (error) {
        console.warn("处理标记点击事件失败:", error);
        processingMarkerTapRef.current = false;
      }
    },
    [
      filteredPoints,
      selectPoint,
      maxScale,
      currentScale,
      zoomToCluster,
      showClusterList,
      clearClusterSelection,
    ] // 移除 clusterMap 和 clusters 依赖，使用 ref
  );

  // 重置地图
  const resetMap = useCallback(() => {
    // 确定初始中心点
    let initialCenter = mapData.center;
    if (!initialCenter && pointsRef.current.length > 0) {
      // 如果没有设置中心点，使用第一个点位的位置
      initialCenter = {
        lat: pointsRef.current[0].latitude,
        lng: pointsRef.current[0].longitude,
      };
    }
    // 默认中心点
    if (!initialCenter) {
      initialCenter = { lat: 39.9042, lng: 116.4074 };
    }

    const initialZoom = mapData.zoom?.[0] || 10;

    console.log("重置地图到初始状态:", {
      center: initialCenter,
      zoom: initialZoom,
    });

    // 直接更新状态，让React重新渲染地图
    setCurrentCenter(initialCenter);
    setCurrentScale(initialZoom);

    // 使用地图API设置中心点
    if (mapRef.current?.setCenter) {
      mapRef.current.setCenter(initialCenter, { duration: 200 });
    }

    // 使用地图API直接设置缩放级别
    if (mapRef.current?.setZoom) {
      mapRef.current.setZoom(initialZoom, { duration: 200 });
    }

    // 重置选中状态
    setSelectedPoint(null);
    selectedPointIndexRef.current = null;
    
    // 参考 map_v2.ts，在重置后更新样式
    setTimeout(() => {
      updateMarkerStyles();
    }, 100);
  }, [mapData, updateMarkerStyles]); // 移除 points 依赖，使用 ref

  // 导航到位置
  const navigateToLocation = useCallback(() => {
    if (selectedPoint) {
      const url = `https://uri.amap.com/marker?position=${
        selectedPoint.longitude
      },${selectedPoint.latitude}&name=${encodeURIComponent(
        selectedPoint.name
      )}`;
      window.open(url, "_blank");
    }
  }, [selectedPoint]);

  // 复制文本
  const copyText = useCallback((text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          console.log("文本已复制:", text);
        })
        .catch((err) => {
          console.error("复制失败:", err);
        });
    }
  }, []);

  // 初始化聚类管理器
  const initClustering = useCallback(
    (filteredPoints: MapPoint[]) => {
      console.log("🏗️ initClustering 开始执行，点位数量:", filteredPoints.length);
      
      // 将点位数据转换为聚类管理器需要的格式
      const clusterPoints: ClusterItem[] = filteredPoints.map(
        (point, index) => ({
          id: `point_${point.index || index}`,
          name: point.name,
          x: point.longitude, // 经度
          y: point.latitude, // 纬度
          weight: 1,
          point: point,
        })
      );

              // 创建聚类管理器
      if (clusterAlgorithmRef.current === ClusterAlgorithmType.DISTANCE) {
        clusterManagerRef.current = new DistanceClusterManager({
          radius: clusterRadiusRef.current,
          minPoints: clusterMinPointsRef.current,
          coordinateSystem: CoordinateSystem.GCJ02,
        });
      } else {
        clusterManagerRef.current = null;
      }

      if (clusterManagerRef.current && clusterEnabledRef.current) {
        // 更新点数据并执行聚类
        const clusterResults =
          clusterManagerRef.current.updatePoints(clusterPoints);
        clustersRef.current = clusterResults;
        handleClusterUpdate(clusterResults);
      } else {
        // 如果不使用聚类，直接创建标记
        const directClusters = clusterPoints.map((point) => ({
          center: point,
          points: [point],
          radius: 0,
          id: point.id,
        }));
        clustersRef.current = directClusters;
        handleClusterUpdate(directClusters);
      }
    },
    [] // 移除所有依赖，现在都使用 ref 管理
  );

  // 处理聚类更新
  const handleClusterUpdate = useCallback(
    (clusterResults: Cluster<ClusterItem>[]) => {
      console.log("🎯 handleClusterUpdate 被调用，聚类数量:", clusterResults.length);
      
      // 处理聚类结果，转换为地图标记格式
      const newMarkers: any[] = [];
      const newClusterMap: { [key: string]: MapPoint[] } = {};

      clusterResults.forEach((cluster, index) => {
        const isCluster = cluster.points.length > 1;
        const center = cluster.center;

        if (isCluster) {
          // 聚类标记
          const clusterId = cluster.id || `cluster_${index}`;
          newClusterMap[clusterId] = cluster.points.map(
            (p: ClusterItem) => p.point
          );

          newMarkers.push({
            id: `cluster-${clusterId}`,
            styleId: "default",
            position: {
              lat: center.y,
              lng: center.x,
            },
            properties: {
              clusterSize: cluster.points.length,
              isCluster: true,
            },
          });
        } else {
          // 单个点标记
          const point = cluster.points[0].point;
          newMarkers.push({
            id: `marker-${point.index}`,
            styleId: "default",
            position: {
              lat: point.latitude,
              lng: point.longitude,
            },
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

      // 更新聚类标签
      const labels: any[] = [];
      clusterResults.forEach((cluster) => {
        if (cluster.points.length > 1) {
          const clusterCenter = cluster.center;
          labels.push({
            id: `label-${cluster.id}`,
            styleId: "clusterLabel",
            position: {
              lat: clusterCenter.y,
              lng: clusterCenter.x,
            },
            content: cluster.points.length.toString(),
          });
        }
      });

      // 更新地图标记 - 确保 markers 和 clusterMap 同步更新
      updateMarkersAndClusterMap(newMarkers, newClusterMap);
      setClusterLabels(labels);
      
      // 参考 map_v2.ts，在标记更新后调用样式更新
      setTimeout(() => {
        updateMarkerStyles();
      }, 0);
    },
    [updateMarkersAndClusterMap, updateMarkerStyles]
  );

  // 移除 points 的同步 useEffect，现在直接使用 ref

  useEffect(() => {
    filteredPointsRef.current = filteredPoints;
  }, [filteredPoints]);

  // 移除 selectedPointIndex 的同步 useEffect，现在直接使用 ref

  // 根据当前缩放级别动态调整聚类参数
  const adjustClusterParameters = useCallback(() => {
    if (!clusterEnabledRef.current) {
      return;
    }

    // 获取当前缩放级别
    const currentMapScale = mapRef.current?.getZoom() || currentScale;
    
    // 计算聚类半径
    const roundedScale = Math.ceil(currentMapScale).toString();
    let newClusterRadius = 100; // 默认值
    
    if (MAP_SCALE_TO_RATIO[roundedScale as keyof typeof MAP_SCALE_TO_RATIO]) {
      newClusterRadius =
        MAP_SCALE_TO_RATIO[roundedScale as keyof typeof MAP_SCALE_TO_RATIO] *
        clusterFactorRef.current;
    } else {
      // 如果没有对应的比例尺值，使用最接近的级别
      const scales = Object.keys(MAP_SCALE_TO_RATIO)
        .map(Number)
        .sort((a, b) => a - b);
      const closestScale =
        scales.find((scale) => scale >= currentMapScale) ||
        scales[scales.length - 1];
      newClusterRadius =
        MAP_SCALE_TO_RATIO[
          closestScale.toString() as keyof typeof MAP_SCALE_TO_RATIO
        ] * clusterFactorRef.current;
    }
    
    newClusterRadius = newClusterRadius / 2;

    // 使用 ref 来获取最新的 clusterRadius 值，避免闭包问题
    const currentRadius = clusterRadiusRef.current;
    
    // 如果有变化，更新参数
    if (Math.abs(newClusterRadius - currentRadius) > 1) { // 使用小的容差避免浮点精度问题
      clusterRadiusRef.current = newClusterRadius;
      console.log("🔄 clusterRadius 更新为:", newClusterRadius);
      // 标记需要更新聚类，在下次适当时机更新
      setTimeout(() => {
        if (clusterEnabledRef.current && clusterManagerRef.current) {
          // 直接调用聚类更新逻辑，避免循环依赖
          const options: Partial<ClusterOptions> = {
            radius: clusterRadiusRef.current,
            minPoints: clusterMinPointsRef.current,
          };
          const clusterResults = clusterManagerRef.current.updateClusters(options);
          clustersRef.current = clusterResults;
          handleClusterUpdate(clusterResults);
        }
      }, 0);
    }
  }, [currentScale, handleClusterUpdate]); // 移除所有配置相关依赖，改用 ref

  // 更新聚类 - 只负责聚类更新
  const updateClusters = useCallback(() => {
    if (!clusterManagerRef.current || !clusterEnabledRef.current) {
      return;
    }

    // 添加标志变量，表示正在更新聚类
    isUpdatingClustersRef.current = true;

    console.log("⚙️ 开始更新聚类:", {
      radius: clusterRadiusRef.current, // 使用 ref 而不是 state
      minPoints: clusterMinPointsRef.current,
    });

    try {
      const options: Partial<ClusterOptions> = {
        radius: clusterRadiusRef.current, // 使用 ref 而不是 state
        minPoints: clusterMinPointsRef.current,
      };

      const clusterResults = clusterManagerRef.current.updateClusters(options);
      clustersRef.current = clusterResults;

      // 同时更新 markers 和 clusterMap
      handleClusterUpdate(clusterResults);
    } catch (error) {
      console.error("更新聚类失败:", error);
    } finally {
      // 确保更新完成后重置标志
      setTimeout(() => {
        isUpdatingClustersRef.current = false;
      }, 100);
    }
  }, [handleClusterUpdate]); // 移除所有配置相关依赖，改用 ref

  // 处理地图边界变化事件
  const handleBoundsChanged = useCallback(
    (event: any) => {
      console.log("🗺️ BoundsChange 事件触发");
      
      // 清除之前的定时器
      if (boundsChangeTimerRef.current) {
        clearTimeout(boundsChangeTimerRef.current);
      }

      // 设置新的防抖定时器，300ms后没有新事件时执行
      boundsChangeTimerRef.current = setTimeout(() => {
        console.log("⏰ BoundsChange 防抖完成，开始调整聚类参数");
        adjustClusterParameters();
      }, 300);
    },
    [adjustClusterParameters]
  );

  // 地图初始化完成
  const onMapInited = useCallback(() => {
    console.log("腾讯地图加载完成");
    const map = mapRef.current;

    if (!map) {
      console.warn("地图实例未找到");
      return;
    }

    // 绑定bounds_changed事件
    map.on("bounds_changed", handleBoundsChanged);

    if (typeof window !== "undefined") {
      (window as any)["tencentMap"] = map;
    }

    resetMap();
    // 关闭地图loading状态
    setMapLoading(false);

    onMapReady?.();
  }, [onMapReady, handleBoundsChanged]);

  // 清理防抖定时器
  useEffect(() => {
    return () => {
      if (boundsChangeTimerRef.current) {
        clearTimeout(boundsChangeTimerRef.current);
      }
    };
  }, []);

  // 移除监听 clusterRadius 变化的 useEffect，现在直接在 adjustClusterParameters 中触发更新

  // 阻止事件冒泡
  const preventBubble = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  // 暴露组件方法给父组件
  useImperativeHandle(ref, () => ({
    resetMap,
    selectPoint,
    updateClusters,
    adjustClusterParameters,
    getSelectedPoint: () => selectedPointRef.current,
    getFilteredPoints: () => filteredPointsRef.current,
    getClusters: () => clustersRef.current,
    getClusterRadius: () => clusterRadiusRef.current,
  }), [resetMap, selectPoint, updateClusters, adjustClusterParameters]); // 移除 point 和 clusters 相关依赖，改用 ref

  return (
    <div ref={containerRef} className={`container ${className}`} style={style}>
      {/* 地图加载遮罩层 */}
      {mapLoading && (
        <div className="map-loading-overlay">
          <div className="map-loading-content">
            <div className="map-loading-spinner"></div>
            <div className="map-loading-text">地图正在加载中...</div>
          </div>
        </div>
      )}

      {/* 遮罩层，点击时折叠筛选器 */}
      {filterExpanded && hasFilters && (
        <div
          className={`mask ${filterExpanded ? "visible" : ""}`}
          onClick={toggleFilter}
        ></div>
      )}

      {/* 第一个区域：顶部信息栏和筛选器 */}
      <div className={`header-section ${filterExpanded ? "expanded" : ""}`}>
        <div className="header-bar">
          <div className="header-title">{mapData.name}</div>
          {hasFilters && (
            <button className="expand-btn" onClick={toggleFilter}>
              <span className={`chevron ${filterExpanded ? "up" : "down"}`}>
                {filterExpanded ? "▲" : "▼"}
              </span>
            </button>
          )}
        </div>

        {/* 筛选器区域，展开/折叠 */}
        {filterExpanded && hasFilters && (
          <div className="filter-container" onClick={preventBubble}>
            {/* Inclusive筛选器（默认全选，至少选一个） */}
            {Object.entries(availableFilters).map(([category, filters]) => (
              <div key={`inclusive-${category}`} className="filter-category">
                <div className="filter-row">
                  <div className="filter-category-title">{category}：</div>
                  <div className="filter-list">
                    {Object.keys(filters).map((value) => (
                      <button
                        key={value}
                        className={`filter-item inclusive ${
                          filterState.inclusive[category]?.[value]
                            ? "active"
                            : ""
                        }`}
                        onClick={() =>
                          handleInclusiveFilterTap(category, value)
                        }
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Exclusive筛选器（默认全不选，至多选一个） */}
            {Object.entries(availableFilters).map(([category, filters]) => (
              <div key={`exclusive-${category}`} className="filter-category">
                <div className="filter-row">
                  <div className="filter-category-title">排除{category}：</div>
                  <div className="filter-list">
                    {Object.keys(filters).map((value) => (
                      <button
                        key={value}
                        className={`filter-item exclusive ${
                          filterState.exclusive[category]?.[value]
                            ? "active"
                            : ""
                        }`}
                        onClick={() =>
                          handleExclusiveFilterTap(category, value)
                        }
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* 重置按钮 */}
            <button className="filter-reset-btn" onClick={resetFilters}>
              重置筛选
            </button>
          </div>
        )}
      </div>

      {/* 第二个区域：地图和列表双Tab */}
      <div className="content-section">
        <div className="tabs-container">
          <div className="tab-headers">
            <button
              className={`tab-header ${activeTab === "map" ? "active" : ""}`}
              onClick={() => onTabChange("map")}
            >
              地图
            </button>
            <button
              className={`tab-header ${activeTab === "list" ? "active" : ""}`}
              onClick={() => onTabChange("list")}
            >
              列表
            </button>
          </div>

          <div className="tab-content">
            {/* 地图容器 - 始终渲染，通过CSS控制显示 */}
            <div
              className="map-container"
              style={{
                position: "relative",
                display: activeTab === "map" ? "block" : "none",
              }}
            >
              <div className="square-container">
                {/* 重置按钮 */}
                <button className="reset-button" onClick={resetMap}>
                  <i className="fa-solid fa-undo"></i>
                </button>

                {/* 腾讯地图组件 */}
                <BaseMap
                  ref={mapRef}
                  apiKey={TENCENT_MAP_API_KEY}
                  options={{
                    center: mapCenter,
                    viewMode: "2D",
                    zoom: currentScale,
                    minZoom: minScale,
                    maxZoom: maxScale,
                    duration: 1000, // 动画时长（毫秒）
                    baseMap: {
                      type: "vector",
                      features: ["base", "label", "point"],
                    },
                  }}
                  control={{
                    zoom: {
                      numVisible: true,
                    },
                  }}
                  onMapInited={onMapInited}
                >
                  <MultiMarker
                    ref={markerRef}
                    styles={markerStyles}
                    geometries={tencentMarkers}
                    onClick={markerTap}
                  />
                  <MultiLabel styles={labelStyles} geometries={clusterLabels} />
                </BaseMap>
              </div>

              {/* 加载状态 */}
              {loading && (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <div className="loading-text">加载中...</div>
                </div>
              )}
            </div>

            {/* 列表容器 - 始终渲染，通过CSS控制显示 */}
            <div
              className="points-list"
              style={{
                display: activeTab === "list" ? "block" : "none",
              }}
            >
              {clusterListVisible ? (
                // 聚类列表
                <div>
                  <div className="cluster-list-header">
                    <button
                      className="back-btn"
                      onClick={() => clearClusterSelection()}
                    >
                      ← 返回
                    </button>
                    <span>聚类点位 ({clusterPoints.length}个)</span>
                  </div>
                  <div
                    style={{
                      maxHeight: "350px",
                      overflowY: "auto" as const,
                    }}
                  >
                    {clusterPoints.map((point, index) => (
                      <div
                        key={`cluster-point-${point.index}`}
                        id={`cluster-point-${point.index}`}
                        className={`point-item ${
                          selectedClusterPointIndex === index ? "active" : ""
                        }`}
                        onClick={() => {
                          setSelectedPoint(point);
                          selectedPointIndexRef.current = point.index || null;
                          setSelectedClusterPointIndex(index);
                          onPointSelect?.(point);
                        }}
                      >
                        <div className="point-name">
                          <span className="point-index">{point.index}.</span>{" "}
                          {point.name}
                        </div>
                        {/* 显示标签 */}
                        {point.tags && point.tags.length > 0 && (
                          <div className="point-tags">
                            {point.tags.map((tag) => (
                              <span key={tag} className="point-tag">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                // 普通点位列表
                <div
                  style={{
                    maxHeight: "400px",
                    overflowY: "auto" as const,
                  }}
                >
                  {filteredPoints.length > 0 ? (
                    filteredPoints.map((point, index) => (
                      <div
                        key={`point-${point.index}`}
                        id={`point-${point.index}`}
                        className={`point-item ${
                          selectedPointIndexRef.current === point.index ? "active" : ""
                        }`}
                        onClick={() => selectPoint(point, index)}
                      >
                        <div className="point-name">
                          <span className="point-index">{point.index}.</span>{" "}
                          {point.name}
                        </div>
                        {/* 显示标签 */}
                        {point.tags && point.tags.length > 0 && (
                          <div className="point-tags">
                            {point.tags.map((tag) => (
                              <span key={tag} className="point-tag">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="empty-list">
                      <span>暂无点位数据</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 第三个区域：点位详情 */}
      <div className="detail-section">
        {selectedPoint ? (
          <div className="detail-container">
            <div className="detail-header">
              <div className="detail-title">{selectedPoint.name}</div>
            </div>

            <div className="detail-content">
              {selectedPoint.address && (
                <div className="detail-item">
                  <span className="detail-icon">📍</span>
                  <span
                    className="detail-text clickable"
                    onClick={() => copyText(selectedPoint.address)}
                  >
                    {selectedPoint.address}
                  </span>
                </div>
              )}

              {selectedPoint.phone && (
                <div className="detail-item">
                  <span className="detail-icon">📞</span>
                  <span
                    className="detail-text clickable"
                    onClick={() => copyText(selectedPoint.phone || "")}
                  >
                    {selectedPoint.phone}
                  </span>
                </div>
              )}

              {selectedPoint.webName && (
                <div className="detail-item">
                  <span className="detail-icon">🔗</span>
                  <span
                    className="detail-text clickable"
                    onClick={() => copyText(selectedPoint.webName || "")}
                  >
                    {selectedPoint.webName}
                  </span>
                </div>
              )}

              {/* 显示标签 */}
              {selectedPoint.tags && selectedPoint.tags.length > 0 && (
                <div className="detail-tags">
                  {selectedPoint.tags.map((tag) => (
                    <span key={tag} className="detail-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {selectedPoint.intro && (
                <div className="detail-intro">
                  <span>{selectedPoint.intro}</span>
                </div>
              )}

              {/* 导航按钮 */}
              <div className="navigation-container">
                <button
                  className="navigation-pill"
                  onClick={navigateToLocation}
                >
                  <span className="navigation-icon">🧭</span>
                  <span>导航</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-detail">
            <span>请选择一个点位查看详情</span>
          </div>
        )}
      </div>
    </div>
  );
});

MapViewer.displayName = 'MapViewer';

export default MapViewer;
