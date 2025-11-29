'use client';

import { useState } from 'react';
import { useDashboard } from '@/lib/dashboard/dashboard-context';
import { Plus, X, Pencil, Check } from 'lucide-react';

export function DashboardTabs() {
  const { state, setActiveTab, addTab, removeTab, renameTab } = useDashboard();
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [showNewTabInput, setShowNewTabInput] = useState(false);
  const [newTabName, setNewTabName] = useState('');

  const handleStartRename = (tabId: string, currentName: string) => {
    setEditingTabId(tabId);
    setEditingName(currentName);
  };

  const handleFinishRename = () => {
    if (editingTabId && editingName.trim()) {
      renameTab(editingTabId, editingName.trim());
    }
    setEditingTabId(null);
    setEditingName('');
  };

  const handleAddTab = () => {
    if (newTabName.trim()) {
      addTab(newTabName.trim());
      setNewTabName('');
      setShowNewTabInput(false);
    }
  };

  return (
    <div className="flex items-center gap-1 mb-4 border-b border-gray-200">
      {state.tabs.map((tab) => (
        <div
          key={tab.id}
          className={`group relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            tab.id === state.activeTabId
              ? 'bg-white text-gray-900 border border-gray-200 border-b-white -mb-px'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          {editingTabId === tab.id ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFinishRename()}
                onBlur={handleFinishRename}
                className="w-24 px-1 py-0.5 text-sm border border-gray-300 rounded"
                autoFocus
              />
              <button onClick={handleFinishRename} className="p-0.5 text-brand-ai">
                <Check className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <>
              <button onClick={() => setActiveTab(tab.id)} className="flex-1">
                {tab.name}
              </button>
              {state.isEditMode && (
                <div className="hidden group-hover:flex items-center gap-0.5">
                  <button
                    onClick={() => handleStartRename(tab.id, tab.name)}
                    className="p-0.5 text-gray-400 hover:text-gray-600"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  {state.tabs.length > 1 && (
                    <button
                      onClick={() => removeTab(tab.id)}
                      className="p-0.5 text-gray-400 hover:text-error"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      ))}

      {state.isEditMode && (
        <>
          {showNewTabInput ? (
            <div className="flex items-center gap-1 px-2">
              <input
                type="text"
                value={newTabName}
                onChange={(e) => setNewTabName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTab()}
                placeholder="Tab name"
                className="w-24 px-2 py-1 text-sm border border-gray-300 rounded"
                autoFocus
              />
              <button onClick={handleAddTab} className="p-1 text-brand-ai hover:text-brand-ai-strong">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={() => setShowNewTabInput(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowNewTabInput(true)}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              <Plus className="w-4 h-4" />
              Add Tab
            </button>
          )}
        </>
      )}
    </div>
  );
}
