import React from 'react';
import { MapPoint } from '../types';
import './PointsList.css';

interface PointsListProps {
  points: MapPoint[];
  selectedPoint?: MapPoint | null;
  onPointSelect: (point: MapPoint) => void;
  onNavigate?: (point: MapPoint) => void;
}

export const PointsList: React.FC<PointsListProps> = ({
  points,
  selectedPoint,
  onPointSelect,
  onNavigate
}) => {
  return (
    <div className="points-list">
      <div className="points-scroll">
        {points.length > 0 ? (
          points.map((point, index) => (
            <div
              key={point.index || index}
              className={`point-item ${
                selectedPoint === point ? 'active' : ''
              }`}
              onClick={() => onPointSelect(point)}
            >
              <div className="point-name">
                <span className="point-index">{index + 1}.</span>
                {point.name}
              </div>
              
              <div className="point-address">
                {point.address}
              </div>
              
              {/* 显示标签 */}
              {point.tags && point.tags.length > 0 && (
                <div className="point-tags">
                  {point.tags.map((tag, tagIndex) => (
                    <span key={tagIndex} className="point-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              
              {onNavigate && (
                <button 
                  className="point-nav-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate(point);
                  }}
                >
                  导航
                </button>
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
  );
};

export default PointsList; 