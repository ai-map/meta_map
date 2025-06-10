import React from 'react';
import { MapPoint } from '../types';
// CSS 导入 - 只在浏览器环境中导入
if (typeof window !== "undefined") {
  import("./PointDetail.css").catch(() => {});
}

interface PointDetailProps {
  point: MapPoint | null;
  onClose?: () => void;
  onCopyText?: (text: string) => void;
  onNavigate?: () => void;
  enableNavigation?: boolean;
}

export const PointDetail: React.FC<PointDetailProps> = ({
  point,
  onClose,
  onCopyText,
  onNavigate,
  enableNavigation = true
}) => {
  if (!point) {
    return (
      <div className="point-detail">
        <div className="empty-detail">
          <span>请选择一个点位查看详情</span>
        </div>
      </div>
    );
  }

  const handleCopyClick = (text: string) => {
    if (onCopyText) {
      onCopyText(text);
    } else {
      navigator.clipboard?.writeText(text).then(() => {
        console.log('已复制到剪贴板:', text);
      }).catch(err => {
        console.error('复制失败:', err);
      });
    }
  };

  const handleNavigate = () => {
    if (onNavigate) {
      onNavigate();
    } else {
      const url = `https://maps.google.com/?q=${point.latitude},${point.longitude}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="point-detail">
      <div className="detail-container">
        <div className="detail-header">
          <h3 className="detail-title">{point.name}</h3>
          {onClose && (
            <button className="detail-close-btn" onClick={onClose}>
              ×
            </button>
          )}
        </div>
        
        <div className="detail-content">
          {point.address && (
            <div className="detail-item">
              <span className="detail-icon">📍</span>
              <span 
                className="detail-text clickable" 
                onClick={() => handleCopyClick(point.address!)}
                title="点击复制地址"
              >
                {point.address}
              </span>
            </div>
          )}
          
          {point.phone && (
            <div className="detail-item">
              <span className="detail-icon">📞</span>
              <span 
                className="detail-text clickable" 
                onClick={() => handleCopyClick(point.phone!)}
                title="点击复制电话"
              >
                {point.phone}
              </span>
            </div>
          )}
          
          {point.webName && (
            <div className="detail-item">
              <span className="detail-icon">🔗</span>
              <span 
                className="detail-text clickable" 
                onClick={() => handleCopyClick(point.webName!)}
                title="点击复制链接"
              >
                {point.webName}
              </span>
            </div>
          )}
          
          {point.tags && point.tags.length > 0 && (
            <div className="detail-tags">
              {point.tags.map((tag, index) => (
                <span key={index} className="detail-tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          {point.intro && (
            <div className="detail-intro">
              <p>{point.intro}</p>
            </div>
          )}
          
          {enableNavigation && (
            <div className="navigation-container">
              <button className="navigation-btn" onClick={handleNavigate}>
                <span className="nav-icon">🧭</span>
                <span>导航</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PointDetail; 