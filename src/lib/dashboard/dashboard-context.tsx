'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { DashboardTab, LayoutItem, WidgetConfig, WidgetType } from '@/types/dashboard';
import { DEFAULT_TABS } from './default-layouts';
import { WIDGET_REGISTRY } from './widget-registry';
import { v4 as uuidv4 } from 'uuid';

interface DashboardState {
  tabs: DashboardTab[];
  activeTabId: string;
  isEditMode: boolean;
  isDirty: boolean;
  isLoading: boolean;
}

type DashboardAction =
  | { type: 'SET_TABS'; payload: DashboardTab[] }
  | { type: 'SET_ACTIVE_TAB'; payload: string }
  | { type: 'TOGGLE_EDIT_MODE' }
  | { type: 'SET_EDIT_MODE'; payload: boolean }
  | { type: 'UPDATE_LAYOUT'; payload: { tabId: string; layout: LayoutItem[] } }
  | { type: 'ADD_WIDGET'; payload: { tabId: string; widget: WidgetConfig; layoutItem: LayoutItem } }
  | { type: 'REMOVE_WIDGET'; payload: { tabId: string; widgetId: string } }
  | { type: 'UPDATE_WIDGET_CONFIG'; payload: { tabId: string; widgetId: string; config: Record<string, unknown> } }
  | { type: 'ADD_TAB'; payload: DashboardTab }
  | { type: 'REMOVE_TAB'; payload: string }
  | { type: 'RENAME_TAB'; payload: { tabId: string; name: string } }
  | { type: 'RESET_TO_DEFAULT' }
  | { type: 'SET_DIRTY'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean };

