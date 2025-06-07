import React from 'react';
import MapViewer from './components/MapViewer';
import { StandardMapData } from './types';
import './App.css';

// 测试数据
const sampleData: StandardMapData = {
  name: "示例地图 - 宽度控制测试",
  center: { lat: 39.9042, lng: 116.4074 },
  zoom: [10, 3, 18],
  data: [
    {
      name: "北京天安门",
      center: { lat: 39.9042, lng: 116.4074 },
      address: "北京市东城区东长安街",
      phone: "010-85007063",
      webName: "中国北京天安门",
      intro: "中华人民共和国的象征，位于北京市中心。",
      tags: ["北京", "2024-12", "景点"]
    },
    {
      name: "上海外滩",
      center: { lat: 31.2304, lng: 121.4737 },
      address: "上海市黄浦区中山东一路",
      phone: "021-63239999",
      webName: "上海外滩风景区",
      intro: "上海最著名的景点之一，万国建筑博览群。",
      tags: ["上海", "2024-11", "景点"]
    },
    {
      name: "深圳腾讯大厦",
      center: { lat: 22.5431, lng: 114.0579 },
      address: "深圳市南山区科技园中一路腾讯大厦",
      phone: "0755-86013388",
      webName: "腾讯公司总部",
      intro: "腾讯公司全球总部大楼，现代化办公建筑。",
      tags: ["深圳", "2024-10", "科技", "自助"]
    },
    {
      name: "广州塔",
      center: { lat: 23.1089, lng: 113.3187 },
      address: "广州市海珠区阅江西路222号",
      phone: "020-89338222",
      webName: "广州塔观光旅游",
      intro: "广州新地标，中国第二高塔，集观光娱乐于一体。",
      tags: ["广州", "2024-09", "景点"]
    },
    {
      name: "杭州西湖",
      center: { lat: 30.2741, lng: 120.1551 },
      address: "浙江省杭州市西湖区龙井路1号",
      phone: "0571-87179617",
      webName: "杭州西湖风景名胜区",
      intro: "中国著名的淡水湖，世界文化遗产，人间天堂。",
      tags: ["杭州", "2024-08", "景点", "自助"]
    },
    {
      name: "成都宽窄巷子",
      center: { lat: 30.6598, lng: 104.0633 },
      address: "四川省成都市青羊区同仁路以东长顺街以西",
      phone: "028-86259233",
      webName: "成都宽窄巷子历史文化区",
      intro: "成都三大历史文化保护区之一，体验老成都生活。",
      tags: ["成都", "2024-07", "文化", "自助"]
    },
    {
      name: "西安大雁塔",
      center: { lat: 34.2200, lng: 108.9647 },
      address: "陕西省西安市雁塔区雁塔路",
      phone: "029-85518039",
      webName: "大雁塔文化休闲景区",
      intro: "唐代佛教文化遗迹，古城西安的象征之一。",
      tags: ["西安", "2024-06", "文化"]
    }
  ]
};

const App: React.FC = () => {
  return (
    <div className="app">
      {/* 测试不同容器尺寸 */}
      
      {/* 全屏容器测试 */}
      <div className="test-section">
        <h2>全屏容器测试 (100vw x 100vh)</h2>
        <div className="container-fullscreen">
          <MapViewer
            mapData={sampleData}
            defaultView="map"
            enableNavigation={true}
            onPointSelect={(point) => console.log('选中点位:', point?.name)}
          />
        </div>
      </div>
      
      {/* 固定尺寸容器测试 */}
      <div className="test-section">
        <h2>固定尺寸容器测试 (800px x 600px)</h2>
        <div className="container-fixed">
          <MapViewer
            mapData={sampleData}
            defaultView="list"
            enableNavigation={true}
            onPointSelect={(point) => console.log('选中点位:', point?.name)}
          />
        </div>
      </div>
      
      {/* 移动端模拟容器测试 */}
      <div className="test-section">
        <h2>移动端模拟容器测试 (375px x 667px)</h2>
        <div className="container-mobile">
          <MapViewer
            mapData={sampleData}
            defaultView="map"
            enableNavigation={true}
            onPointSelect={(point) => console.log('选中点位:', point?.name)}
          />
        </div>
      </div>
      
      {/* 响应式容器测试 */}
      <div className="test-section">
        <h2>响应式容器测试 (100% x 500px, max-width: 1200px)</h2>
        <div className="container-responsive">
          <MapViewer
            mapData={sampleData}
            defaultView="map"
            enableNavigation={true}
            onPointSelect={(point) => console.log('选中点位:', point?.name)}
          />
        </div>
      </div>
    </div>
  );
};

export default App; 