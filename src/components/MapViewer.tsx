import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  MapViewerProps,
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
  protected performClustering(points: ClusterItem[], options: ClusterOptions): Cluster<ClusterItem>[] {
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

const MapViewer: React.FC<MapViewerProps> = ({
  mapData,
  className = "",
  style = {},
  onPointSelect,
  onMapReady,
  defaultView = "map",
}) => {
  // 基本状态管理
  const [points, setPoints] = useState<MapPoint[]>([]);
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
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<"map" | "list">(defaultView);
  const [filterExpanded, setFilterExpanded] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [mapLoading, setMapLoading] = useState<boolean>(true); // 地图加载状态

  // 地图相关状态
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: 39.9042,
    lng: 116.4074,
  });
  const [currentScale, setCurrentScale] = useState<number>(10);
  const [minScale] = useState<number>(3);
  const [maxScale] = useState<number>(18);

  // 地图事件状态

  // 聚类相关状态
  const [clusterEnabled, setClusterEnabled] = useState<boolean>(true); // 是否启用聚类
  const [clusterAlgorithm, setClusterAlgorithm] = useState<ClusterAlgorithmType>(ClusterAlgorithmType.DISTANCE);
  const [clusterRadius, setClusterRadius] = useState<number>(100); // 聚类半径（米）
  const [clusterMinPoints] = useState<number>(2); // 形成聚类的最小点数
  const [clusterFactor] = useState<number>(1.2); // 聚类强度因子
  const [clusters, setClusters] = useState<Cluster<ClusterItem>[]>([]);
  const [clusterMap, setClusterMap] = useState<{ [key: string]: MapPoint[] }>({});
  const [clusterLabels, setClusterLabels] = useState<any[]>([]); // 聚类数字标签

  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const boundsChangeTimerRef = useRef<number | null>(null); // 防抖定时器
  const clusterManagerRef = useRef<ClusterManager<ClusterItem> | null>(null);

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

      setPoints(convertedPoints);
      setFilteredPoints(convertedPoints);

      // 设置地图中心
      if (mapData.center) {
        setMapCenter(mapData.center);
      } else if (convertedPoints.length > 0) {
        setMapCenter({
          lat: convertedPoints[0].latitude,
          lng: convertedPoints[0].longitude,
        });
      }

      // 设置缩放级别
      if (
        mapData.zoom &&
        Array.isArray(mapData.zoom) &&
        mapData.zoom.length >= 3
      ) {
        setCurrentScale(mapData.zoom[0]);
        // 地图初始化后再设置缩放
        if (mapRef.current?.setZoom) {
          mapRef.current.setZoom(mapData.zoom[0]);
        }
      }

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
      onMapReady?.();
    } catch (error) {
      console.error("地图数据初始化失败:", error);
      setLoading(false);
    }
  }, [mapData, onMapReady, getCategoryForTag]);

  // 应用筛选器
  const applyFilters = useCallback(() => {
    return points.filter((point) => {
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
  }, [points, filterState]);

  // 更新筛选后的点位
  useEffect(() => {
    const filtered = applyFilters();
    setFilteredPoints(filtered);

    // 如果当前选中的点位不在筛选结果中，清除选择
    if (
      selectedPoint &&
      !filtered.find((p) => p.index === selectedPoint.index)
    ) {
      setSelectedPoint(null);
      setSelectedPointIndex(null);
    }

    // 初始化聚类
    initClustering(filtered);
  }, [applyFilters, selectedPoint]);

  // 创建地图标记
  const createMarkers = useCallback(() => {
    const markers: any[] = [];

    clusters.forEach((cluster) => {
      if (cluster.points.length > 1) {
        // 聚类标记
        const clusterCenter = cluster.center;
        const isSelected = Object.keys(clusterMap).includes(String(cluster.id || "")) && 
                          cluster.points.some(p => p.point.index === selectedPointIndex);
        
        markers.push({
          id: `cluster-${cluster.id}`,
          styleId: isSelected ? "selected" : "default",
          position: {
            lat: clusterCenter.y,
            lng: clusterCenter.x,
          },
          properties: {
            clusterSize: cluster.points.length,
            isCluster: true,
          },
        });
      } else if (cluster.points.length === 1) {
        // 单个点标记
        const point = cluster.points[0].point;
        markers.push({
          id: `marker-${point.index}`,
          styleId: selectedPointIndex === point.index ? "selected" : "default",
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

    return markers;
  }, [clusters, clusterMap, selectedPointIndex]);

  // 生成聚类标签
  const createClusterLabels = useCallback(() => {
    const labels: any[] = [];

    clusters.forEach((cluster) => {
      if (cluster.points.length > 1) {
        // 只为多点聚类添加数字标签
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

    return labels;
  }, [clusters]);

  // 生成腾讯地图标记
  const tencentMarkers = useMemo(() => {
    return createMarkers();
  }, [createMarkers]);

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

    points.forEach((point) => {
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
  }, [points, getCategoryForTag]);

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
      setSelectedPointIndex(point.index || null);
      onPointSelect?.(point);

      // 更新地图中心
      setMapCenter({ lat: point.latitude, lng: point.longitude });
    },
    [onPointSelect]
  );

  // 标记点击处理
  const markerTap = useCallback(
    (event: any) => {
      try {
        const clickedMarkerId = event.geometry.id;
        console.log("标记点击:", clickedMarkerId);

        if (clickedMarkerId.startsWith("cluster-")) {
          // 聚类标记点击
          const clusterId = clickedMarkerId.replace("cluster-", "");
          const clusterPoints = clusterMap[clusterId];
          
          if (clusterPoints && clusterPoints.length > 1) {
            // 获取当前缩放级别
            const currentScale = mapRef.current?.getZoom() || 10;
            
            if (currentScale < maxScale - 1) {
              // 放大地图
              const cluster = clusters.find(c => c.id === clusterId);
              if (cluster) {
                setMapCenter({ lat: cluster.center.y, lng: cluster.center.x });
                setCurrentScale(Math.min(currentScale + 2, maxScale));
              }
            } else {
              // 已达到最大缩放，显示聚类列表
              console.log(`聚类包含 ${clusterPoints.length} 个点位:`, clusterPoints);
              // 这里可以添加显示聚类列表的逻辑
            }
          }
        } else if (clickedMarkerId.startsWith("marker-")) {
          // 普通点位
          const pointIndex = parseInt(clickedMarkerId.split("-")[1]);
          const point = filteredPoints.find((p) => p.index === pointIndex);
          if (point) {
            selectPoint(point, pointIndex - 1);
          }
        }
      } catch (error) {
        console.warn("处理标记点击事件失败:", error);
      }
    },
    [filteredPoints, selectPoint, clusterMap, clusters, maxScale]
  );

  // 重置地图
  const resetMap = useCallback(() => {
    const initialCenter = mapData.center || { lat: 39.9042, lng: 116.4074 };
    const initialZoom = mapData.zoom?.[0] || 10;

    console.log("重置地图到初始状态:", {
      center: initialCenter,
      zoom: initialZoom,
    });

    // 显示加载状态
    setMapLoading(true);

    // 直接更新状态，让React重新渲染地图
    setMapCenter(initialCenter);
    setCurrentScale(initialZoom);

    // 使用地图API直接设置缩放级别
    if (mapRef.current?.setZoom) {
      mapRef.current.setZoom(initialZoom);
    }

    // 重置选中状态
    setSelectedPoint(null);
    setSelectedPointIndex(null);

    // 如果地图已经初始化，短暂延时后关闭loading
    if (mapRef.current) {
      setTimeout(() => {
        setMapLoading(false);
      }, 500);
    }
  }, [mapData]);

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
  const initClustering = useCallback((filteredPoints: MapPoint[]) => {
    // 将点位数据转换为聚类管理器需要的格式
    const clusterPoints: ClusterItem[] = filteredPoints.map((point, index) => ({
      id: `point_${point.index || index}`,
      name: point.name,
      x: point.longitude, // 经度
      y: point.latitude, // 纬度
      weight: 1,
      point: point,
    }));

    // 创建聚类管理器
    if (clusterAlgorithm === ClusterAlgorithmType.DISTANCE) {
      clusterManagerRef.current = new DistanceClusterManager({
        radius: clusterRadius,
        minPoints: clusterMinPoints,
        coordinateSystem: CoordinateSystem.GCJ02,
      });
    } else {
      clusterManagerRef.current = null;
    }

    if (clusterManagerRef.current && clusterEnabled) {
      // 注册聚类事件监听
      clusterManagerRef.current.on("cluster", (event) => {
        handleClusterUpdate(event.payload.clusters);
      });

      // 更新点数据并执行聚类
      const clusterResults = clusterManagerRef.current.updatePoints(clusterPoints);
      setClusters(clusterResults);
    } else {
      // 如果不使用聚类，直接创建标记
      const directClusters = clusterPoints.map((point) => ({
        center: point,
        points: [point],
        radius: 0,
        id: point.id,
      }));
      setClusters(directClusters);
      handleClusterUpdate(directClusters);
    }
  }, [clusterAlgorithm, clusterRadius, clusterMinPoints, clusterEnabled]);

  // 处理聚类更新
  const handleClusterUpdate = useCallback((clusterResults: Cluster<ClusterItem>[]) => {
    const newClusterMap: { [key: string]: MapPoint[] } = {};
    
    clusterResults.forEach((cluster) => {
      if (cluster.points.length > 1) {
        newClusterMap[cluster.id || ""] = cluster.points.map(p => p.point);
      }
    });
    
    setClusterMap(newClusterMap);
    
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
    setClusterLabels(labels);
  }, []);

  // 根据当前缩放级别动态调整聚类参数
  const adjustClusterParameters = useCallback(() => {
    if (!clusterEnabled) return;

    // 获取当前缩放级别
    const currentScale = mapRef.current?.getZoom() || 10;
    
    // 向上取整缩放级别，确保能找到对应的比例尺值
    const roundedScale = Math.ceil(currentScale).toString();

    // 获取对应的比例尺值作为半径
    let newClusterRadius = 100; // 默认值
    if (MAP_SCALE_TO_RATIO[roundedScale as keyof typeof MAP_SCALE_TO_RATIO]) {
      newClusterRadius =
        MAP_SCALE_TO_RATIO[roundedScale as keyof typeof MAP_SCALE_TO_RATIO] *
        clusterFactor;
    } else {
      // 如果没有对应的比例尺值，使用最接近的级别
      const scales = Object.keys(MAP_SCALE_TO_RATIO)
        .map(Number)
        .sort((a, b) => a - b);
      const closestScale =
        scales.find((scale) => scale >= currentScale) ||
        scales[scales.length - 1];
      newClusterRadius =
        MAP_SCALE_TO_RATIO[
          closestScale.toString() as keyof typeof MAP_SCALE_TO_RATIO
        ] * clusterFactor;
    }

    newClusterRadius /= 2;

    console.log(
      `当前缩放级别: ${currentScale}, 取整: ${roundedScale}, 半径: ${newClusterRadius}m`
    );

    // 如果有变化，更新参数
    if (Math.abs(newClusterRadius - clusterRadius) > 10) {
      setClusterRadius(newClusterRadius);
      updateClusters(newClusterRadius);
    }
  }, [clusterEnabled, clusterFactor, clusterRadius]);

  // 更新聚类
  const updateClusters = useCallback((newRadius?: number) => {
    if (clusterManagerRef.current && clusterEnabled) {
      const options: Partial<ClusterOptions> = {
        radius: newRadius || clusterRadius,
        minPoints: clusterMinPoints,
      };
      
      const clusterResults = clusterManagerRef.current.updateClusters(options);
      setClusters(clusterResults);
    }
  }, [clusterEnabled, clusterRadius, clusterMinPoints]);

  // 处理地图边界变化事件
  const handleBoundsChanged = useCallback((event: any) => {
    // 清除之前的定时器
    if (boundsChangeTimerRef.current) {
      clearTimeout(boundsChangeTimerRef.current);
    }

    // 设置新的防抖定时器，200ms后没有新事件时执行
    boundsChangeTimerRef.current = setTimeout(() => {
      console.log("BoundsChange 完成");
      // 调整聚类参数
      adjustClusterParameters();
    }, 200);
  }, [adjustClusterParameters]);

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

  // 阻止事件冒泡
  const preventBubble = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

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
                  <MultiLabel
                    styles={labelStyles}
                    geometries={clusterLabels}
                  />
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
                        selectedPointIndex === point.index ? "active" : ""
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
};

export default MapViewer;
