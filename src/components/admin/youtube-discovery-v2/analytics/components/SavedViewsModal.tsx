/**
 * OrangeFlix Discovery V2 — Saved Analytics Views Modal
 * Allows administrators to name, save, manage, and load preset analytical filter views.
 */

import React, { useState } from 'react';
import { Bookmark, Sparkles, X, Check, Trash2, Globe, Clock, Film } from 'lucide-react';
import { toast } from 'sonner';
import { AnalyticsFilterState, SavedAnalyticsView } from '../types';

interface SavedViewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilters: AnalyticsFilterState;
  savedViews: SavedAnalyticsView[];
  onSaveView: (view: SavedAnalyticsView) => void;
  onDeleteView: (id: string) => void;
  onLoadView: (view: SavedAnalyticsView) => void;
}

export const SavedViewsModal: React.FC<SavedViewsModalProps> = ({
  isOpen,
  onClose,
  currentFilters,
  savedViews,
  onSaveView,
  onDeleteView,
  onLoadView,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please provide a name for this analytical view preset.');
      return;
    }

    const newView: SavedAnalyticsView = {
      id: `view-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: name.trim(),
      description: description.trim() || `Saved on ${new Date().toLocaleDateString()}`,
      filters: { ...currentFilters },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    onSaveView(newView);
    toast.success(`Saved view "${newView.name}" created successfully!`);
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Saved Analytics Views</h2>
              <p className="text-xs text-muted-foreground">Save or restore custom filter state combinations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Create New View Form */}
        <form onSubmit={handleSave} className="space-y-3 bg-secondary/30 border border-border/70 rounded-xl p-4">
          <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            Save Current Active Filters
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground">Preset Name</label>
            <input
              type="text"
              placeholder="e.g. East Africa Cinema, Low Quality Candidates..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground">Description (Optional)</label>
            <input
              type="text"
              placeholder="Brief explanation of this analytical scope..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Save Preset</span>
            </button>
          </div>
        </form>

        {/* Existing Saved Views List */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-foreground">Available Saved Views ({savedViews.length})</div>
          <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
            {savedViews.map((view) => (
              <div
                key={view.id}
                className="bg-secondary/40 border border-border/70 rounded-xl p-3 flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="font-bold text-foreground truncate">{view.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{view.description}</div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-1">
                    <span>Territories: {view.filters.territories.join(', ')}</span>
                    <span>•</span>
                    <span>Range: {view.filters.timeRange}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      onLoadView(view);
                      onClose();
                    }}
                    className="px-2.5 py-1 bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 border border-orange-500/30 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Load View
                  </button>
                  {!view.isDefault && (
                    <button
                      onClick={() => onDeleteView(view.id)}
                      className="p-1 text-muted-foreground hover:text-rose-400 rounded-lg transition-colors"
                      title="Delete saved view"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

