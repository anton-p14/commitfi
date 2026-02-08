import { useState } from 'react';
import { Bell, LogOut, Home } from 'lucide-react';
import type { Page } from '../App';

interface HeaderProps {
  walletAddress: string | null;
  onDisconnect: () => void;
  onNavigate: (page: Page) => void;
}

export function Header({ walletAddress, onDisconnect, onNavigate }: HeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/50 bg-[#0a0e1a]/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 group"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white rounded" />
            </div>
            <span className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
              CommitFi
            </span>
          </button>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full" />
            </button>

            {walletAddress && (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-white hover:border-slate-600 transition-colors"
                >
                  <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  {shortenAddress(walletAddress)}
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700/50 rounded-lg shadow-xl overflow-hidden">
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        onNavigate('dashboard');
                      }}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
                    >
                      <Home className="w-4 h-4" />
                      Dashboard
                    </button>
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        onDisconnect();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-slate-800 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Disconnect
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
