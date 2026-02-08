import { Users } from 'lucide-react';
import type { Page } from '../App';
import type { Group } from '../types';

interface JoinGroupCardProps {
  group: Group;
  onNavigate: (page: Page, groupId?: string) => void;
  onJoin?: () => void;
}

export function JoinGroupCard({ group, onNavigate, onJoin }: JoinGroupCardProps) {
  const memberProgress = (group.members.length / group.memberLimit) * 100;

  const handleJoin = () => {
    if (onJoin) {
      onJoin();
    } else {
      // Fallback or legacy behavior if needed (though we will provide onJoin)
      // Simulate joining
      alert(`Successfully joined ${group.name}!`);
      onNavigate('my-groups');
    }
  };

  return (
    <div className="group bg-gradient-to-br from-slate-900/40 to-slate-900/20 border border-slate-800/50 rounded-xl p-5 hover:border-slate-700/80 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300">
      <div className="flex items-center justify-between gap-6">
        {/* Left Section */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-lg text-white truncate">{group.name}</h3>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${group.type === 'AUCTION'
                ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                : 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                }`}
            >
              {group.type === 'STANDARD' ? 'Standard' : 'Auction'}
            </span>
          </div>
          <p className="text-sm text-slate-400">
            <span className="text-white font-medium">{group.contribution} USDC</span> / {group.frequency.toLowerCase()}
          </p>
        </div>

        {/* Center Section */}
        <div className="flex items-center gap-4">
          <div className="min-w-[140px]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Members
              </span>
              <span className="text-sm font-medium text-white">
                {group.members.length} / {group.memberLimit}
              </span>
            </div>
            <div className="w-full bg-slate-800/50 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${memberProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div>
          <button
            onClick={handleJoin}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors duration-200 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
          >
            Join
          </button>
        </div>
      </div>
    </div>
  );
}
