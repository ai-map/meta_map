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

// 腾讯地图API导入
import { MultiMarker, BaseMap } from "tlbs-map-react";

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
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAC4jAAAuIwF4pT92AAAF8WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDggNzkuMTY0MDM2LCAyMDE5LzA4LzEzLTAxOjA2OjU3ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjEuMCAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDI1LTA1LTE4VDE2OjM0OjEyKzA4OjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDI1LTA1LTE4VDE2OjM0OjEyKzA4OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyNS0wNS0xOFQxNjozNDoxMiswODowMCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo1NzM0NzJlNS0wMzhiLWFkNGMtYjQ3ZC0yZWFjY2ZlODRmMzQiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDo2MGIxOGExYy1lNzU2LTU0NDYtOGM4MC0xMjI3NzIyNTgyZjYiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo5MzA1ZDU3ZC0yMDY2LTY3NGYtYTA1NS0wZTVhMmJmNWZlYjQiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0ic1JHQiBJRUM2MTk2Ni0yLjEiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjkzMDVkNTdkLTIwNjYtNjc0Zi1hMDU1LTBlNWEyYmY1ZmViNCIgc3RFdnQ6d2hlbj0iMjAyNS0wNS0xOFQxNjozNDoxMiswODowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIxLjAgKFdpbmRvd3MpIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo1NzM0NzJlNS0wMzhiLWFkNGMtYjQ3ZC0yZWFjY2ZlODRmMzQiIHN0RXZ0OndoZW49IjIwMjUtMDUtMThUMTY6MzQ6MTIrMDg6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMS4wIChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz5VDH8EAAAChUlEQVRIia2Wv0sbYRjHP/d6yUWTuyw1ooOFiA6NawTFxX+gi1Clg7jYDg7FoVjexe1ah9Kpm1PoDxWk/0HtFETXZhJTK0UwFqG5U3Pxcm8HPbFitOo94/vA5/M+vPB8X03NzdGsqrbdDTwFRoBHQDtwAvwCfgLfgCVLyh/NGNpVgjPwGy2ReBLL5Vr0bBbR0YFIJlGNBspxCA4O8MtlTkqlQNVqS8ArS8qdGwVV236Mrn8whobM+MAAWjzedEIAVa9TX1/HKxZdfP+ZJeXni31xCf5CpNNfkpOTpjE8fCMcQIvHMYaHSU1OpkQ6/bFq2zNXCqq2PSZM813bxIRoyWRuBF8ukcnQNjGhCdN8W7XtsX8EVdvuRtcXWkdHNWGat4afw0yT1tFRDV1fOHvH8wleG/l8qqWr687wsFq6ujDy+RQwD6D9icUeaolEOTU9LTTDuLcAQHke7vv3garVsgIY13t7I4MDaIZBLJcTwLgARmJ9fZHBw9KzWYARAfSLzs7IBaKjA6BfAA9EMhm94JTZLgBUoxG54FwE/FauGzk4ODwE2BdAqbG/H71gbw/guwC++pubkQv8chlgVQBL/uZmoDwvMrjyPE5KpQBYEpaU2+r4eLleLEYmqBeLqFpt2ZJyO9xFs97GhtvY3b03vLG7i7ex4QKzcLbsLCl38P2p45UVFTjOneGB43C8sqLw/akw3c7zwJJyMXCcmaNCIWhUKreHVyocFQoqcJyXlpSL4XnzyMznzfjgIFoicS1Y1WrU19bw1tddfP+5JeWni/3rQn/+LPSF3tODyGQQqdTpbV2XoFLB39oKQ38ZmP2v0L9CFH5bckCYpRWgBKwCy5aU5WaMv+OBCH36scpNAAAAAElFTkSuQmCC";
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

