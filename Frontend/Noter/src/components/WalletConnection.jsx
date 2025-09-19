import { useState, useEffect } from 'react';
import blockchainService from '../services/blockchain';

const WalletConnection = ({ onConnectionChange }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Check if already connected
    const status = blockchainService.getConnectionStatus();
    setIsConnected(status.isConnected);
    setWalletAddress(status.address);
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const result = await blockchainService.connectWallet();
      if (result.success) {
        setIsConnected(true);
        setWalletAddress(result.address);
        onConnectionChange?.(true, result.address);
      } else {
        alert(`Connection failed: ${result.error}`);
      }
    } catch (error) {
      alert(`Connection error: ${error.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    blockchainService.disconnect();
    setIsConnected(false);
    setWalletAddress(null);
    onConnectionChange?.(false, null);
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="flex items-center gap-4">
      {!isConnected ? (
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="btn-primary flex items-center gap-2"
        >
          {isConnecting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Connecting...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 114 0 2 2 0 01-4 0zm6 0a2 2 0 114 0 2 2 0 01-4 0z" clipRule="evenodd" />
              </svg>
              Connect Wallet
            </>
          )}
        </button>
      ) : (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-green-600 text-white px-3 py-1 rounded-full text-sm">
            <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
            Connected: {formatAddress(walletAddress)}
          </div>
          <button
            onClick={handleDisconnect}
            className="btn-secondary text-sm"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

export default WalletConnection;