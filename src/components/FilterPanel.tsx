import React from 'react';
import { FilterState } from '../types';
// CSS 导入 - 只在浏览器环境中导入
if (typeof window !== "undefined") {
  import("./FilterPanel.css").catch(() => {});
}

interface FilterPanelProps {
  filters: FilterState;
  filterState: { inclusive: FilterState; exclusive: FilterState };
  expanded: boolean;
  onToggle: () => void;
  onInclusiveFilterChange: (category: string, value: string) => void;
  onExclusiveFilterChange: (category: string, value: string) => void;
  onReset: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  filterState,
  expanded,
  onToggle,
  onInclusiveFilterChange,
  onExclusiveFilterChange,
  onReset
}) => {
  const hasFilters = Object.keys(filters).length > 0;
  
  if (!hasFilters) return null;

  return (
    <div className={`filter-panel ${expanded ? 'expanded' : ''}`}>
      <div className="filter-header" onClick={onToggle}>
        <span className="filter-title">筛选器</span>
        <span className="expand-icon">{expanded ? '▲' : '▼'}</span>
      </div>
      
      {expanded && (
        <div className="filter-container" onClick={(e) => e.stopPropagation()}>
          {/* Inclusive 筛选器 */}
          {Object.entries(filters).map(([category, values]) => (
            <div key={category} className="filter-category">
              <div className="filter-row">
                <span className="filter-category-title">{category}：</span>
                <div className="filter-list">
                  {Object.keys(values).map((value) => (
                    <button
                      key={value}
                      className={`filter-item inclusive ${
                        filterState.inclusive?.[category]?.[value] ? 'active' : ''
                      }`}
                      onClick={() => onInclusiveFilterChange(category, value)}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
          
          {/* 重置按钮 */}
          <div className="filter-reset">
            <button className="filter-reset-btn" onClick={onReset}>
              重置筛选
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel; 