function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case 'SET_TABS':
      return { ...state, tabs: action.payload, isLoading: false };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTabId: action.payload };
    case 'TOGGLE_EDIT_MODE':
      return { ...state, isEditMode: !state.isEditMode };
    case 'SET_EDIT_MODE':
      return { ...state, isEditMode: action.payload };
    case 'UPDATE_LAYOUT':
      return {
        ...state,
        isDirty: true,
        tabs: state.tabs.map((tab) =>
          tab.id === action.payload.tabId ? { ...tab, layout: action.payload.layout } : tab
        ),
      };
    case 'ADD_WIDGET':
      return {
        ...state,
        isDirty: true,
        tabs: state.tabs.map((tab) =>
          tab.id === action.payload.tabId
            ? {
                ...tab,
                layout: [...tab.layout, action.payload.layoutItem],
                widgets: [...tab.widgets, action.payload.widget],
              }
            : tab
        ),
      };
    case 'REMOVE_WIDGET':
      return {
        ...state,
        isDirty: true,
        tabs: state.tabs.map((tab) =>
          tab.id === action.payload.tabId
            ? {
                ...tab,
                layout: tab.layout.filter((item) => item.i !== action.payload.widgetId),
                widgets: tab.widgets.filter((w) => w.id !== action.payload.widgetId),
              }
            : tab
        ),
      };
    case 'UPDATE_WIDGET_CONFIG':
      return {
        ...state,
        isDirty: true,
        tabs: state.tabs.map((tab) =>
          tab.id === action.payload.tabId
            ? {
                ...tab,
                widgets: tab.widgets.map((w) =>
                  w.id === action.payload.widgetId ? { ...w, config: { ...w.config, ...action.payload.config } } : w
                ),
              }
            : tab
        ),
      };
    case 'ADD_TAB':
      return { ...state, isDirty: true, tabs: [...state.tabs, action.payload], activeTabId: action.payload.id };
    case 'REMOVE_TAB':
      const remaining = state.tabs.filter((tab) => tab.id !== action.payload);
      return { ...state, isDirty: true, tabs: remaining, activeTabId: remaining[0]?.id || '' };
    case 'RENAME_TAB':
      return {
        ...state,
        isDirty: true,
        tabs: state.tabs.map((tab) =>
          tab.id === action.payload.tabId
            ? { ...tab, name: action.payload.name, slug: action.payload.name.toLowerCase().replace(/\s+/g, '-') }
            : tab
        ),
      };
    case 'RESET_TO_DEFAULT':
      return { ...state, tabs: DEFAULT_TABS, activeTabId: DEFAULT_TABS[0].id, isDirty: true, isEditMode: false };
    case 'SET_DIRTY':
      return { ...state, isDirty: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

const initialState: DashboardState = {
  tabs: DEFAULT_TABS,
  activeTabId: DEFAULT_TABS[0].id,
  isEditMode: false,
  isDirty: false,
  isLoading: true,
};

interface DashboardContextValue {
  state: DashboardState;
  activeTab: DashboardTab | undefined;
  setActiveTab: (tabId: string) => void;
  toggleEditMode: () => void;
  setEditMode: (isEdit: boolean) => void;
  updateLayout: (layout: LayoutItem[]) => void;
  addWidget: (type: WidgetType) => void;
  removeWidget: (widgetId: string) => void;
  updateWidgetConfig: (widgetId: string, config: Record<string, unknown>) => void;
  addTab: (name: string) => void;
  removeTab: (tabId: string) => void;
  renameTab: (tabId: string, name: string) => void;
  resetToDefault: () => void;
  saveLayout: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);
  const activeTab = state.tabs.find((tab) => tab.id === state.activeTabId);

  useEffect(() => {
    const saved = localStorage.getItem('scoutzos-dashboard-layouts');
    if (saved) {
      try {
        dispatch({ type: 'SET_TABS', payload: JSON.parse(saved) });
      } catch {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  useEffect(() => {
    if (state.isDirty && !state.isLoading) {
      localStorage.setItem('scoutzos-dashboard-layouts', JSON.stringify(state.tabs));
    }
  }, [state.tabs, state.isDirty, state.isLoading]);

  const setActiveTab = useCallback((tabId: string) => dispatch({ type: 'SET_ACTIVE_TAB', payload: tabId }), []);
  const toggleEditMode = useCallback(() => dispatch({ type: 'TOGGLE_EDIT_MODE' }), []);
  const setEditMode = useCallback((isEdit: boolean) => dispatch({ type: 'SET_EDIT_MODE', payload: isEdit }), []);

  const updateLayout = useCallback(
    (layout: LayoutItem[]) => {
      if (activeTab) dispatch({ type: 'UPDATE_LAYOUT', payload: { tabId: activeTab.id, layout } });
    },
    [activeTab]
  );

  const addWidget = useCallback(
    (type: WidgetType) => {
      if (!activeTab) return;
      const def = WIDGET_REGISTRY[type];
      const widgetId = `${type}-${uuidv4().slice(0, 8)}`;
      const maxY = activeTab.layout.reduce((max, item) => Math.max(max, item.y + item.h), 0);
      const layoutItem: LayoutItem = {
        i: widgetId,
        x: 0,
        y: maxY,
        w: def.defaultSize.w,
        h: def.defaultSize.h,
        minW: def.minSize.w,
        minH: def.minSize.h,
        maxW: def.maxSize?.w,
        maxH: def.maxSize?.h,
      };
      const widget: WidgetConfig = {
        id: widgetId,
        type,
        config: def.configFields?.reduce((acc, f) => ({ ...acc, [f.key]: f.default }), {}) || {},
      };
      dispatch({ type: 'ADD_WIDGET', payload: { tabId: activeTab.id, widget, layoutItem } });
    },
    [activeTab]
  );

  const removeWidget = useCallback(
    (widgetId: string) => {
      if (activeTab) dispatch({ type: 'REMOVE_WIDGET', payload: { tabId: activeTab.id, widgetId } });
    },
    [activeTab]
  );

  const updateWidgetConfig = useCallback(
    (widgetId: string, config: Record<string, unknown>) => {
      if (activeTab) dispatch({ type: 'UPDATE_WIDGET_CONFIG', payload: { tabId: activeTab.id, widgetId, config } });
    },
    [activeTab]
  );

  const addTab = useCallback((name: string) => {
    const newTab: DashboardTab = {
      id: uuidv4(),
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      isDefault: false,
      layout: [],
      widgets: [],
    };
    dispatch({ type: 'ADD_TAB', payload: newTab });
  }, []);

  const removeTab = useCallback(
    (tabId: string) => {
      if (state.tabs.length > 1) dispatch({ type: 'REMOVE_TAB', payload: tabId });
    },
    [state.tabs.length]
  );

  const renameTab = useCallback(
    (tabId: string, name: string) => dispatch({ type: 'RENAME_TAB', payload: { tabId, name } }),
    []
  );

  const resetToDefault = useCallback(() => dispatch({ type: 'RESET_TO_DEFAULT' }), []);

  const saveLayout = useCallback(async () => {
    localStorage.setItem('scoutzos-dashboard-layouts', JSON.stringify(state.tabs));
    dispatch({ type: 'SET_DIRTY', payload: false });
  }, [state.tabs]);

  return (
    <DashboardContext.Provider
      value={{
        state,
        activeTab,
        setActiveTab,
        toggleEditMode,
        setEditMode,
        updateLayout,
        addWidget,
        removeWidget,
        updateWidgetConfig,
        addTab,
        removeTab,
        renameTab,
        resetToDefault,
        saveLayout,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used within DashboardProvider');
  return ctx;
}
