import { useState } from 'react';
import { Users, Calendar, DollarSign, Clock, TrendingUp } from 'lucide-react';
import { BackgroundAnimation } from '../BackgroundAnimation';
import type { Page } from '../../App';
import { useGroups } from '../../hooks/useGroups';
import { useGroupActions } from '../../hooks/useGroupActions';
import { useAuction } from '../../hooks/useAuction';

interface GroupDetailProps {
  groupId: string | null;
  onNavigate: (page: Page) => void;
}

function formatTime(seconds: number) {
  if (seconds <= 0) return "Ended";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}h ${m}m ${s}s`;
}

export function GroupDetail({ groupId, onNavigate }: GroupDetailProps) {
  const [bidAmount, setBidAmount] = useState('');
  const allGroups = useGroups();
  const { lockGroup, placeBid, resolveRound, status: txStatus } = useGroupActions();

  const rawGroup = groupId ? allGroups.find(g => g.id === groupId) : null;
  const isAuctionType = rawGroup?.type === 'AUCTION';

  const auctionData = useAuction(groupId, isAuctionType);
  const { highestBid, highestBidder, timeLeft, status: auctionStatus } = auctionData;

  const handleBid = async () => {
    if (groupId && bidAmount) {
      await placeBid(groupId, bidAmount);
      setBidAmount('');
    }
  };

  const isPending = txStatus === 'approving' || txStatus === 'creating';

  if (!rawGroup) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center">
        <p className="text-slate-400">Loading or Group not found...</p>
      </div>
    );
  }

  const group = rawGroup;

  const isRecruiting = group.status === 'RECRUITING';
  const isActive = group.status === 'ACTIVE';
  const isAuction = group.type === 'AUCTION';

  const handleLock = () => {
    if (groupId) {
      lockGroup(groupId);
    }
  };

  const currentMembersCount = group.members.length;
  // Calculate completion if active (mock logic using address hashing strictly for consistent demo visualization if needed, OR just 0)
  // Since we have no blocks passed logic yet, we'll show actual data available.
  const completionPercentage = group.totalRounds && group.currentCycle
    ? Math.round((group.currentCycle / group.totalRounds) * 100)
    : 0;

  return (
    <div className="min-h-screen text-white relative">
      <BackgroundAnimation />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{group.name}</h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${group.status === 'ACTIVE'
                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                  : group.status === 'RECRUITING'
                    ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                    : 'bg-slate-500/10 text-slate-300 border border-slate-500/20'
                  }`}
              >
                {group.status}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${group.type === 'AUCTION'
                  ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                  : 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                  }`}
              >
                {group.type}
              </span>
            </div>
            <button
              onClick={() => onNavigate('my-groups')}
              className="text-sm text-slate-400 hover:text-slate-300 transition-colors"
            >
              ← Back to My Groups
            </button>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-5">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <DollarSign className="w-4 h-4" />
              <span className="text-xs">Contribution</span>
            </div>
            <div className="text-2xl font-bold">{group.contribution} USDC</div>
            <div className="text-xs text-slate-400 mt-1">{group.frequency}</div>
          </div>

          <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-5">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Users className="w-4 h-4" />
              <span className="text-xs">Members</span>
            </div>
            <div className="text-2xl font-bold">
              {currentMembersCount} / {group.memberLimit}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {group.memberLimit - currentMembersCount} spots left
            </div>
          </div>

          {isActive && (
            <>
              <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-5">
                <div className="flex items-center gap-2 text-slate-400 mb-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs">Current Round</span>
                </div>
                <div className="text-2xl font-bold">
                  {group.currentCycle || 1} / {group.totalRounds || group.memberLimit}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {completionPercentage}% complete
                </div>
              </div>

              <div
                onClick={() => auctionStatus === 'ENDED' && groupId && resolveRound(groupId)}
                className={`bg-slate-900/30 border border-slate-800/50 rounded-xl p-5 ${auctionStatus === 'ENDED' ? 'cursor-pointer hover:bg-slate-800/50 transition-colors' : ''}`}
              >
                <div className="flex items-center gap-2 text-slate-400 mb-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs">
                    {auctionStatus === 'LIVE' ? 'Time Remaining' : auctionStatus === 'ENDED' ? 'Action Required' : 'Next Action'}
                  </span>
                </div>
                <div className="text-lg font-bold">
                  {auctionStatus === 'LIVE' ? formatTime(timeLeft) : auctionStatus === 'ENDED' ? 'Finalize Round' : 'Waiting...'}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {auctionStatus === 'LIVE' ? 'Until round ends' : auctionStatus === 'ENDED' ? 'Click to payout & advance' : 'Check status'}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Recruiting State */}
        {isRecruiting && (
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-8 text-center mb-8">
            <Calendar className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Waiting for Members</h3>
            <p className="text-slate-400 mb-4">
              Group will lock once all {group.memberLimit} members join
            </p>
            <div className="text-sm text-slate-500 mb-6">
              {currentMembersCount} of {group.memberLimit} members joined
            </div>
            <button
              onClick={handleLock}
              className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors shadow-lg shadow-blue-500/20"
            >
              Lock Group (On-Chain)
            </button>
          </div>
        )}

        {/* Active State - Auction Panel */}
        {isActive && isAuction && (
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">
              {auctionStatus === 'ENDED' ? 'Auction Results' : 'Current Auction'}
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-slate-400 mb-2">
                  {auctionStatus === 'ENDED' ? 'Winning Bid' : 'Current Highest Bid'}
                </div>
                <div className="text-3xl font-bold text-purple-400 mb-4">
                  {highestBid} USDC
                </div>
                <div className="text-xs text-slate-400">
                  {highestBidder ? `Bidder: ${highestBidder.slice(0, 6)}...${highestBidder.slice(-4)}` : 'No bids yet'}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-400 mb-2">Place Your Bid</div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder="Enter bid amount"
                    disabled={isPending || auctionStatus !== 'LIVE'}
                    className="flex-1 bg-slate-900/50 border border-slate-700/50 rounded-lg px-4 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 disabled:opacity-50"
                  />
                  <button
                    onClick={handleBid}
                    disabled={isPending || auctionStatus !== 'LIVE'}
                    className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 shadow-lg shadow-purple-500/20">
                    {isPending ? 'Processing...' : auctionStatus === 'ENDED' ? 'Ended' : 'Bid'}
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-4 text-xs text-slate-400">
              Auction duration: {formatTime(auctionData.frequency)} per round
            </div>
          </div>
        )}

        {/* Members List */}
        <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Members</h3>
          <div className="space-y-2">
            {group.members.map((memberAddress, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-slate-900/30 border border-slate-800/30 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <span className="font-mono text-sm">{memberAddress}</span>
                </div>
                <div className="flex items-center gap-4">
                  {/*  Status logic requires more data from chain per member */}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