// 聚类距离阈值和缩放级别的映射关系
const MAP_SCALE_TO_RATIO: { [key: string]: number } = {
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

// 聚类距离阈值（单位：度，大约111公里/度）
const CLUSTER_DISTANCE_THRESHOLD = 0.0001; // 约11米

// 聚类配置
const CLUSTER_CONFIG = {
  markerWidth: 24,
  markerHeight: 24,
  clusterFactor: 1.2, // 聚类强度因子
  maxZoomForCluster: 18, // 最大缩放级别，超过此级别显示聚类列表而不是放大
};

interface ClusterPoint {
  points: MapPoint[];
  center: {
    latitude: number;
    longitude: number;
  };
}

// 获取标签的分类
function getCategoryForTag(tag: string): string {
  const cityTags = [
    "上海",
    "北京",
    "南京",
    "厦门",
    "合肥",
    "吉林",
    "大连",
    "天津",
    "定州",
    "广州",
    "成都",
    "拉萨",
    "无锡",
    "杭州",
    "深圳",
    "石家庄",
    "秦皇岛",
    "菏泽",
    "重庆",
  ];
  const timeTags = [
    "2024-06",
    "2024-07",
    "2024-08",
    "2024-09",
    "2024-10",
    "2024-11",
    "2024-12",
    "2025-01",
    "2025-02",
    "2025-03",
    "2025-04",
    "2025-05",
  ];

  if (cityTags.includes(tag)) return "城市";
  if (timeTags.includes(tag)) return "更新时间";
  if (tag === "自助") return "自助";
  return "类型";
}

const MapViewer: React.FC<MapViewerProps> = ({
  mapData,
  className = "",
  style = {},
  onPointSelect,
  onMapReady,
  defaultView = "map",
  showControls = true,
  enableNavigation = true,
}) => {
  // 状态管理
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

  // 地图相关状态
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: 39.9042,
    lng: 116.4074,
  });
  const [mapZoom, setMapZoom] = useState<number>(10);
  const [currentScale, setCurrentScale] = useState<number>(10);
  const [minScale] = useState<number>(3);
  const [maxScale] = useState<number>(18);

  // 聚合相关状态
  const [clusterListVisible, setClusterListVisible] = useState<boolean>(false);
  const [clusterPoints, setClusterPoints] = useState<MapPoint[]>([]);
  const [scrollIntoView, setScrollIntoView] = useState<string>("");
  const [scrollIntoClusterView, setScrollIntoClusterView] =
    useState<string>("");
  const [clusterMap, setClusterMap] = useState<{ [key: number]: MapPoint[] }>(
    {}
  );
  const [clusterRadius, setClusterRadius] = useState<number>(100);

  // 容器宽度状态
  const [containerWidth, setContainerWidth] = useState<number>(0);

  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 检查是否有筛选器
  const hasFilters = useMemo(() => {
    return Object.keys(availableFilters).length > 0;
  }, [availableFilters]);

  // 监听容器宽度变化
  useEffect(() => {
    const updateContainerWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        if (width !== containerWidth) {
          setContainerWidth(width);

          // 强制重新计算tab-content宽度
          const tabContent = containerRef.current.querySelector(
            ".tab-content"
          ) as HTMLElement;
          if (tabContent) {
            tabContent.style.width = "100%";
            // 触发重排
            tabContent.offsetWidth;
          }
        }
      }
    };

    const resizeObserver = new ResizeObserver(updateContainerWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // 初始更新
    updateContainerWidth();

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerWidth]);

  // Tab切换时强制更新宽度
  useEffect(() => {
    const timer = setTimeout(() => {
      if (containerRef.current) {
        const tabContent = containerRef.current.querySelector(
          ".tab-content"
        ) as HTMLElement;
        if (tabContent) {
          tabContent.style.width = "100%";
          // 触发重排
          tabContent.offsetWidth;
        }
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [activeTab]);

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
        setMapZoom(mapData.zoom[0]);
        setCurrentScale(mapData.zoom[0]);
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
  }, [mapData, onMapReady]);

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
  }, [applyFilters, selectedPoint]);

  // 计算Haversine距离
  const calculateHaversineDistance = useCallback(
    (point1: any, point2: any): number => {
      const R = 6371000; // 地球半径，单位：米
      const lat1 = (point1.latitude * Math.PI) / 180;
      const lat2 = (point2.latitude * Math.PI) / 180;
      const dLat = ((point2.latitude - point1.latitude) * Math.PI) / 180;
      const dLon = ((point2.longitude - point1.longitude) * Math.PI) / 180;

      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1) *
          Math.cos(lat2) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      return distance;
    },
    []
  );

  // 创建聚类标记
  const createClusteredMarkers = useCallback(
    (pointsData: MapPoint[]) => {
      const clusters: ClusterPoint[] = [];
      const newClusterMap: { [key: number]: MapPoint[] } = {};

      // 根据当前缩放级别计算动态聚类阈值
      const dynamicThreshold =
        CLUSTER_DISTANCE_THRESHOLD * Math.max(1, (18 - currentScale) / 5);

      // 对每个点进行聚合分析
      pointsData.forEach((point) => {
        const lat = point.latitude;
        const lng = point.longitude;

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

          // 如果距离小于动态阈值，加入此聚合
          if (distance <= dynamicThreshold) {
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
      const markers: any[] = [];

      // 为每个聚合创建标记
      clusters.forEach((cluster, index) => {
        const clusterId = -(index + 1); // 使用负数作为聚合点ID

        if (cluster.points.length === 1) {
          // 单点，创建普通标记
          const point = cluster.points[0];
          const pointId = `marker-${point.index}`;

          markers.push({
            id: pointId,
            styleId:
              selectedPointIndex === point.index ? "selected" : "default",
            position: {
              lat: cluster.center.latitude,
              lng: cluster.center.longitude,
            },
          });
        } else {
          // 多点聚合，创建聚合标记
          newClusterMap[clusterId] = cluster.points;
          const clusterMarkerId = `cluster-${Math.abs(clusterId)}`;

          markers.push({
            id: clusterMarkerId,
            styleId: "default",
            position: {
              lat: cluster.center.latitude,
              lng: cluster.center.longitude,
            },
            properties: {
              isCluster: true,
              clusterId: clusterId,
              pointCount: cluster.points.length,
            },
            content: cluster.points.length.toString(), // 显示聚类数量
          });
        }
      });

      setClusterMap(newClusterMap);
      return markers;
    },
    [selectedPointIndex, currentScale]
  );

  // 生成腾讯地图标记
  const tencentMarkers = useMemo(() => {
    return createClusteredMarkers(filteredPoints);
  }, [createClusteredMarkers, filteredPoints]);

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
  }, [points]);

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
      setScrollIntoView(`point-${point.index}`);
      onPointSelect?.(point);

      // 更新地图中心
      setMapCenter({ lat: point.latitude, lng: point.longitude });
    },
    [onPointSelect]
  );

  // 放大到聚类位置
  const zoomToCluster = useCallback(
    (clusterId: number) => {
      const clusterPointsData = clusterMap[clusterId];
      if (!clusterPointsData || clusterPointsData.length === 0) return;

      // 计算聚类中心
      const centerLat =
        clusterPointsData.reduce((sum, p) => sum + p.latitude, 0) /
        clusterPointsData.length;
      const centerLng =
        clusterPointsData.reduce((sum, p) => sum + p.longitude, 0) /
        clusterPointsData.length;

      // 放大地图
      const compensation = 1.5;
      const newScale = Math.min(currentScale + 2, maxScale - compensation);

      console.log(
        "Zooming to cluster:",
        clusterId,
        "new scale:",
        newScale,
        "center:",
        { lat: centerLat, lng: centerLng }
      );

      // 更新地图状态
      setMapCenter({ lat: centerLat, lng: centerLng });
      setMapZoom(newScale);
      setCurrentScale(newScale);

      // 调整聚类参数
      setTimeout(() => {
        const roundedScale = Math.ceil(newScale).toString();
        let newClusterRadius = 100;
        if (MAP_SCALE_TO_RATIO[roundedScale]) {
          newClusterRadius =
            MAP_SCALE_TO_RATIO[roundedScale] * CLUSTER_CONFIG.clusterFactor;
        }
        newClusterRadius /= 2;
        setClusterRadius(newClusterRadius);
      }, 100);
    },
    [clusterMap, currentScale, maxScale]
  );

  // 显示聚类点列表
  const showClusterList = useCallback(
    (clusterId: number) => {
      const clusterPointsData = clusterMap[clusterId];
      if (clusterPointsData && clusterPointsData.length > 0) {
        console.log(`聚合点包含 ${clusterPointsData.length} 个位置`);

        setActiveTab("list");
        setClusterListVisible(true);
        setClusterPoints(clusterPointsData);

        // 如果已经有选中的点位，检查该点位是否在聚合点列表中
        if (selectedPoint) {
          const clusterPointIndex = clusterPointsData.findIndex(
            (p) => p.index === selectedPoint.index
          );
          if (clusterPointIndex >= 0) {
            setTimeout(() => {
              setScrollIntoClusterView(`cluster-point-${selectedPoint.index}`);
              setTimeout(() => {
                setScrollIntoClusterView("");
              }, 300);
            }, 100);
          }
        }
      }
    },
    [clusterMap, selectedPoint]
  );

  // 标记点击处理
  const markerTap = useCallback(
    (event: any) => {
      try {
        const clickedMarkerId = event.geometry.id;
        console.log("标记点击:", clickedMarkerId);

        // 检查是否是聚类标记
        if (clickedMarkerId.startsWith("cluster-")) {
          const clusterIndex = parseInt(clickedMarkerId.split("-")[1]);
          const clusterId = -clusterIndex; // 转换为负数ID

          // 检查是否已达到最大缩放级别
          const compensation = 1.5;
          if (currentScale < maxScale - compensation) {
            // 未达到最大缩放，放大地图
            console.log("zoomToCluster");
            zoomToCluster(clusterId);
          } else {
            // 已达到最大缩放，显示聚合点列表
            console.log("showClusterList");
            showClusterList(clusterId);
          }
        } else if (clickedMarkerId.startsWith("marker-")) {
          // 普通点位
          const pointIndex = parseInt(clickedMarkerId.split("-")[1]);
          const point = filteredPoints.find((p) => p.index === pointIndex);
          if (point) {
            // 清除聚合点选择状态
            setClusterListVisible(false);
            setClusterPoints([]);

            selectPoint(point, pointIndex - 1);
          }
        }
      } catch (error) {
        console.warn("处理标记点击事件失败:", error);
      }
    },
    [
      filteredPoints,
      selectPoint,
      currentScale,
      maxScale,
      zoomToCluster,
      showClusterList,
    ]
  );

  // 重置地图
  const resetMap = useCallback(() => {
    const initialCenter = mapData.center || { lat: 39.9042, lng: 116.4074 };
    const initialZoom = mapData.zoom?.[0] || 10;

    console.log("重置地图到初始状态:", {
      center: initialCenter,
      zoom: initialZoom,
    });

    // 直接更新状态，让React重新渲染地图
    setMapCenter(initialCenter);
    setMapZoom(initialZoom);
    setCurrentScale(initialZoom);

    // 重置选中状态和聚类状态
    setSelectedPoint(null);
    setSelectedPointIndex(null);
    setClusterListVisible(false);
    setClusterPoints([]);

    // 根据新的缩放级别调整聚类参数
    setTimeout(() => {
      const scale = initialZoom;
      const roundedScale = Math.ceil(scale).toString();
      let newClusterRadius = 100;
      if (MAP_SCALE_TO_RATIO[roundedScale]) {
        newClusterRadius =
          MAP_SCALE_TO_RATIO[roundedScale] * CLUSTER_CONFIG.clusterFactor;
      }
      newClusterRadius /= 2;
      setClusterRadius(newClusterRadius);
    }, 100);
  }, [mapData]);

  // 地图区域变化
  const regionChange = useCallback(
    (event: any) => {
      console.log("regionChange event:", event);
      if (event.type === "end") {
        const scale = event.scale || event.detail?.scale || mapZoom;
        if (scale && scale !== currentScale) {
          console.log("Scale changed from", currentScale, "to", scale);
          setCurrentScale(scale);

          // 根据缩放级别调整聚类参数
          adjustClusterParameters(scale);
        }
      }
    },
    [currentScale, mapZoom]
  );

  // 根据当前缩放级别动态调整聚类参数
  const adjustClusterParameters = useCallback(
    (scale?: number) => {
      const currentScale = scale || mapZoom;

      // 向上取整缩放级别，确保能找到对应的比例尺值
      const roundedScale = Math.ceil(currentScale).toString();

      // 获取对应的比例尺值作为半径
      let newClusterRadius = 100; // 默认值
      if (MAP_SCALE_TO_RATIO[roundedScale]) {
        newClusterRadius =
          MAP_SCALE_TO_RATIO[roundedScale] * CLUSTER_CONFIG.clusterFactor;
      } else {
        // 如果没有对应的比例尺值，使用最接近的级别
        const scales = Object.keys(MAP_SCALE_TO_RATIO)
          .map(Number)
          .sort((a, b) => a - b);
        const closestScale =
          scales.find((s) => s >= currentScale) || scales[scales.length - 1];
        newClusterRadius =
          MAP_SCALE_TO_RATIO[closestScale.toString()] *
          CLUSTER_CONFIG.clusterFactor;
      }

      newClusterRadius /= 2;

      console.log(
        `当前缩放级别: ${currentScale}, 取整: ${roundedScale}, 半径: ${newClusterRadius}m`
      );

      // 如果有变化，更新参数
      if (newClusterRadius !== clusterRadius) {
        setClusterRadius(newClusterRadius);
      }
    },
    [mapZoom, clusterRadius]
  );

  // 导航到位置
  const navigateToLocation = useCallback(() => {
    if (selectedPoint && enableNavigation) {
      const url = `https://uri.amap.com/marker?position=${
        selectedPoint.longitude
      },${selectedPoint.latitude}&name=${encodeURIComponent(
        selectedPoint.name
      )}`;
      window.open(url, "_blank");
    }
  }, [selectedPoint, enableNavigation]);

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

  // 退出聚合选择
  const exitClusterSelection = useCallback(() => {
    // 保存当前选中的点位索引(如果有的话)
    const selectedIndex = selectedPointIndex;

    // 清除聚合选择状态
    setClusterListVisible(false);
    setClusterPoints([]);

    // 保持在列表标签页
    setActiveTab("list");

    // 如果有选中的点位，滚动到该点位
    if (selectedIndex && selectedIndex > 0) {
      // 使用setTimeout确保DOM更新后再滚动
      setTimeout(() => {
        setScrollIntoView(`point-${selectedIndex}`);
        setTimeout(() => {
          setScrollIntoView("");
        }, 300);
      }, 100);
    }
  }, [selectedPointIndex]);

  // 聚合点选择
  const selectClusterPoint = useCallback(
    (index: number, pointId: number) => {
      const point = clusterPoints[index];
      if (point) {
        setSelectedPoint(point);
        setSelectedPointIndex(point.index || null);

        // 滚动到聚合列表中的该项
        setScrollIntoClusterView(`cluster-point-${pointId}`);
        setTimeout(() => {
          setScrollIntoClusterView("");
        }, 300);

        onPointSelect?.(point);
      }
    },
    [clusterPoints, onPointSelect]
  );

  // 地图初始化完成
  const onMapInited = useCallback(() => {
    console.log("腾讯地图加载完成");
    const map = mapRef.current;

    // 调试地图API可用性
    console.log("地图API方法检查:", {
      setZoom: typeof map?.setZoom,
      setCenter: typeof map?.setCenter,
      getZoom: typeof map?.getZoom,
      getCenter: typeof map?.getCenter,
    });

    if (typeof window !== "undefined") {
      (window as any)["tencentMap"] = map;
    }

    // 地图初始化后强制更新容器宽度
    setTimeout(() => {
      if (containerRef.current) {
        const tabContent = containerRef.current.querySelector(
          ".tab-content"
        ) as HTMLElement;
        const mapContainer = containerRef.current.querySelector(
          ".map-container"
        ) as HTMLElement;

        if (tabContent) {
          tabContent.style.width = "100%";
          tabContent.offsetWidth; // 触发重排
        }

        if (mapContainer) {
          mapContainer.style.width = "100%";
          mapContainer.offsetWidth; // 触发重排
        }

        // 触发地图重绘
        if (map && map.triggerResize) {
          map.triggerResize();
        }
      }
    }, 100);

    onMapReady?.();
  }, [onMapReady]);

  // 阻止事件冒泡
  const preventBubble = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  // 阻止触摸移动
  const preventTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div ref={containerRef} className={`container ${className}`} style={style}>
      {/* 遮罩层，点击时折叠筛选器 */}
      {filterExpanded && hasFilters && (
        <div
          className={`mask ${filterExpanded ? "visible" : ""}`}
          onClick={toggleFilter}
          onTouchMove={preventTouchMove}
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
            {activeTab === "map" && (
              <div className="map-container" style={{ position: "relative" }}>
                <div className="square-container">
                  {/* 重置按钮 - 参考Map.tsx实现 */}
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
                      zoom: mapZoom,
                      minZoom: minScale,
                      maxZoom: maxScale,
                      baseMap: {
                        type: "vector",
                        features: ["base", "label", "point"],
                      },
                    }}
                    control={{
                      zoom: {
                        position: "topRight",
                        className: "tmap-zoom-control-box",
                        numVisible: true,
                      },
                    }}
                    onMapInited={onMapInited}
                    onRegionChange={regionChange}
                  >
                    <MultiMarker
                      ref={markerRef}
                      styles={markerStyles}
                      geometries={tencentMarkers}
                      onClick={markerTap}
                    />

                    {/* 聚类数量标签叠加层 */}
                    {tencentMarkers
                      .filter((marker) => marker.properties?.isCluster)
                      .map((marker) => (
                        <div
                          key={`cluster-label-${marker.id}`}
                          style={{
                            position: "absolute",
                            pointerEvents: "none",
                            color: "#FFFFFF",
                            fontSize: "11px",
                            fontWeight: "bold",
                            textAlign: "center",
                            zIndex: 1000,
                            // 这里需要根据地图投影转换坐标，暂时先这样处理
                            display: "none", // 临时隐藏，等待地图API支持
                          }}
                        >
                          {marker.properties?.pointCount}
                        </div>
                      ))}
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
            )}

            {activeTab === "list" && (
              <>
                {/* 聚合点列表 */}
                {clusterListVisible ? (
                  <div className="points-list cluster-list">
                    <div className="cluster-header">
                      <div className="cluster-title">
                        包含 {clusterPoints.length} 个位置
                      </div>
                      <button
                        className="cluster-exit-btn"
                        onClick={exitClusterSelection}
                      >
                        <span className="close-icon">×</span>
                        <span>返回</span>
                      </button>
                    </div>
                    <div
                      style={{
                        maxHeight: "400px",
                        overflowY: "auto" as const,
                      }}
                    >
                      {clusterPoints.map((point, index) => (
                        <div
                          key={`cluster-point-${point.index}`}
                          id={`cluster-point-${point.index}`}
                          className={`point-item cluster-item ${
                            selectedPointIndex === point.index ? "active" : ""
                          }`}
                          onClick={() =>
                            selectClusterPoint(index, point.index || 0)
                          }
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
                  /* 普通点位列表 */
                  <div className="points-list">
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
                              <span className="point-index">
                                {point.index}.
                              </span>{" "}
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
                )}
              </>
            )}
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
              {enableNavigation && (
                <div className="navigation-container">
                  <button
                    className="navigation-pill"
                    onClick={navigateToLocation}
                  >
                    <span className="navigation-icon">🧭</span>
                    <span>导航</span>
                  </button>
                </div>
              )}
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
