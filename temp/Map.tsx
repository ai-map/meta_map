import React, { useCallback, useEffect, useRef, useState } from "react";
import "./Map.css";
import PointList, { PointProps } from "./PointList";
import { MultiMarker, BaseMap, MultiPolygon } from "tlbs-map-react";
import { MapProp, PointProp } from "./MapData";

// 定义样式类型
type MarkerStyle = {
  width: number;
  height: number;
  anchor: { x: number; y: number };
  src?: string;
};

// 定义样式对象类型
type MarkerStyles = {
  [key: string]: MarkerStyle;
};

// 定义地点位置类型
type Location = {
  lng: number;
  lat: number;
};

// 定义标记类型
type Marker = {
  id: string;
  styleId: string;
  position: Location;
};

// 样式
const styles: MarkerStyles = {
  multiMarkerStyle1: {
    width: 20,
    height: 30,
    anchor: { x: 10, y: 30 },
  },
  multiMarkerStyle2: {
    width: 20,
    height: 30,
    anchor: { x: 10, y: 30 },
    src: "https://mapapi.qq.com/web/lbs/javascriptGL/demo/img/markerDefault.png",
  },
};

// 根据 MapProp 生成标记
const generateMarkers = (data: PointProp[]): Marker[] => {
  return data.map(
    (item, index): Marker => ({
      id: `marker-${index}`,
      styleId: "multiMarkerStyle2",
      position: { lat: item.center.lat, lng: item.center.lng },
    })
  );
};

// 处理标记点击的抽象函数
const handleActiveIndexChange = (
  geometryId: string,
  geometries: Marker[],
  setGeometries: React.Dispatch<React.SetStateAction<Marker[]>>,
  setCenter: React.Dispatch<React.SetStateAction<Location>>
) => {
  const newGeometries = geometries.map((geometry) => {
    if (geometry.id === geometryId) {
      setCenter(geometry.position);
      return { ...geometry, styleId: "multiMarkerStyle1" };
    }
    return { ...geometry, styleId: "multiMarkerStyle2" };
  });
  setGeometries(newGeometries);
};

const polygonStyles = {
  polygonStyle: {
    fillColor: "#FF99FF",
    fillOpacity: 0.5,
    strokeColor: "#FF33FF",
    strokeWeight: 2,
  },
};

const TencentMap: React.FC<{
  mapData: MapProp;
  onMarkerClick: (index: number | null) => void;
  activeCardIndex: number | null;
}> = ({ mapData, onMarkerClick, activeCardIndex }) => {
  const mapRef = useRef(null);
  const markerRef = useRef(null); // 点标记图层实例
  const polygonRef = useRef(null); // 多边形图层实例
  const [geometries, setGeometries] = useState<Marker[]>(
    generateMarkers(mapData.data)
  );
  const [center, setCenter] = useState<Location>(mapData.center);
  const [zoom] = useState<number>(mapData.zoom[0]);

  // 地图初始化完成事件处理器
  const onMapInited = useCallback(() => {
    console.log("🚀🚀🚀 地图加载完成, 打印图层实例", markerRef.current);
    const map = mapRef.current as any;
    (window as any)["map"] = map;
  }, []);

  // 图层点击事件处理器
  const clickHandler = useCallback(
    (event: any) => {
      const clickedMarkerId = event.geometry.id;
      const index = parseInt(clickedMarkerId.split("-")[1]);
      onMarkerClick(index);
    },
    [onMarkerClick]
  );

  // 返回原始缩放和中心
  const resetMap = () => {
    setCenter(mapData.center);
    (mapRef.current! as any).setZoom(mapData.zoom[0]);
  };

  // 用于存储上一次的 activeCardIndex
  const prevActiveCardIndex = useRef(activeCardIndex);

  useEffect(() => {
    if (activeCardIndex !== prevActiveCardIndex.current) {
      if (activeCardIndex !== null) {
        const markerId = `marker-${activeCardIndex}`;
        handleActiveIndexChange(markerId, geometries, setGeometries, setCenter);
      }
      prevActiveCardIndex.current = activeCardIndex;
    }
  }, [activeCardIndex, geometries, setGeometries, setCenter]);

  return (
    <div className="square-container">
      <button className="reset-button" onClick={resetMap}>
        <i className="fa-solid fa-undo"></i>
      </button>
      <BaseMap
        ref={mapRef}
        apiKey="T3ABZ-2VOLB-ZVTU2-NYO2E-C7K2O-RKBQJ"
        options={{
          center,
          viewMode: "2D",
          zoom,
          minZoom: mapData.zoom[1],
          maxZoom: mapData.zoom[2],
          baseMap: {
            type: "vector", //类型：失量底图
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
      >
        <MultiMarker
          ref={markerRef}
          styles={styles}
          geometries={geometries}
          onClick={clickHandler}
        />
        {/* 添加多边形图层 */}
        {!!mapData.polyline && (
          <MultiPolygon
            ref={polygonRef}
            styles={polygonStyles}
            geometries={[
              {
                id: "polygon",
                paths: mapData.polyline as any,
              },
            ]}
          />
        )}
      </BaseMap>
    </div>
  );
};

// 定义 Page 组件的 props 类型
interface PageProps {
  pageId: string;
  bannerImage: string;
  mapData: MapProp;
}

// Page 组件
const Page: React.FC<PageProps> = ({ pageId, bannerImage, mapData }) => {
  const [activeCardIndex, setActiveCardIndex] = useState<number | null>(null);

  const handleActiveIndexChange = (index: number | null) => {
    setActiveCardIndex(index);
  };

  const pointList: PointProps[] = mapData.data.map((item) => ({
    name: item.name,
    address: item.address,
    phone: item.phone,
    webName: item.webName,
    webLink: item.webLink,
    intro: item.intro,
    mapLink: item.mapLink,
  }));

  return (
    <div className="page">
      <div className="banner">
        <a href="/">
          <i className="fa-solid fa-angle-left back-arrow"></i>
        </a>
        <h1 className="banner-text">{mapData.name}</h1>
      </div>
      <TencentMap
        mapData={mapData}
        onMarkerClick={handleActiveIndexChange}
        activeCardIndex={activeCardIndex}
      />
      <PointList
        pointList={pointList}
        onCardExpand={handleActiveIndexChange}
        activeCardIndex={activeCardIndex}
      />
    </div>
  );
};

// 导出 Map 组件
const MapPage: React.FC<{ mapData: MapProp }> = ({ mapData }) => {
  const pageId = "page1";
  const bannerImage =
    "https://p3.itc.cn/images01/20220119/1761616bf1724ad88949d1d28759641d.jpeg";

  return (
    <div className="Map">
      <Page pageId={pageId} bannerImage={bannerImage} mapData={mapData} />
    </div>
  );
};

export default MapPage;
