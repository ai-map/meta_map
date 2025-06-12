import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
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
  ClusterAlgorithmType,
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
import { DensityClusterManager } from "../clusters/density_cluster";
import { HierarchicalClusterManager } from "../clusters/hierarchical_cluster";

// 腾讯地图API导入
import { MultiMarker, BaseMap, MultiLabel } from "tlbs-map-react";

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

// 定义标记类型
type Marker = {
  id: string;
  styleId: string;
  position: Location;
};

const MapViewer = forwardRef<MapViewerRef, MapViewerProps>(
  (
    {
      mapData,
      className = "",
      style = {},
      defaultView = "map",
      clusterAlgorithm = ClusterAlgorithmType.DISTANCE,
      enableClustering = true,
      minClusterSize = 2,
      clusterDistance = 100,
    },
    ref
  ) => {
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
    // 用于详情页管理
    const [activeTab, setActiveTab] = useState<"map" | "list">(defaultView);
    const [filterExpanded, setFilterExpanded] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [mapLoading, setMapLoading] = useState<boolean>(true); // 地图加载状态

    // 地图相关状态
    const [mapCenter, setCurrentCenter] = useState<{
      lat: number;
      lng: number;
    }>({
      lat: 39.9042,
      lng: 116.4074,
    });
    const [currentScale, setCurrentScale] = useState<number>(10);
    const [minScale] = useState<number>(3);
    const [maxScale] = useState<number>(18);

    // 地图事件状态

    // 聚类配置参数 - 使用 ref 管理，避免不必要的重新渲染
    const clusterEnabledRef = useRef<boolean>(enableClustering);
    const clusterAlgorithmRef = useRef<ClusterAlgorithmType>(clusterAlgorithm);
    const clusterMinPointsRef = useRef<number>(minClusterSize);
    const clusterFactorRef = useRef<number>(1.2);
    // clusters 使用 ref 管理，避免不必要的重新渲染
    const clustersRef = useRef<Cluster<ClusterItem>[]>([]);
    const [markers, setMarkers] = useState<Marker[]>([]); // 地图标记状态
    // clusterMap 使用 ref 管理，避免不必要的重新渲染
    const clusterMapRef = useRef<{ [key: string]: MapPoint[] }>({});
    const [clusterLabels, setClusterLabels] = useState<any[]>([]); // 聚类数字标签

    // 聚类列表相关状态
    const [clusterListVisible, setClusterListVisible] =
      useState<boolean>(false);
    const [clusterPoints, setClusterPoints] = useState<MapPoint[]>([]);
    const [selectedClusterPointIndex, setSelectedClusterPointIndex] =
      useState<number>(-1);
    const [currentClusterId, setCurrentClusterId] = useState<string>("");

    // 选中的点位索引（在普通点位列表中的索引）
    const [selectedListPointIndex, setSelectedListPointIndex] =
      useState<number>(-1);

    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const boundsChangeTimerRef = useRef<number | null>(null); // 防抖定时器
    const clusterManagerRef = useRef<ClusterManager<ClusterItem> | null>(null);
    const processingMarkerTapRef = useRef<boolean>(false); // 防止重复处理点击事件
    const isUpdatingClustersRef = useRef<boolean>(false); // 防止聚类更新期间的点击事件
    const clusterRadiusRef = useRef<number>(clusterDistance); // 聚类半径（米）

    // Point 相关的 ref，避免不必要的重新渲染
    const pointsRef = useRef<MapPoint[]>([]);
    const filteredPointsRef = useRef<MapPoint[]>([]);

    // Markers 和 ClusterLabels 相关的 ref，避免闭包问题
    const markersRef = useRef<Marker[]>([]);
    const clusterLabelsRef = useRef<any[]>([]);

    // 新增的选中状态 ref
    const selectedPointIndex = useRef<number>(0); // 记录被地图或列表选中的 point，数值为原始分配 index，0 代表未选中
    const selectedMarkerIndex = useRef<number>(0); // 记录选中的 markerIndex，正数代表选中 Point 编号，负数代表 marker 选中编号，0代表未选中

    // 获取当前选中的点位 - 根据selectedPointIndex查找
    const getSelectedPoint = (): MapPoint | null => {
      if (selectedPointIndex.current > 0) {
        return (
          filteredPointsRef.current.find(
            (p) => p.index === selectedPointIndex.current
          ) || null
        );
      }
      return null;
    };

    const getClusterIndex = (index: number): number => {
      // 查找点位是否在聚类中，返回聚类索引（负数）或0
      for (const [clusterId, points] of Object.entries(clusterMapRef.current)) {
        if (points.some((p) => p.index === index)) {
          const clusterNumber = parseInt(clusterId.replace(/\D/g, "") || "1");
          return -clusterNumber; // 返回负数表示聚类
        }
      }
      return 0; // 不在聚类中返回0
    };

    // 获取标记索引的统一函数
    const getMarkerIndex = (
      pointIndex: number,
      knownClusterId?: string
    ): number => {
      if (knownClusterId) {
        // 如果已知聚类ID，直接使用
        const clusterNumber = parseInt(
          knownClusterId.replace(/\D/g, "") || "1"
        );
        return -clusterNumber; // 负数表示聚类
      } else {
        // 否则查找点位是否在聚类中
        const clusterIndex = getClusterIndex(pointIndex);
        return clusterIndex !== 0 ? clusterIndex : pointIndex;
      }
    };

    // 更新选中状态的统一函数
    const updateSelectedMarker = (pointIndex: number, markerIndex: number) => {
      const prevPointIndex = selectedPointIndex.current;
      const prevMarkerIndex = selectedMarkerIndex.current;
      selectedPointIndex.current = pointIndex;
      selectedMarkerIndex.current = markerIndex;
      console.log(
        "🎯 更新选中状态:",
        prevPointIndex,
        prevMarkerIndex,
        pointIndex,
        markerIndex
      );
    };

    // 清除选中状态的统一函数
    const clearSelectedMarker = () => {
      selectedPointIndex.current = 0;
      selectedMarkerIndex.current = 0;
      setSelectedListPointIndex(-1);

      console.log("🎯 清除选中状态");
    };

    // 初始化完成标志，避免重复初始化
    const dataInitializedRef = useRef<boolean>(false);
    const filterInitializedRef = useRef<boolean>(false);
    const clusterInitializedRef = useRef<boolean>(false);

    // 检查是否有筛选器
    const hasFilters = useMemo(() => {
      return Object.keys(availableFilters).length > 0;
    }, [availableFilters]);

    // 获取标签的分类 - 从mapData.filter中获取
    const getCategoryForTag = (tag: string): string => {
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
    };

    // 初始化数据和筛选器 - 改为函数调用，使用标志避免重复初始化
    const initializeMapData = () => {
      if (dataInitializedRef.current) {
        console.log("📊 数据已初始化，跳过重复初始化");
        return;
      }

      console.log("📊 开始初始化地图数据");
      let metaMap: MetaMap;

      // 重置选中状态
      clearSelectedMarker();

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
        updateFilteredPointsRef(convertedPoints);

        // 生成可用筛选器（使用通用函数）
        const {
          availableFilters: newAvailableFilters,
          inclusiveState: initialInclusiveState,
          exclusiveState: initialExclusiveState,
        } = generateFilterStates(convertedPoints);

        setAvailableFilters(newAvailableFilters);
        setFilterState({
          inclusive: initialInclusiveState,
          exclusive: initialExclusiveState,
        });

        // 标记数据初始化完成
        dataInitializedRef.current = true;
        if (filterInitializedRef.current || !dataInitializedRef.current) {
          console.log("🔄 筛选已初始化或数据未准备好，跳过重复初始化");
        } else {
          console.log("🔄 开始初始化筛选和聚类");

          const filtered = applyFilters();
          updateFilteredPointsRef(filtered);

          // 标记筛选初始化完成
          filterInitializedRef.current = true;

          // 延迟执行聚类初始化
          initClustering(filtered);

          console.log("🔄 筛选和聚类初始化完成");
        }

        setLoading(false);

        console.log("📊 地图数据初始化完成");
      } catch (error) {
        console.error("地图数据初始化失败:", error);
        setLoading(false);
      }
    };

    // 检查 mapData 变化，触发数据初始化
    useEffect(() => {
      // 重置初始化标志
      dataInitializedRef.current = false;
      filterInitializedRef.current = false;
      clusterInitializedRef.current = false;

      initializeMapData();
    }, [mapData]);

    // 同步 markers state 到 markersRef
    // 同步 clusterLabels state 到 clusterLabelsRef
    useEffect(() => {
      markersRef.current = markers;
      clusterLabelsRef.current = clusterLabels;
      console.log("🎨 样式更新结果:", {
        markers: markers.map((m) => ({ id: m.id, styleId: m.styleId })),
        labels: clusterLabels.map((l) => ({ id: l.id })),
      });
    }, [markers, clusterLabels]);

    // 应用筛选器（合并循环）
    const applyFilters = () => {
      return pointsRef.current.filter((point) => {
        if (!point.tags) return true;

        // 合并检查 inclusive 和 exclusive 筛选器的循环
        const allCategories = new Set([
          ...Object.keys(filterState.inclusive),
          ...Object.keys(filterState.exclusive),
        ]);

        for (const category of allCategories) {
          // 检查 inclusive 筛选器
          const inclusiveFilters = filterState.inclusive[category];
          if (inclusiveFilters) {
            const activeInclusiveFilters = Object.entries(inclusiveFilters)
              .filter(([_, active]) => active)
              .map(([value, _]) => value);
            if (activeInclusiveFilters.length > 0) {
              const hasMatchingInclusiveTag = activeInclusiveFilters.some(
                (filter) => point.tags!.includes(filter)
              );
              if (!hasMatchingInclusiveTag) return false;
            }
          }

          // 检查 exclusive 筛选器
          const exclusiveFilters = filterState.exclusive[category];
          if (exclusiveFilters) {
            const activeExclusiveFilters = Object.entries(exclusiveFilters)
              .filter(([_, active]) => active)
              .map(([value, _]) => value);
            if (activeExclusiveFilters.length > 0) {
              const hasMatchingExclusiveTag = activeExclusiveFilters.some(
                (filter) => point.tags!.includes(filter)
              );
              if (!hasMatchingExclusiveTag) return false;
            }
          }
        }

        return true;
      });
    };

    // 当筛选条件变化时重新进行筛选和聚类
    const updateFiltersAndClustering = () => {
      if (!dataInitializedRef.current) {
        console.log("🔄 数据未准备好，跳过筛选更新");
        return;
      }

      console.log("🔄 筛选条件变化，重新筛选和聚类");

      const filtered = applyFilters();
      updateFilteredPointsRef(filtered);

      // 检查当前选中的点位是否在筛选结果中，如果不在则清除选择
      const currentSelectedPoint = getSelectedPoint();
      if (
        currentSelectedPoint &&
        !filtered.find((p) => p.index === currentSelectedPoint.index)
      ) {
        console.log("🔄 选中点位不在筛选结果中，清除选择");
        clearSelectedMarker();
      }

      // 重新执行聚类
      initClustering(filtered);
    };

    // 计算标记样式更新的纯函数（不依赖 states）
    const generateMarkerStyles = (
      selectedPointIndex: number,
      selectedMarkerIndex: number,
      inputMarkers: Marker[],
      clusterMap: { [key: string]: MapPoint[] }
    ): Marker[] => {
      if (!inputMarkers || inputMarkers.length === 0) {
        console.log("🎨 没有标记，返回空数组");
        return [];
      }

      // 根据 selectedPointIndex 和 selectedMarkerIndex 确定选中状态
      let selectedPointId = 0;
      let selectedClusterId = "";

      // 处理两种情况：
      // 1. 有 selectedPointIndex，从 getClusterIndex 获取最新 selectedMarkerIndex
      // 2. 只有 selectedMarkerIndex

      if (selectedPointIndex > 0) {
        // 情况1: 有选中的点位，获取其最新的聚类状态
        selectedPointId = selectedPointIndex;

        // 从 clusterMap 中查找该点位是否在聚类中
        let currentClusterIndex = 0;
        for (const [clusterId, points] of Object.entries(clusterMap)) {
          if (points.some((p) => p.index === selectedPointIndex)) {
            const clusterNumber = parseInt(clusterId.replace(/\D/g, "") || "1");
            currentClusterIndex = -clusterNumber; // 负数表示聚类
            selectedClusterId = clusterId;
            break;
          }
        }

        // 如果点位在聚类中，也选中该聚类
        if (currentClusterIndex !== 0) {
          // 点位在聚类中，同时选中聚类
        }
      } else if (selectedMarkerIndex !== 0) {
        // 情况2: 只有选中的标记索引
        if (selectedMarkerIndex < 0) {
          // 负数表示选中聚类
          const targetMarkerIndex = Math.abs(selectedMarkerIndex);

          // 遍历 clusterMap，找到与 selectedMarkerIndex 匹配的聚类
          for (const [clusterId, points] of Object.entries(clusterMap)) {
            const clusterNumber = parseInt(clusterId.replace(/\D/g, "") || "0");
            if (clusterNumber === targetMarkerIndex) {
              selectedClusterId = clusterId;
              break;
            }
          }
        } else {
          // 正数表示选中独立点位
          selectedPointId = selectedMarkerIndex;
        }
      }

      // 计算新的标记样式
      const updatedMarkers = inputMarkers.map((marker) => {
        let isSelected = false;

        if (marker.id.startsWith("marker-")) {
          const markerId = parseInt(marker.id.replace("marker-", ""));
          isSelected = markerId === selectedPointId;
        } else if (marker.id.startsWith("cluster-")) {
          const clusterId = marker.id.replace("cluster-", "");
          isSelected = clusterId === selectedClusterId;
        }

        const newStyleId = isSelected ? "selected" : "default";

        return {
          ...marker,
          styleId: newStyleId,
        };
      });

      return updatedMarkers;
    };

    // 应用标记样式更新的函数（调用纯函数并更新状态）
    const applyMarkerStylesUpdate = () => {
      const styledMarkers = generateMarkerStyles(
        selectedPointIndex.current,
        selectedMarkerIndex.current,
        markersRef.current,
        clusterMapRef.current
      );

      // 检查是否需要更新（避免不必要的状态更新）
      const needsUpdate = styledMarkers.some((styledMarker, index) => {
        const oldMarker = markersRef.current[index];
        return !oldMarker || oldMarker.styleId !== styledMarker.styleId;
      });

      if (needsUpdate) {
        console.log("🎨 applyMarkerStylesUpdate 样式需要更新，应用新样式");
        setMarkers(styledMarkers);
      } else {
        console.log("🎨 applyMarkerStylesUpdate 样式无需更新");
      }
    };

    // 筛选器切换处理
    const handleInclusiveFilterTap = (category: string, value: string) => {
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

      // 筛选状态改变后更新筛选和聚类
      setTimeout(() => {
        updateFiltersAndClustering();
      }, 0);
    };

    const handleExclusiveFilterTap = (category: string, value: string) => {
      setFilterState((prev) => {
        const newState = { ...prev };

        // exclusive 是单选模式
        Object.keys(newState.exclusive[category] || {}).forEach((key) => {
          newState.exclusive[category][key] =
            key === value ? !newState.exclusive[category][key] : false;
        });

        return newState;
      });

      // 筛选状态改变后更新筛选和聚类
      setTimeout(() => {
        updateFiltersAndClustering();
      }, 0);
    };

    // 生成筛选器状态的通用函数
    const generateFilterStates = (points: MapPoint[]) => {
      const newAvailableFilters: FilterState = {};
      const initialInclusiveState: FilterState = {};
      const initialExclusiveState: FilterState = {};

      // 合并循环：遍历所有点位的所有标签
      points.forEach((point) => {
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

      return {
        availableFilters: newAvailableFilters,
        inclusiveState: initialInclusiveState,
        exclusiveState: initialExclusiveState,
      };
    };

    // 重置筛选器
    const resetFilters = () => {
      const { inclusiveState, exclusiveState } = generateFilterStates(
        pointsRef.current
      );

      setFilterState({
        inclusive: inclusiveState,
        exclusive: exclusiveState,
      });

      // 筛选状态重置后更新筛选和聚类
      setTimeout(() => {
        updateFiltersAndClustering();
      }, 0);
    };

    // 切换筛选器展开状态
    const toggleFilter = () => {
      setFilterExpanded(!filterExpanded);
    };

    // Tab切换
    const onTabChange = (value: string) => {
      setActiveTab(value as "map" | "list");
      setSelectedListPointIndex(selectedPointIndex.current - 1 || -1);
    };

    // 聚类点选择
    const selectPointInCluster = useCallback(
      (pointIndex: number, currentClusterId: string) => {
        console.log("🎯 selectPointInCluster开始:", {
          pointIndex,
          currentClusterId,
        });

        const markerIndex = getMarkerIndex(pointIndex, currentClusterId);

        // 使用统一的选中状态更新函数
        updateSelectedMarker(pointIndex, markerIndex);

        // 计算样式更新并应用
        applyMarkerStylesUpdate();
      },
      []
    );

    // 点位选择
    const selectPoint = useCallback((point: MapPoint, listIndex?: number) => {
      console.log("🎯 selectPoint开始:", { point, listIndex });

      const pointIndex = point.index || 0;
      let markerIndex = pointIndex; // 默认选中点本身

      // 只有当有 selectedPointIndex 时，才判断是否在聚类中
      if (pointIndex > 0) {
        const clusterIndex = getClusterIndex(pointIndex);
        if (clusterIndex !== 0) {
          // 点在聚类中，选中聚类
          markerIndex = clusterIndex;
        }
        // 如果不在聚类中，markerIndex 保持为 pointIndex
      }

      // 使用统一的选中状态更新函数
      updateSelectedMarker(pointIndex, markerIndex);

      // 计算样式更新并应用
      applyMarkerStylesUpdate();
    }, []);

    // 清除聚类选择状态
    const clearClusterSelection = () => {
      setClusterListVisible(false);
      setClusterPoints([]);
      setSelectedClusterPointIndex(-1);
      setCurrentClusterId("");
    };

    // 放大到聚类位置
    const zoomToCluster = (clusterId: string) => {
      const cluster = clustersRef.current.find(
        (c: Cluster<ClusterItem>) => c.id === clusterId
      );
      if (!cluster) return;

      // 获取当前缩放级别
      const currentMapScale = mapRef.current?.getZoom() || currentScale;
      // 放大到适当级别，但不超过最大缩放
      const compensation = 1.5;
      const newScale = Math.min(currentMapScale + 1, maxScale - compensation);

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
    };

    // 显示聚类点列表
    const showClusterList = (clusterId: string) => {
      const clusterPointsData = clusterMapRef.current[clusterId];
      if (clusterPointsData && clusterPointsData.length > 0) {
        console.log(`聚合点包含 ${clusterPointsData.length} 个位置`);

        // 显示聚合点列表到详情区域
        setClusterListVisible(true);
        setClusterPoints(clusterPointsData);
        setSelectedClusterPointIndex(-1); // 重置选中状态
        setCurrentClusterId(clusterId); // 保存当前聚类ID
        setActiveTab("list"); // 聚合点需要切换到列表选项卡以显示聚合内容

        // 如果已经有选中的点位，检查该点位是否在聚合点列表中
        if (selectedPointIndex.current > 0) {
          const clusterPointIndex = clusterPointsData.findIndex(
            (p) => p.index === selectedPointIndex.current
          );
          if (clusterPointIndex >= 0) {
            // 更新选中状态
            setTimeout(() => {
              setSelectedClusterPointIndex(clusterPointIndex);
            }, 100);
          }
        }
      }
    };

    // 标记点击处理
    const markerTap = useCallback((event: any) => {
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

        if (
          clickedMarkerId.startsWith("cluster-") ||
          clickedMarkerId.startsWith("label-")
        ) {
          // 聚类标记或标签点击
          const clusterId = clickedMarkerId.startsWith("cluster-")
            ? clickedMarkerId.replace("cluster-", "")
            : clickedMarkerId.replace("label-", "");

          // 确保聚类点在当前clusterMap中存在
          if (!clusterMapRef.current[clusterId]) {
            console.warn("聚类点不存在于当前clusterMap中", {
              clickedClusterId: clusterId,
            });
            return;
          }

          // 获取当前缩放级别
          const currentMapScale = mapRef.current?.getZoom() || currentScale;
          const compensation = 1.5;

          // 清除所选状态
          clearSelectedMarker();
          console.log("🎯 markerTap - 聚类选中:", clusterId);

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
        } else if (clickedMarkerId.startsWith("marker-")) {
          // 普通点位 - clickedMarkerId的数字直接对应点位的index
          const pointIndex = parseInt(clickedMarkerId.split("-")[1]);

          // 清除聚类选择状态
          clearClusterSelection();

          // 对于直接点击的独立标记，markerIndex 就是 pointIndex
          const markerIndex = pointIndex;
          updateSelectedMarker(pointIndex, markerIndex);

          // 计算样式更新并应用
          applyMarkerStylesUpdate();
        }
      } catch (error) {
        console.warn("处理标记点击事件失败:", error);
      } finally {
        processingMarkerTapRef.current = false;
      }
    }, []);

    // 重置地图
    const resetMap = () => {
      console.log("🔄 resetMap - 重置地图状态");

      // 清除选中状态
      clearSelectedMarker();

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

      // 计算样式更新并应用
      applyMarkerStylesUpdate();
    };

    // 导航到位置
    const navigateToLocation = () => {
      const selectedPoint = getSelectedPoint();
      if (selectedPoint) {
        const url = `https://www.amap.com/dir?to=${selectedPoint.longitude},${
          selectedPoint.latitude
        }&name=${encodeURIComponent(selectedPoint.name)}`;
        window.open(url, "_blank");
      }
    };

    // 复制文本
    const copyText = (text: string) => {
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
    };

    // 创建聚类管理器
    const createClusterManager = (): ClusterManager<ClusterItem> | null => {
      const baseOptions = {
        radius: clusterRadiusRef.current,
        minPoints: clusterMinPointsRef.current,
        coordinateSystem: CoordinateSystem.GCJ02,
      };

      switch (clusterAlgorithmRef.current) {
        case ClusterAlgorithmType.DISTANCE:
          console.log("🏗️ 创建距离聚类管理器", {
            radius: baseOptions.radius,
            minPoints: baseOptions.minPoints,
          });
          return new DistanceClusterManager(baseOptions);

        case ClusterAlgorithmType.DENSITY:
          // 密度聚类通常需要更多的最小点数和稍大的半径
          const densityOptions = {
            ...baseOptions,
            minPoints: Math.max(baseOptions.minPoints, 3), // DBSCAN 通常至少需要3个点
            radius: baseOptions.radius * 1.2, // 稍微增大半径以形成有意义的密度聚类
          };
          console.log("🏗️ 创建密度聚类管理器 (DBSCAN)", {
            radius: densityOptions.radius,
            minPoints: densityOptions.minPoints,
          });
          return new DensityClusterManager(densityOptions);

        case ClusterAlgorithmType.HIERARCHICAL:
          // 层次聚类对半径更敏感，使用原始参数
          const hierarchicalOptions = {
            ...baseOptions,
            maxZoom: 18, // 最大递归深度
          };
          console.log("🏗️ 创建层次聚类管理器", {
            radius: hierarchicalOptions.radius,
            minPoints: hierarchicalOptions.minPoints,
            maxZoom: hierarchicalOptions.maxZoom,
          });
          return new HierarchicalClusterManager(hierarchicalOptions);

        case ClusterAlgorithmType.NONE:
        default:
          console.log("🏗️ 不使用聚类");
          return null;
      }
    };

    // 初始化聚类管理器
    const initClustering = (filteredPoints: MapPoint[]) => {
      console.log("🏗️ initClustering 开始执行", {
        点位数量: filteredPoints.length,
        聚类算法: clusterAlgorithmRef.current,
        聚类启用: clusterEnabledRef.current,
        聚类半径: clusterRadiusRef.current,
        最小聚类点数: clusterMinPointsRef.current,
      });

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

      // 如果是初次初始化，创建聚类管理器
      if (!clusterInitializedRef.current) {
        clusterManagerRef.current = createClusterManager();
        clusterInitializedRef.current = true;
        console.log(
          "🏗️ 聚类管理器初始化完成，算法:",
          clusterAlgorithmRef.current
        );
      }

      let clusterResults: Cluster<ClusterItem>[] = [];
      if (clusterManagerRef.current && clusterEnabledRef.current) {
        // 更新点数据并执行聚类
        clusterResults = clusterManagerRef.current.updatePoints(clusterPoints);
      } else {
        // 如果不使用聚类，直接创建标记
        clusterResults = clusterPoints.map((point) => ({
          center: point,
          points: [point],
          radius: 0,
          id: point.id,
        }));
      }
      clustersRef.current = clusterResults;
      handleClusterUpdate(clusterResults);
    };

    // 处理聚类更新
    // 更新 clusterMapRef 和 markersRef 和 clusterLabelsRef
    const handleClusterUpdate = (clusterResults: Cluster<ClusterItem>[]) => {
      // 处理聚类结果，转换为地图标记格式和标签（合并循环）
      const generatedMarkers: any[] = [];
      const newClusterMap: { [key: string]: MapPoint[] } = {};
      const generatedLabels: any[] = [];

      clusterResults.forEach((cluster, index) => {
        const isCluster = cluster.points.length > 1;
        const center = cluster.center;

        if (isCluster) {
          // 聚类标记
          const clusterId = cluster.id || `cluster_${index}`;
          newClusterMap[clusterId] = cluster.points.map(
            (p: ClusterItem) => p.point
          );

          generatedMarkers.push({
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

          // 同时创建聚类标签
          generatedLabels.push({
            id: `label-${cluster.id || `cluster_${index}`}`,
            styleId: "clusterLabel",
            position: {
              lat: center.y,
              lng: center.x,
            },
            content: cluster.points.length.toString(),
          });
        } else {
          // 单个点标记
          const point = cluster.points[0].point;
          generatedMarkers.push({
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

      // 首先更新 clusterMapRef，以便后续的 getClusterIndex 能正确工作
      clusterMapRef.current = newClusterMap;

      // 计算新的选中状态
      let finalPointIndex = selectedPointIndex.current;
      let finalMarkerIndex = selectedMarkerIndex.current;

      if (selectedPointIndex.current > 0) {
        const currentPointIndex = selectedPointIndex.current;
        const newClusterIndex = getClusterIndex(currentPointIndex);

        if (
          newClusterIndex !== 0 &&
          selectedMarkerIndex.current !== newClusterIndex
        ) {
          // 点位现在在聚类中，且当前选中状态不是这个聚类，则更新选中状态
          finalMarkerIndex = newClusterIndex;
        } else if (newClusterIndex === 0 && selectedMarkerIndex.current < 0) {
          // 点位现在不在聚类中，但当前选中的是聚类，则更新为点位选中
          finalMarkerIndex = currentPointIndex;
        }
      }

      // 更新选中状态
      updateSelectedMarker(finalPointIndex, finalMarkerIndex);

      // 应用样式到标记
      const finalMarkers = generateMarkerStyles(
        finalPointIndex,
        finalMarkerIndex,
        generatedMarkers,
        newClusterMap
      );

      // 一次性应用所有状态更新
      setMarkers(finalMarkers);
      setClusterLabels(generatedLabels);
    };

    // 更新 filteredPointsRef，确保 ref 和 state 同步
    const updateFilteredPointsRef = (points: MapPoint[]) => {
      filteredPointsRef.current = points;
      setFilteredPoints(points);
    };

    // 根据当前缩放级别动态调整聚类参数
    const adjustClusterParameters = (): {
      needsUpdate: boolean;
      clusterResults?: Cluster<ClusterItem>[];
    } => {
      if (!clusterEnabledRef.current || !mapRef.current) {
        return { needsUpdate: false };
      }

      // 获取当前缩放级别
      const currentMapScale = mapRef.current.getZoom();

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

      // 如果有变化，更新参数并返回聚类结果
      if (Math.abs(newClusterRadius - currentRadius) > 1) {
        // 使用小的容差避免浮点精度问题
        clusterRadiusRef.current = newClusterRadius;
        if (clusterEnabledRef.current && clusterManagerRef.current) {
          // 调用聚类更新逻辑并返回结果
          const options: Partial<ClusterOptions> = {
            radius: clusterRadiusRef.current,
            minPoints: clusterMinPointsRef.current,
          };
          const clusterResults =
            clusterManagerRef.current.updateClusters(options);
          return { needsUpdate: true, clusterResults };
        }
      }

      return { needsUpdate: false };
    };

    // 更新聚类 - 只负责聚类更新
    const updateClusters = () => {
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
          radius: clusterRadiusRef.current,
          minPoints: clusterMinPointsRef.current,
        };

        const clusterResults =
          clusterManagerRef.current.updateClusters(options);
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
    };

    // 处理地图边界变化事件
    const handleBoundsChanged = (event: any) => {
      // 清除之前的定时器
      if (boundsChangeTimerRef.current) {
        clearTimeout(boundsChangeTimerRef.current);
      }

      // 设置新的防抖定时器，300ms后没有新事件时执行
      boundsChangeTimerRef.current = setTimeout(() => {
        console.log("⏰ BoundsChange 防抖完成，开始调整聚类参数");
        const { needsUpdate, clusterResults } = adjustClusterParameters();
        if (needsUpdate && clusterResults) {
          clustersRef.current = clusterResults;
          handleClusterUpdate(clusterResults);
        }
      }, 300);
    };

    // 地图初始化完成
    const onMapInited = () => {
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
    };

    // 清理防抖定时器
    useEffect(() => {
      return () => {
        if (boundsChangeTimerRef.current) {
          clearTimeout(boundsChangeTimerRef.current);
        }
      };
    }, []);

    // 监听聚类配置参数的变化
    useEffect(() => {
      let configChanged = false;

      if (clusterEnabledRef.current !== enableClustering) {
        clusterEnabledRef.current = enableClustering;
        configChanged = true;
        console.log("🔧 聚类启用状态已更新:", enableClustering);
      }

      if (clusterAlgorithmRef.current !== clusterAlgorithm) {
        clusterAlgorithmRef.current = clusterAlgorithm;
        configChanged = true;
        console.log("🔧 聚类算法已更新:", clusterAlgorithm);
        // 算法改变时需要重新创建聚类管理器
        clusterInitializedRef.current = false;
      }

      if (clusterMinPointsRef.current !== minClusterSize) {
        clusterMinPointsRef.current = minClusterSize;
        configChanged = true;
        console.log("🔧 最小聚类大小已更新:", minClusterSize);
      }

      if (clusterRadiusRef.current !== clusterDistance) {
        clusterRadiusRef.current = clusterDistance;
        configChanged = true;
        console.log("🔧 聚类距离已更新:", clusterDistance);
      }

      // 如果配置发生变化，重新执行聚类
      if (configChanged && filteredPointsRef.current.length > 0) {
        console.log("🔧 聚类配置已更改，重新执行聚类");
        updateFiltersAndClustering();
      }
    }, [enableClustering, clusterAlgorithm, minClusterSize, clusterDistance]);

    // 阻止事件冒泡
    const preventBubble = (e: React.MouseEvent) => {
      e.stopPropagation();
    };

    // 暴露组件方法给父组件
    useImperativeHandle(
      ref,
      () => ({
        resetMap,
        selectPoint,
        updateClusters,
        adjustClusterParameters,
        getSelectedPoint: () => getSelectedPoint(),
        getFilteredPoints: () => filteredPointsRef.current,
        getClusters: () => clustersRef.current,
        getClusterRadius: () => clusterRadiusRef.current,
        // 新增的聚类配置方法
        setClusterEnabled: (enabled: boolean) => {
          clusterEnabledRef.current = enabled;
          console.log("🔧 动态设置聚类启用:", enabled);
          updateFiltersAndClustering();
        },
        setClusterAlgorithm: (algorithm: ClusterAlgorithmType) => {
          clusterAlgorithmRef.current = algorithm;
          clusterInitializedRef.current = false; // 重置聚类管理器
          console.log("🔧 动态设置聚类算法:", algorithm);
          updateFiltersAndClustering();
        },
        setClusterRadius: (radius: number) => {
          clusterRadiusRef.current = radius;
          console.log("🔧 动态设置聚类半径:", radius);
          updateFiltersAndClustering();
        },
        setMinClusterSize: (minSize: number) => {
          clusterMinPointsRef.current = minSize;
          console.log("🔧 动态设置最小聚类大小:", minSize);
          updateFiltersAndClustering();
        },
      }),
      [updateFiltersAndClustering]
    );

    return (
      <div
        ref={containerRef}
        className={`container ${className}`}
        style={style}
      >
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
                    <div className="filter-category-title">
                      排除{category}：
                    </div>
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
                      geometries={markers}
                      onClick={markerTap}
                    />
                    <MultiLabel
                      styles={labelStyles}
                      geometries={clusterLabels}
                      onClick={markerTap}
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
                            const pointIndex = point.index || 0;
                            selectPointInCluster(pointIndex, currentClusterId);
                            setSelectedClusterPointIndex(index);
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
                            selectedListPointIndex === index ? "active" : ""
                          }`}
                          onClick={() => {
                            selectPoint(point, index);
                            setSelectedListPointIndex(index);
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
          {(() => {
            const selectedPoint = getSelectedPoint();
            return selectedPoint ? (
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
            );
          })()}
        </div>
      </div>
    );
  }
);

MapViewer.displayName = "MapViewer";

export default MapViewer;
