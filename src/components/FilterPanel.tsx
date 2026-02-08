import { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
}

export interface FilterState {
  contributionMin: string;
  contributionMax: string;
  groupType: 'all' | 'standard' | 'auction';
  openSpotsOnly: boolean;
  startingSoon: boolean;
  activeGroups: boolean;
  memberCount: 'any' | 'small' | 'medium' | 'large';
  sortBy: 'openSpots' | 'lowestContribution' | 'highestContribution' | 'newest';
}

const defaultFilters: FilterState = {
  contributionMin: '',
  contributionMax: '',
  groupType: 'all',
  openSpotsOnly: true,
  startingSoon: false,
  activeGroups: false,
  memberCount: 'any',
  sortBy: 'openSpots',
};

export function FilterPanel({ isOpen, onClose, onApply }: FilterPanelProps) {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  const handleClearAll = () => {
    setFilters(defaultFilters);
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Side Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-[#0f1419] border-l border-slate-800/50 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/50">
              <h2 className="text-xl font-semibold text-white">Filters</h2>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
              {/* Contribution Amount */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Contribution Amount (USDC)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.contributionMin}
                      onChange={(e) =>
                        setFilters({ ...filters, contributionMin: e.target.value })
                      }
                      className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.contributionMax}
                      onChange={(e) =>
                        setFilters({ ...filters, contributionMax: e.target.value })
                      }
                      className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Group Type */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Group Type
                </label>
                <div className="space-y-2.5">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="groupType"
                      checked={filters.groupType === 'all'}
                      onChange={() => setFilters({ ...filters, groupType: 'all' })}
                      className="w-4 h-4 text-emerald-500 bg-slate-900/50 border-slate-600 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                      All Types
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="groupType"
                      checked={filters.groupType === 'standard'}
                      onChange={() => setFilters({ ...filters, groupType: 'standard' })}
                      className="w-4 h-4 text-emerald-500 bg-slate-900/50 border-slate-600 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                      Standard Rotation
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="groupType"
                      checked={filters.groupType === 'auction'}
                      onChange={() => setFilters({ ...filters, groupType: 'auction' })}
                      className="w-4 h-4 text-emerald-500 bg-slate-900/50 border-slate-600 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                      Auction Based
                    </span>
                  </label>
                </div>
              </div>

              {/* Group Status */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Group Status
                </label>
                <div className="space-y-2.5">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={filters.openSpotsOnly}
                      onChange={(e) =>
                        setFilters({ ...filters, openSpotsOnly: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-slate-600 bg-slate-900/50 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                      Open Spots Only
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={filters.startingSoon}
                      onChange={(e) =>
                        setFilters({ ...filters, startingSoon: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-slate-600 bg-slate-900/50 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                      Starting Soon
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={filters.activeGroups}
                      onChange={(e) =>
                        setFilters({ ...filters, activeGroups: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-slate-600 bg-slate-900/50 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                      Active
                      <span className="text-xs text-slate-500 ml-1">(view-only)</span>
                    </span>
                  </label>
                </div>
              </div>

              {/* Member Count */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Member Count
                </label>
                <div className="space-y-2.5">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="memberCount"
                      checked={filters.memberCount === 'any'}
                      onChange={() => setFilters({ ...filters, memberCount: 'any' })}
                      className="w-4 h-4 text-emerald-500 bg-slate-900/50 border-slate-600 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                      Any
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="memberCount"
                      checked={filters.memberCount === 'small'}
                      onChange={() => setFilters({ ...filters, memberCount: 'small' })}
                      className="w-4 h-4 text-emerald-500 bg-slate-900/50 border-slate-600 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                      Small (3–7)
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="memberCount"
                      checked={filters.memberCount === 'medium'}
                      onChange={() => setFilters({ ...filters, memberCount: 'medium' })}
                      className="w-4 h-4 text-emerald-500 bg-slate-900/50 border-slate-600 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                      Medium (8–15)
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="memberCount"
                      checked={filters.memberCount === 'large'}
                      onChange={() => setFilters({ ...filters, memberCount: 'large' })}
                      className="w-4 h-4 text-emerald-500 bg-slate-900/50 border-slate-600 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                      Large (16+)
                    </span>
                  </label>
                </div>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      sortBy: e.target.value as FilterState['sortBy'],
                    })
                  }
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                >
                  <option value="openSpots">Most Open Spots</option>
                  <option value="lowestContribution">Lowest Contribution</option>
                  <option value="highestContribution">Highest Contribution</option>
                  <option value="newest">Newest Groups</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-5 border-t border-slate-800/50 flex items-center justify-between">
              <button
                onClick={handleClearAll}
                className="px-5 py-2.5 bg-slate-800/50 hover:bg-slate-800 text-slate-300 font-medium rounded-lg transition-colors text-sm"
              >
                Clear All
              </button>
              <button
                onClick={handleApply}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors shadow-lg shadow-emerald-500/20 text-sm"
              >
                Apply Filters
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
