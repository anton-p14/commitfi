
import { Plus, Search, Folder } from 'lucide-react';
import { InteractiveBackground } from '../InteractiveBackground';
import type { Page } from '../../App';



interface DashboardProps {
  onNavigate: (page: Page) => void;
}

import { useGroups } from '../../hooks/useGroups';

interface DashboardProps {
  onNavigate: (page: Page) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const groups = useGroups();

  const stats = {
    activeGroups: groups.filter(g => g.status === 'ACTIVE').length,
    totalLocked: groups
      .filter(g => g.status === 'ACTIVE' || g.status === 'LOCKED')
      .reduce((acc, g) => acc + (g.contribution * g.memberLimit), 0),
    totalMembers: groups.reduce((acc, g) => acc + g.members.length, 0)
  };

  const actions = [
    {
      icon: Plus,
      title: 'Create a Group',
      description: 'Start a new commitment circle',
      onClick: () => onNavigate('create-group'),
      gradient: 'from-emerald-500/10 to-emerald-600/5',
      borderColor: 'border-emerald-500/20',
      iconColor: 'text-emerald-400',
    },
    {
      icon: Search,
      title: 'Join a Group',
      description: 'Browse and join existing groups',
      onClick: () => onNavigate('join-group'),
      gradient: 'from-blue-500/10 to-blue-600/5',
      borderColor: 'border-blue-500/20',
      iconColor: 'text-blue-400',
    },
    {
      icon: Folder,
      title: 'My Groups',
      description: 'View your active commitments',
      onClick: () => onNavigate('my-groups'),
      gradient: 'from-purple-500/10 to-purple-600/5',
      borderColor: 'border-purple-500/20',
      iconColor: 'text-purple-400',
    },
  ];

  return (
    <div className="min-h-screen text-white relative">
      <InteractiveBackground />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        {/* Welcome Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-3">Welcome to CommitFi</h1>
          <p className="text-slate-400 text-lg">
            Choose an action to get started with your commitment journey
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {actions.map((action) => (
            <button
              key={action.title}
              onClick={action.onClick}
              className={`group bg-gradient-to-br ${action.gradient} border ${action.borderColor} rounded-2xl p-8 text-left hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10`}
            >
              <div className={`w-14 h-14 ${action.iconColor} bg-slate-900/50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <action.icon className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-semibold mb-2">{action.title}</h2>
              <p className="text-slate-400 text-sm">{action.description}</p>
            </button>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-16 grid grid-cols-3 gap-6">
          <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-white mb-1">{stats.activeGroups}</div>
            <div className="text-sm text-slate-400">Active Groups</div>
          </div>
          <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-white mb-1">${stats.totalLocked.toLocaleString()}</div>
            <div className="text-sm text-slate-400">Total Locked</div>
          </div>
          <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-white mb-1">{stats.totalMembers}</div>
            <div className="text-sm text-slate-400">Total Members</div>
          </div>
        </div>
      </div>
    </div>
  );
}