'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import GridLayout, { Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import { useDashboard } from '@/lib/dashboard/dashboard-context';
import { WidgetRenderer } from './widgets';
import { X, Settings, GripVertical } from 'lucide-react';

export function DashboardCanvas() {
  const { state, activeTab, updateLayout, removeWidget } = useDashboard();
  const [containerWidth, setContainerWidth] = useState(1200);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleLayoutChange = useCallback(
    (newLayout: Layout[]) => {
      updateLayout(newLayout.map((item) => ({
        i: item.i,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
        minW: item.minW,
        minH: item.minH,
        maxW: item.maxW,
        maxH: item.maxH,
      })));
    },
    [updateLayout]
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  if (!activeTab) return null;

  const layout = activeTab.layout.map((item) => ({
    ...item,
    static: !state.isEditMode,
  }));

  return (
    <div ref={containerRef} className="dashboard-grid-bg min-h-[600px] rounded-xl p-2">
      <GridLayout
        className="layout"
        layout={layout}
        cols={12}
        rowHeight={80}
        width={containerWidth}
        isDraggable={state.isEditMode}
        isResizable={state.isEditMode}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".widget-drag-handle"
        margin={[16, 16]}
        containerPadding={[0, 0]}
      >
        {activeTab.widgets.map((widget) => {
          const layoutItem = activeTab.layout.find((l) => l.i === widget.id);
          if (!layoutItem) return null;

          return (
            <div
              key={widget.id}
              className={`widget-card bg-white border border-gray-200 rounded-lg overflow-hidden ${
                state.isEditMode ? 'edit-mode cursor-move' : ''
              }`}
            >
              {state.isEditMode && (
                <div className="absolute top-0 left-0 right-0 h-8 bg-gray-50 border-b border-gray-200 flex items-center justify-between px-2 z-10">
                  <div className="widget-drag-handle cursor-grab flex items-center gap-1 text-gray-400 hover:text-gray-600">
                    <GripVertical className="w-4 h-4" />
                    <span className="text-xs font-medium">{widget.type}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        // TODO: Open config modal
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => removeWidget(widget.id)}
                      className="p-1 text-gray-400 hover:text-error rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              <div className={`p-4 h-full ${state.isEditMode ? 'pt-10' : ''}`}>
                <WidgetRenderer widget={widget} isEditMode={state.isEditMode} />
              </div>
            </div>
          );
        })}
      </GridLayout>
    </div>
  );
}
