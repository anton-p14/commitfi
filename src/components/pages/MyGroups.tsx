import { Search } from 'lucide-react';
import { InteractiveBackground } from '../InteractiveBackground';
import { MyGroupCard } from '../MyGroupCard';
import type { Page } from '../../App';
import { useGroups } from '../../hooks/useGroups';

interface MyGroupsProps {
  onNavigate: (page: Page) => void;
  walletAddress: string | null;
}

export function MyGroups({ onNavigate, walletAddress }: MyGroupsProps) {
  const allGroups = useGroups();
  const userGroups = walletAddress
    ? allGroups.filter(g => g.members.includes(walletAddress))
    : [];

  const ongoingGroups = userGroups.filter(g => g.status === 'ACTIVE');
  const upcomingGroups = userGroups.filter(g => g.status === 'RECRUITING' || g.status === 'LOCKED');
  const completedGroups = userGroups.filter(g => g.status === 'COMPLETED');

  return (
    <div className="min-h-screen text-white relative">
      <InteractiveBackground />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-8">My Groups</h1>

        {userGroups.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/30 border border-slate-800/50 rounded-2xl">
            <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Active Commitments</h3>
            <p className="text-slate-400 mb-6">You haven't joined any groups yet.</p>
            <button
              onClick={() => onNavigate('join-group')}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors"
            >
              Browse Groups
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            {ongoingGroups.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Active Commitments
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {ongoingGroups.map((group) => (
                    <MyGroupCard
                      key={group.id}
                      group={group}
                      onNavigate={onNavigate}
                    />
                  ))}
                </div>
              </section>
            )}

            {upcomingGroups.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Starting Soon
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {upcomingGroups.map((group) => (
                    <MyGroupCard
                      key={group.id}
                      group={group}
                      onNavigate={onNavigate}
                    />
                  ))}
                </div>
              </section>
            )}

            {completedGroups.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                  Completed
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {completedGroups.map((group) => (
                    <MyGroupCard
                      key={group.id}
                      group={group}
                      onNavigate={onNavigate}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
