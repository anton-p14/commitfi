
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { InteractiveBackground } from '../InteractiveBackground';



export function ConnectWallet() {
  // onConnect is unused now as App handles state changes via Wagmi hooks

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white relative overflow-hidden flex items-center justify-center">
      <InteractiveBackground />

      <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/20">
            <div className="w-10 h-10 border-4 border-white rounded-lg" />
          </div>
        </div>

        {/* App Name */}
        <h1 className="text-5xl font-bold mb-4">CommitFi</h1>

        {/* Tagline */}
        <p className="text-xl text-slate-400 mb-12">
          Commit once. Rules enforce forever.
        </p>

        {/* Description */}
        <p className="text-slate-300 mb-10 max-w-lg mx-auto leading-relaxed">
          A decentralized commitment-based savings and auction platform.
          Join trustless groups, lock in your commitments, and let smart contracts enforce the rules.
        </p>

        {/* Connect Button */}
        <div className="flex justify-center">
          <ConnectButton
            label="Connect Wallet"
            accountStatus="address"
            chainStatus="icon"
            showBalance={false}
          />
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 grid grid-cols-3 gap-8 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-400 mb-2">100%</div>
            <div className="text-sm text-slate-400">On-Chain</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-400 mb-2">Zero</div>
            <div className="text-sm text-slate-400">Trusted Parties</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-400 mb-2">Forever</div>
            <div className="text-sm text-slate-400">Enforceable</div>
          </div>
        </div>
      </div>
    </div>
  );
}