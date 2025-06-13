// 外部库类型声明
declare module 'tlbs-map-react' {
  import { Component } from 'react';

  export interface TMapProps {
    apiKey: string;
    options: any;
    control?: any;
    onMapInited?: () => void;
    children?: React.ReactNode;
  }

  export interface MultiMarkerProps {
    styles: any;
    geometries: any[];
    onClick?: (event: any) => void;
  }

  export interface MultiLabelProps {
    styles: any;
    geometries: any[];
    onClick?: (event: any) => void;
  }

  export class TMap extends Component<TMapProps> {}
  export class MultiMarker extends Component<MultiMarkerProps> {}
  export class MultiLabel extends Component<MultiLabelProps> {}
}

declare module 'react-leaflet' {
  // 基本的 react-leaflet 类型声明
  export const MapContainer: any;
  export const TileLayer: any;
  export const Marker: any;
  export const Popup: any;
} 