import * as React from "react";
import {
  ClusterAlgorithmType,
  Coordinate,
  DataPoint,
  MapViewerProps,
} from "../types";
import { MetaMap } from "../utils";
import "./MapViewer.css";
import { ToastNotification, ToastProps } from "./ToastNotification";

import { MultiLabel, MultiMarker, TMap } from "tlbs-map-react";
import {
  BasicClusterManager,
  Cluster,
  ClusterBasePoint,
  ClusterManager,
  ClusterOptions,
  DensityClusterManager,
  DistanceClusterManager,
  HierarchicalClusterManager,
} from "../clusters";

const { useCallback, useEffect, useMemo, useRef, useState } = React;

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

interface MapPoint extends DataPoint {
  latitude: number; // 兼容字段，映射自 center.lat
  longitude: number; // 兼容字段，映射自 center.lng
  index?: number;
}
// 聚类项目接口
interface ClusterItem extends ClusterBasePoint {
  id: string;
  name: string;
  point: MapPoint;
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

// 定义标记属性类型
interface MarkerProperties {
  clusterSize?: number;
  isCluster?: boolean;
  [key: string]: unknown;
}

// 定义标记回调类型
interface MarkerCallout {
  content: string;
  color?: string;
  fontSize?: number;
  borderRadius?: number;
  padding?: number;
  display?: string;
  textAlign?: string;
  [key: string]: unknown;
}

// 定义聚类标签类型
interface ClusterLabel {
  id: string;
  styleId: string;
  position: Coordinate;
  content: string;
}

// 定义标记类型
type Marker = {
  id: string;
  styleId: string;
  position: Coordinate;
  pointIndex?: number; // 保存对应的点位索引，用于单点标记
  properties?: MarkerProperties;
  callout?: MarkerCallout;
};

interface FilterState {
  [category: string]: {
    [value: string]: boolean;
  };
}

const initialCenter = {
  lat: 31.230416,
  lng: 121.473701,
};
const initialZoom = 10;
const minZoom = 3;
const maxZoom = 18;

export const MapViewer: React.FC<MapViewerProps> = ({
  mapData,
  defaultView = "map",
  clusterAlgorithm = ClusterAlgorithmType.HIERARCHICAL,
  minClusterSize = 2,
  clusterDistance = 100,
}) => {
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
  const [mapInited, setMapInited] = useState<boolean>(false); // 地图初始化状态

  // 地图相关状态
  const [center, setCenter] = useState<{
    lat: number;
    lng: number;
  }>({ ...initialCenter });
  const [zoom, setZoom] = useState<number>(initialZoom);

  // 地图事件状态

  // 聚类配置参数 - 使用 ref 管理，避免不必要的重新渲染
  const clusterAlgorithmRef = useRef<ClusterAlgorithmType>(clusterAlgorithm);
  const clusterMinPointsRef = useRef<number>(minClusterSize);
  const clusterFactorRef = useRef<number>(1.2);
  const [markers, setMarkers] = useState<Marker[]>([]); // 地图标记状态
  const clusterMapRef = useRef<{ [key: string]: MapPoint[] }>({});
  const [clusterLabels, setClusterLabels] = useState<ClusterLabel[]>([]); // 聚类数字标签

  // 聚类列表相关状态
  const [clusterListVisible, setClusterListVisible] = useState<boolean>(false);
  const [clusterPoints, setClusterPoints] = useState<MapPoint[]>([]);
  const [selectedClusterPointIndex, setSelectedClusterPointIndex] =
    useState<number>(-1);
  const [currentClusterId, setCurrentClusterId] = useState<string>("");

  // 选中的点位索引（在普通点位列表中的索引）
  const [selectedListPointIndex, setSelectedListPointIndex] =
    useState<number>(-1);

  // Toast 提示状态
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const boundsChangeTimerRef = useRef<NodeJS.Timeout | null>(null); // 防抖定时器
  const clusterManagerRef = useRef<ClusterManager<ClusterItem> | null>(null);
  const processingMarkerTapRef = useRef<boolean>(false); // 防止重复处理点击事件

  const clusterRadiusRef = useRef<number>(clusterDistance); // 聚类半径（米）

  // Point 相关的 ref，避免不必要的重新渲染
  const pointsRef = useRef<MapPoint[]>([]);
  const filteredPointsRef = useRef<MapPoint[] | null>(null);

  // Markers 和 ClusterLabels 相关的 ref，避免闭包问题
  const markersRef = useRef<Marker[]>([]);
  const clusterLabelsRef = useRef<ClusterLabel[]>([]);

  // 新增的选中状态 ref
  const selectedPointIndexRef = useRef<number>(0); // 记录被地图或列表选中的 point，数值为原始分配 index，0 代表未选中
  const selectedMarkerIdRef = useRef<string>(""); // 记录选中的 marker ID 或 cluster ID，空字符串代表未选中

  // 获取当前选中的点位 - 根据selectedPointIndex查找
  const getSelectedPoint = (): MapPoint | null => {
    if (selectedPointIndexRef.current > 0) {
      return (
        getFilteredPoints().find(
          (p) => p.index === selectedPointIndexRef.current
        ) || null
      );
    }
    return null;
  };

  // 获取点位的聚类信息
  const getClusterInfo = (
    index: number
  ): {
    clusterId: string | null;
    isInCluster: boolean;
  } => {
    // 查找点位是否在聚类中，返回详细的聚类信息
    for (const [clusterId, points] of Object.entries(clusterMapRef.current)) {
      if (points.some((p) => p.index === index)) {
        return {
          clusterId: clusterId,
          isInCluster: true,
        };
      }
    }
    return {
      clusterId: null,
      isInCluster: false,
    };
  };

  // 更新选中状态的统一函数
  // setSelectedListPointIndex 在 tabChange 时更新
  const updateSelectedMarker = (pointIndex: number, markerId: string) => {
    const prevPointIndex = selectedPointIndexRef.current;
    const prevMarkerId = selectedMarkerIdRef.current;
    selectedPointIndexRef.current = pointIndex;
    selectedMarkerIdRef.current = markerId;
    console.log(
      "🎯 更新选中状态:",
      prevPointIndex,
      prevMarkerId,
      pointIndex,
      markerId
    );
  };

  // 清除选中状态的统一函数
  const clearSelectedMarker = () => {
    selectedPointIndexRef.current = 0;
    selectedMarkerIdRef.current = "";
    clearClusterSelection();

    console.log("🎯 清除选中状态");
  };

  // 检查是否有筛选器
  const hasFilters = useMemo(() => {
    return Object.keys(availableFilters).length > 0;
  }, [availableFilters]);

  // 获取标签的分类 - 从mapData.filter中获取
  const getCategoryForTag = (tag: string): string => {
    if (mapData.filter) {
      // 检查inclusive筛选器
      for (const [category, tags] of Object.entries(mapData.filter.inclusive)) {
        if (Array.isArray(tags) && tags.includes(tag)) {
          return category;
        }
      }
      // 检查exclusive筛选器
      for (const [category, tags] of Object.entries(mapData.filter.exclusive)) {
        if (Array.isArray(tags) && tags.includes(tag)) {
          return category;
        }
      }
    }
    // 如果在filter中找不到，返回默认分类
    return "其他";
  };

  // 初始化数据和筛选器
  const updateMetaMapData = () => {
    console.log("📊 开始初始化地图数据");
    let metaMap: MetaMap;

    try {
      setLoading(true);

      metaMap = new MetaMap(mapData);

      const convertedPoints = metaMap.getAllDataPoints().map(
        (point: DataPoint, index: number): MapPoint => ({
          ...point,
          latitude: point.center.lat,
          longitude: point.center.lng,
          index: index + 1,
        })
      );

      pointsRef.current = convertedPoints;

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

      // 获取筛选后的数据并执行聚类
      updateClusters();

      updateMapBounds(mapData.center, mapData.zoom[0]);

      setLoading(false);

      // 如果地图已经初始化，则需要重置地图状态
      if (mapInited) {
        resetMap();
      }

      console.log("📊 地图数据初始化完成");
    } catch (error) {
      console.error("地图数据初始化失败:", error);
      setLoading(false);
    }
  };

  // 检查 mapData 变化，触发数据初始化
  useEffect(() => {
    updateMetaMapData();
  }, [mapData]);

  // 同步 markers state 到 markersRef
  // 同步 clusterLabels state 到 clusterLabelsRef
  useEffect(() => {
    markersRef.current = markers;
    clusterLabelsRef.current = clusterLabels;
  }, [markers, clusterLabels]);

  const getFilteredPoints = () => {
    if (filteredPointsRef.current) return filteredPointsRef.current;
    else {
      filteredPointsRef.current = generateFilteredPoints();
      setFilteredPoints(filteredPointsRef.current);
      return filteredPointsRef.current;
    }
  };

  const clearFilteredPoints = () => {
    filteredPointsRef.current = null;
    setFilteredPoints([]);
  };

  // 应用筛选器（合并循环）
  const generateFilteredPoints = () => {
    if (pointsRef.current.length === 0) {
      console.warn("🔄 没有点位数据，返回空数组");
      return [];
    }
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

  // 计算标记样式更新的纯函数（不依赖 states）
  const generateMarkerStyles = (
    selectedMarkerId: string,
    inputMarkers: Marker[]
  ): Marker[] => {
    if (!inputMarkers || inputMarkers.length === 0) {
      return [];
    }

    // 直接使用 selectedMarkerId 来确定选中状态，这是最准确的信息源
    const updatedMarkers = inputMarkers.map((marker) => {
      let isSelected = false;

      if (selectedMarkerId) {
        // 直接比较 marker ID，这是最简单和准确的方式
        isSelected = marker.id === selectedMarkerId;
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
      selectedMarkerIdRef.current,
      markersRef.current
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

    clearFilteredPoints();
    clearSelectedMarker();
    updateClusters();
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

    clearFilteredPoints();
    clearSelectedMarker();
    updateClusters();
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

    clearFilteredPoints();
    clearSelectedMarker();
    updateClusters();
  };

  // 切换筛选器展开状态
  const toggleFilter = () => {
    setFilterExpanded(!filterExpanded);
  };

  // Tab切换
  const onTabChange = (value: string) => {
    setActiveTab(value as "map" | "list");
    setSelectedListPointIndex(selectedPointIndexRef.current - 1 || -1);
  };

  // 聚类点选择
  const selectPointInCluster = useCallback(
    (pointIndex: number, currentClusterId: string) => {
      console.log("🎯 selectPointInCluster开始:", {
        pointIndex,
        currentClusterId,
      });

      // 确定选中的 marker ID
      let markerId = "";
      if (currentClusterId) {
        // 如果在聚类中，使用聚类ID
        markerId = currentClusterId;
      } else {
        // 如果不在聚类中，使用点位的 marker ID
        markerId = `marker-${pointIndex}`;
      }

      // 使用统一的选中状态更新函数
      updateSelectedMarker(pointIndex, markerId);

      // 计算样式更新并应用
      applyMarkerStylesUpdate();
    },
    []
  );

  // 点位选择
  const selectPoint = useCallback((point: MapPoint) => {
    const pointIndex = point.index || 0;
    let markerId = `marker-${pointIndex}`; // 默认选中点本身

    // 只有当有 selectedPointIndex 时，才判断是否在聚类中
    if (pointIndex > 0) {
      const clusterInfo = getClusterInfo(pointIndex);
      if (clusterInfo.isInCluster && clusterInfo.clusterId) {
        // 点在聚类中，选中聚类
        markerId = clusterInfo.clusterId;
      }
      // 如果不在聚类中，markerId 保持为 marker-X 格式
    }

    // 使用统一的选中状态更新函数
    updateSelectedMarker(pointIndex, markerId);

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
    // 直接从 markersRef 中查找对应的聚类标记
    const clusterMarker = markersRef.current.find(
      (marker) => marker.id === clusterId
    );
    if (!clusterMarker) {
      console.warn("🎯 zoomToCluster - 聚类标记不存在:", clusterId);
      return;
    }

    // 获取当前缩放级别
    const currentMapScale = getMapZoom();
    // 放大到适当级别，但不超过最大缩放
    const compensation = 1.5;
    const newScale = Math.min(currentMapScale + 1, maxZoom - compensation);

    // 设置新的中心点和缩放级别
    updateMapBounds(
      {
        lat: clusterMarker.position.lat,
        lng: clusterMarker.position.lng,
      },
      newScale
    );
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
      if (selectedPointIndexRef.current > 0) {
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
  };

  // 标记点击处理
  const markerTap = useCallback((event: any) => {
    try {
      const clickedMarkerId = event.geometry.id;
      console.log("🎯 标记点击:", clickedMarkerId);

      // 检查是否正在处理点击事件，避免重复触发
      if (processingMarkerTapRef.current) {
        console.warn("正在处理点击事件，忽略点击事件");
        return;
      }

      // 标记正在处理点击事件
      processingMarkerTapRef.current = true;

      // 清除所选状态
      clearSelectedMarker();

      if (
        clickedMarkerId.startsWith("cluster-") ||
        clickedMarkerId.startsWith("label-")
      ) {
        // 聚类标记或标签点击
        const clusterId = clickedMarkerId.startsWith("cluster-")
          ? clickedMarkerId // 聚类ID本身就是 cluster-X 格式
          : clickedMarkerId.replace("label-", ""); // 标签ID是 label-cluster-X，需要移除 label- 前缀

        // 确保聚类点在当前clusterMap中存在
        if (!clusterMapRef.current[clusterId]) {
          console.warn("聚类点不存在于当前clusterMap中", {
            clickedClusterId: clusterId,
          });
          return;
        }

        // 获取当前缩放级别
        const currentMapScale = getMapZoom();
        const compensation = 1.5;

        console.log("🎯 markerTap - 聚类选中:", clusterId);

        // 检查是否已达到最大缩放级别
        if (currentMapScale < maxZoom - compensation) {
          // 未达到最大缩放，放大地图
          zoomToCluster(clusterId);
        } else {
          // 已达到最大缩放，显示聚类点列表
          showClusterList(clusterId);
        }
      } else if (clickedMarkerId.startsWith("marker-")) {
        // 普通点位标记点击 - 使用保存在marker中的pointIndex信息

        // 从当前markers中查找对应的pointIndex
        const clickedMarker = markersRef.current.find(
          (m) => m.id === clickedMarkerId
        );

        if (clickedMarker && clickedMarker.pointIndex) {
          const pointIndex = clickedMarker.pointIndex;
          // 使用点击的 marker ID
          updateSelectedMarker(pointIndex, clickedMarkerId);

          // 计算样式更新并应用
          applyMarkerStylesUpdate();
        } else {
          console.warn("无法找到对应的点位信息:", clickedMarkerId);
        }
      }
    } catch (error) {
      console.warn("处理标记点击事件失败:", error);
    } finally {
      processingMarkerTapRef.current = false;
    }
  }, []);

  // tlbs-map-react 封装得稀烂
  const updateMapBounds = (
    center: { lat: number; lng: number },
    zoom: number
  ) => {
    mapRef.current?.easeTo({
      center: { ...center },
      zoom: zoom,
    });
    setCenter(center);
    setZoom(zoom);
  };

  const getMapZoom = () => {
    return mapRef.current?.getZoom() || initialZoom;
  };

  const getMapCenter = () => {
    return mapRef.current?.getCenter() || { ...initialCenter };
  };

  // 重置地图
  const resetMap = useCallback(() => {
    // TODO: 这里地图更新会出发两次, bounds 一次, marker 一次
    updateMapBounds(mapData.center, mapData.zoom[0]);

    clearSelectedMarker();
    applyMarkerStylesUpdate();

    clearClusterSelection();
  }, []);

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

  // Toast 相关函数
  const showToast = (
    message: string,
    type: "success" | "error" | "info" | "warning" = "info",
    duration = 2000
  ) => {
    const newToast: ToastProps = {
      message,
      type,
      duration,
    };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (index: number) => {
    setToasts((prev) => prev.filter((_, i) => i !== index));
  };

  // 复制文本
  const copyText = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          showToast("已复制到剪贴板", "success");
        })
        .catch((err) => {
          console.error("复制失败:", err);
          showToast("复制失败", "error");
        });
    } else {
      showToast("浏览器不支持剪贴板操作", "warning");
    }
  };

  const clearClusterManager = () => {
    clusterManagerRef.current = null;
  };

  // 初始化聚类管理器
  const initClusterManager = (): void => {
    const baseOptions = {
      radius: clusterRadiusRef.current,
      minPoints: clusterMinPointsRef.current,
    };

    switch (clusterAlgorithmRef.current) {
      case ClusterAlgorithmType.DISTANCE:
        clusterManagerRef.current = new DistanceClusterManager(baseOptions);
        break;

      case ClusterAlgorithmType.DENSITY:
        // 密度聚类通常需要更多的最小点数和稍大的半径
        const densityOptions = {
          ...baseOptions,
          minPoints: Math.max(baseOptions.minPoints, 3), // DBSCAN 通常至少需要3个点
          radius: baseOptions.radius * 1.2, // 稍微增大半径以形成有意义的密度聚类
        };
        clusterManagerRef.current = new DensityClusterManager(densityOptions);
        break;

      case ClusterAlgorithmType.HIERARCHICAL:
        // 层次聚类对半径更敏感，使用原始参数
        const hierarchicalOptions = {
          ...baseOptions,
          maxZoom, // 最大递归深度
        };
        clusterManagerRef.current = new HierarchicalClusterManager(
          hierarchicalOptions
        );
        break;

      case ClusterAlgorithmType.BASIC:
      default:
        clusterManagerRef.current = new BasicClusterManager(baseOptions);
        break;
    }
  };

  // 获取聚类管理器，如果不存在则创建
  const getClusterManager = (): ClusterManager<ClusterItem> => {
    if (!clusterManagerRef.current) {
      initClusterManager();
    }
    if (!clusterManagerRef.current) {
      console.error("clusterManagerRef.current is null");
    }
    return clusterManagerRef.current!;
  };

  // 将点位数据转换为聚类管理器需要的格式
  const generateClusterPoints = (filteredPoints: MapPoint[]): ClusterItem[] => {
    return filteredPoints.map((point, index) => ({
      id: `point_${point.index || index}`,
      name: point.name,
      x: point.longitude, // 经度
      y: point.latitude, // 纬度
      weight: 1,
      point: point,
    }));
  };

  // 初始化聚类
  // 统一的聚类更新函数
  const updateClusters = (options?: Partial<ClusterOptions>) => {
    try {
      // 获取筛选后的点数据
      const filteredPoints = getFilteredPoints();

      // 生成聚类点数据
      const clusterPoints = generateClusterPoints(filteredPoints);

      // 获取聚类管理器
      const clusterManager = getClusterManager();

      // 使用统一的接口：更新点数据和选项
      const clusterResults = clusterManager.updateClusters(
        clusterPoints,
        options
      );
      updateClusterMap(clusterResults);
    } catch (error) {
      console.error("更新聚类失败:", error);
    }
  };

  // 处理聚类更新
  // 更新 clusterMapRef 和 markersRef 和 clusterLabelsRef
  const updateClusterMap = (clusterResults: Cluster<ClusterItem>[]) => {
    // 重置全局ID计数器，确保每次聚类更新时ID从0开始
    ClusterManager.resetGlobalIdCounter();

    // 处理聚类结果，转换为地图标记格式和标签（合并循环）
    const generatedMarkers: Marker[] = [];
    const newClusterMap: { [key: string]: MapPoint[] } = {};
    const generatedLabels: ClusterLabel[] = [];

    clusterResults.forEach((cluster, index) => {
      const isCluster = cluster.points.length > 1;
      const center = cluster.center;

      if (isCluster) {
        // 聚类标记 - 使用静态方法生成统一的ID
        const clusterId = ClusterManager.generateClusterLabelId();
        newClusterMap[clusterId] = cluster.points.map(
          (p: ClusterItem) => p.point
        );

        generatedMarkers.push({
          id: clusterId, // 使用统一生成的 cluster-X 格式
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
          id: ClusterManager.generateClusterMarkerId(clusterId), // 生成 label-cluster-X 格式
          styleId: "clusterLabel",
          position: {
            lat: center.y,
            lng: center.x,
          },
          content: cluster.points.length.toString(),
        });
      } else {
        // 单个点标记 - 使用静态方法生成统一的ID
        const point = cluster.points[0].point;
        const markerId = ClusterManager.generateMarkerLabelId();

        generatedMarkers.push({
          id: markerId, // 使用统一生成的 marker-X 格式
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
          // 保存点位信息以便后续查找
          pointIndex: point.index,
        });
      }
    });

    // 首先更新 clusterMapRef，以便后续的 getClusterInfo 能正确工作
    clusterMapRef.current = newClusterMap;

    // 计算新的选中状态
    let finalPointIndex = selectedPointIndexRef.current;
    let finalMarkerId = selectedMarkerIdRef.current;

    if (selectedPointIndexRef.current > 0) {
      const currentPointIndex = selectedPointIndexRef.current;
      const clusterInfo = getClusterInfo(currentPointIndex);

      if (clusterInfo.isInCluster && clusterInfo.clusterId) {
        // 点位现在在聚类中，且当前选中状态不是这个聚类，则更新选中状态
        if (selectedMarkerIdRef.current !== clusterInfo.clusterId) {
          finalMarkerId = clusterInfo.clusterId;
        }
      } else if (!clusterInfo.isInCluster) {
        // 点位现在不在聚类中，但当前选中的是聚类，则更新为点位选中
        if (selectedMarkerIdRef.current.startsWith("cluster-")) {
          finalMarkerId = `marker-${currentPointIndex}`;
        }
      }
    }

    // 更新选中状态
    updateSelectedMarker(finalPointIndex, finalMarkerId);

    // 应用样式到标记
    const finalMarkers = generateMarkerStyles(finalMarkerId, generatedMarkers);

    // 一次性应用所有状态更新
    setMarkers(finalMarkers);
    setClusterLabels(generatedLabels);
  };

  // 根据当前缩放级别动态调整聚类参数
  const getClusterRadius = (): {
    needsUpdate: boolean;
    newRadius?: number;
  } => {
    if (!mapRef.current) {
      return { needsUpdate: false };
    }

    // 获取当前缩放级别
    const currentMapScale = getMapZoom();

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

    // 如果有变化，更新参数并返回结果
    if (Math.abs(newClusterRadius - currentRadius) > 1) {
      // 使用小的容差避免浮点精度问题
      clusterRadiusRef.current = newClusterRadius;
      return { needsUpdate: true, newRadius: newClusterRadius };
    }

    return { needsUpdate: false };
  };

  // 处理地图边界变化事件
  const handleBoundsChanged = (event: any) => {
    // 清除之前的定时器
    if (boundsChangeTimerRef.current) {
      clearTimeout(boundsChangeTimerRef.current);
    }

    // 设置新的防抖定时器，300ms后没有新事件时执行
    boundsChangeTimerRef.current = setTimeout(() => {
      const { needsUpdate, newRadius } = getClusterRadius();
      if (needsUpdate && newRadius) {
        console.log("🔧 聚类半径已更新:", newRadius);
        // 使用新的半径参数更新聚类
        const options: Partial<ClusterOptions> = {
          radius: newRadius,
        };
        updateClusters(options);
      }
    }, 300);
  };

  // 地图初始化完成
  const onMapInited = () => {
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

    // 设置地图初始化状态
    setMapInited(true);

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

  // 监听聚类参数变化 - 只需要更新参数
  useEffect(() => {
    let configChanged = false;
    const options: Partial<ClusterOptions> = {};

    if (clusterAlgorithmRef.current !== clusterAlgorithm) {
      clusterAlgorithmRef.current = clusterAlgorithm;
      configChanged = true;
      console.log("🔧 聚类算法已更新:", clusterAlgorithm);
      clearClusterManager();
    }

    if (clusterMinPointsRef.current !== minClusterSize) {
      clusterMinPointsRef.current = minClusterSize;
      configChanged = true;
      console.log("🔧 最小聚类大小已更新:", minClusterSize);
      options.minPoints = minClusterSize;
    }

    if (clusterRadiusRef.current !== clusterDistance) {
      clusterRadiusRef.current = clusterDistance;
      configChanged = true;
      console.log("🔧 聚类距离已更新:", clusterDistance);
      options.radius = clusterDistance;
    }

    // 如果配置发生变化，重新执行聚类
    if (configChanged) {
      clearSelectedMarker();
      updateClusters(options);
    }
  }, [clusterAlgorithm, minClusterSize, clusterDistance]);

  // 阻止事件冒泡
  const preventBubble = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div ref={containerRef} className={"container"}>
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
              <i
                className={`fa-solid ${
                  filterExpanded ? "fa-chevron-up" : "fa-chevron-down"
                }`}
              ></i>
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
                <TMap
                  ref={mapRef}
                  apiKey={TENCENT_MAP_API_KEY}
                  options={{
                    center: center,
                    viewMode: "2D",
                    zoom: zoom,
                    minZoom,
                    maxZoom,
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
                </TMap>
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
                      <i className="fa-solid fa-arrow-left"></i> 返回列表
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
                  className="points-list"
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
                          selectPoint(point);
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
                    <i className="fa-solid fa-location-dot detail-icon"></i>
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
                    <i className="fa-solid fa-phone detail-icon"></i>
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
                    <i className="fa-solid fa-link detail-icon"></i>
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
                    <i className="fa-solid fa-compass navigation-icon"></i>
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

      {/* Toast 通知组件 */}
      <ToastNotification toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
};
