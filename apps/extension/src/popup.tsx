import { useState, useEffect } from "react";
import "./style.css";

/**
 * XFERNO Extension Popup
 *
 * Main popup UI shown when clicking the extension icon
 */
function Popup() {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("0");

  useEffect(() => {
    // Check connection status on load
    checkConnection();
  }, []);

  const checkConnection = async () => {
    // TODO: Implement wallet connection check
    // This will integrate with the background service worker
  };

  const handleConnect = async () => {
    // TODO: Implement wallet connection
    setIsConnected(true);
    setAddress("0x1234...5678");
  };

  const handleDisconnect = async () => {
    setIsConnected(false);
    setAddress(null);
    setBalance("0");
  };

  return (
    <div className="w-[360px] min-h-[480px] bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      {/* Header */}
      <header className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
              <span className="text-lg font-bold">X</span>
            </div>
            <span className="font-bold text-lg">XFERNO</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400">v0.1.0</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4">
        {!isConnected ? (
          <ConnectWallet onConnect={handleConnect} />
        ) : (
          <Dashboard
            address={address!}
            balance={balance}
            onDisconnect={handleDisconnect}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
        <div className="flex justify-center space-x-4 text-xs text-gray-400">
          <a
            href="https://xferno.io"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            Website
          </a>
          <a
            href="https://docs.xferno.io"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            Docs
          </a>
          <a
            href="https://twitter.com/xferno_io"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            Twitter
          </a>
        </div>
      </footer>
    </div>
  );
}

interface ConnectWalletProps {
  onConnect: () => void;
}

function ConnectWallet({ onConnect }: ConnectWalletProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mb-6">
        <span className="text-4xl">🔥</span>
      </div>
      <h2 className="text-xl font-bold mb-2">Welcome to XFERNO</h2>
      <p className="text-gray-400 text-sm text-center mb-6">
        Connect your wallet to access the multi-chain launchpad
      </p>
      <button
        onClick={onConnect}
        className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg font-semibold hover:opacity-90 transition-opacity"
      >
        Connect Wallet
      </button>
    </div>
  );
}

interface DashboardProps {
  address: string;
  balance: string;
  onDisconnect: () => void;
}

function Dashboard({ address, balance, onDisconnect }: DashboardProps) {
  return (
    <div className="space-y-4">
      {/* Wallet Info */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400 text-sm">Connected Wallet</span>
          <button
            onClick={onDisconnect}
            className="text-xs text-red-400 hover:text-red-300"
          >
            Disconnect
          </button>
        </div>
        <div className="font-mono text-sm">{address}</div>
      </div>

      {/* Balance */}
      <div className="bg-gray-800 rounded-lg p-4">
        <span className="text-gray-400 text-sm">Balance</span>
        <div className="text-2xl font-bold">{balance} ETH</div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button className="py-3 bg-gray-800 rounded-lg font-semibold hover:bg-gray-700 transition-colors">
          🚀 Launch
        </button>
        <button className="py-3 bg-gray-800 rounded-lg font-semibold hover:bg-gray-700 transition-colors">
          💱 Trade
        </button>
        <button className="py-3 bg-gray-800 rounded-lg font-semibold hover:bg-gray-700 transition-colors">
          📊 Portfolio
        </button>
        <button className="py-3 bg-gray-800 rounded-lg font-semibold hover:bg-gray-700 transition-colors">
          ⚙️ Settings
        </button>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="font-semibold mb-3">Recent Activity</h3>
        <div className="text-gray-400 text-sm text-center py-4">
          No recent activity
        </div>
      </div>
    </div>
  );
}

export default Popup;
