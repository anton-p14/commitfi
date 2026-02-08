import { useState } from "react";
import { Search, Filter, ArrowUpDown, Wallet } from 'lucide-react';
import { JoinGroupCard } from '../JoinGroupCard';
import { FilterPanel, FilterState } from '../FilterPanel';
import { useGroups } from '../../hooks/useGroups';
import { useGroupActions } from '../../hooks/useGroupActions';
import { useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { CONTRACT_ADDRESSES } from '../../contracts/addresses';
import USDCABI from '../../contracts/abis/USDC.json';
import type { Page } from '../../App';

interface JoinGroupProps {
  onNavigate: (page: Page, groupId?: string) => void;
  walletAddress: string | null;
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

export function JoinGroup({ onNavigate, walletAddress }: JoinGroupProps) {
  const allGroups = useGroups();
  const { joinGroup, status, error } = useGroupActions();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Store applied filters
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(defaultFilters);

  const filteredGroups = allGroups.filter((group) => {
    // 1. Search Query
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      group.name.toLowerCase().includes(query) ||
      group.id.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    // 2. Filters
    const f = appliedFilters;

    // Type Filter
    if (f.groupType !== "all") {
      if (f.groupType === "standard" && group.type !== "STANDARD") return false;
      if (f.groupType === "auction" && group.type !== "AUCTION") return false;
    }

    // Status Filter (Complex mapping from UI options to GroupStatus)
    // "Open Spots Only" -> Status must be RECRUITING (or ACTIVE/LOCKED if logic permits joining, but usually RECRUITING)
    if (f.openSpotsOnly && group.status !== 'RECRUITING') return false;

    // "Active Groups" -> Status ACTIVE
    if (f.activeGroups && group.status !== 'ACTIVE') return false;

    // "Starting Soon" -> RECRUITING/LOCKED logic (simplified for now)

    // Contribution Range
    const min = f.contributionMin ? Number(f.contributionMin) : 0;
    const max = f.contributionMax ? Number(f.contributionMax) : Infinity;
    if (group.contribution < min || group.contribution > max) return false;

    return true;
  });

  const handleJoin = (groupId: string, groupType: any) => {
    if (!walletAddress) {
      alert("Please connect your wallet");
      return;
    }
    joinGroup(groupId, groupType);
    onNavigate('my-groups');
  };

  // Fetch Balance for Debugging/UX
  const result = useReadContract({
    address: CONTRACT_ADDRESSES.USDC as `0x${string}`,
    abi: USDCABI,
    functionName: 'balanceOf',
    args: [walletAddress || '0x0000000000000000000000000000000000000000'],
  });

  const balance = result.data ? formatUnits(result.data as bigint, 6) : '0';

  return (
    <div className="min-h-screen text-white relative">
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold mb-2">Join a Group</h1>
            <p className="text-slate-400">Find and join active commitment circles</p>
            {walletAddress && (
              <div className="flex items-center gap-2 mt-2 text-emerald-400 text-sm bg-emerald-500/10 px-3 py-1 rounded-full w-fit">
                <Wallet className="w-4 h-4" />
                <span>Balance: {balance} USDC</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="Search groups..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-3 rounded-xl border transition-colors ${showFilters
                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
            >
              <Filter className="w-5 h-5" />
            </button>
            <button className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl text-slate-400 hover:border-slate-700 transition-colors">
              <ArrowUpDown className="w-5 h-5" />
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mb-8">
            <FilterPanel
              isOpen={showFilters}
              onClose={() => setShowFilters(false)}
              onApply={(newFilters) => setAppliedFilters(newFilters)}
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredGroups.length > 0 ? (
            filteredGroups.map((group) => (
              <JoinGroupCard
                key={group.id}
                group={group}
                onJoin={() => handleJoin(group.id, group.type)}
                onNavigate={onNavigate}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-20 text-slate-500">
              No groups found matching your criteria
            </div>
          )}
        </div>

        {/* Status Overlay */}
        {(status !== 'idle' && status !== 'success' && status !== 'error') && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
            <div className="bg-slate-900 rounded-xl p-8 border border-slate-700 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-white font-semibold">
                {status === 'checking_allowance' && 'Checking Allowance...'}
                {status === 'approving' && 'Approve USDC...'}
                {status === 'confirming_approval' && 'Waiting for Approval...'}
                {status === 'joining' && 'Joining Group...'}
                {status === 'confirming_creation' && 'Confirming on Chain...'}
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="fixed bottom-4 right-4 bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg backdrop-blur-md z-50">
            <p className="font-semibold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

      </div>
    </div>
  );
}