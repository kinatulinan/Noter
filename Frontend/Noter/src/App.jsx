import { useState, useEffect } from "react";
import * as CardanoWasm from '@emurgo/cardano-serialization-lib-browser';

const API_BASE_URL = "http://localhost:8080";
const WALLET_STORAGE_KEY = "noter_wallet_address";

async function api(path, { method = "GET", body, headers = {} } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

function App() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [editingNote, setEditingNote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [availableAddresses, setAvailableAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showFullAddress, setShowFullAddress] = useState(false);

  useEffect(() => {
    async function init() {
      // Check for Lace wallet with multiple possible property names
      const laceWallet = window.cardano?.lace || window.cardano?.lacewallet;
      
      if (!laceWallet) {
        console.log("Lace wallet not detected on page load");
        return;
      }

      // Check if we have a stored address
      const storedAddress = localStorage.getItem(WALLET_STORAGE_KEY);
      if (storedAddress) {
        try {
          // Try to verify the wallet is still connected
          const walletApi = await laceWallet.enable();
          let addresses = await walletApi.getUsedAddresses();
          
          if (addresses.length === 0) {
            addresses = await walletApi.getUnusedAddresses();
          }
          
          if (addresses.length === 0) {
            const changeAddress = await walletApi.getChangeAddress();
            if (changeAddress) {
              addresses = [changeAddress];
            }
          }
          
          if (addresses.length > 0) {
            const address = typeof addresses[0] === 'string' ? addresses[0] : addresses[0].toString();
            // Check if stored address matches any current address
            const matchingAddr = addresses.find(addr => {
              const addrStr = typeof addr === 'string' ? addr : addr.toString();
              return addrStr === storedAddress;
            });
            
            if (matchingAddr) {
              const hexAddr = typeof matchingAddr === 'string' ? matchingAddr : matchingAddr.toString();
              const bech32Addr = hexToBech32(hexAddr);
              setWalletAddress({ hex: hexAddr, bech32: bech32Addr });
              setIsConnected(true);
            } else {
              // Stored address doesn't match, use first available
              const hexAddr = address;
              const bech32Addr = hexToBech32(hexAddr);
              setWalletAddress({ hex: hexAddr, bech32: bech32Addr });
              setIsConnected(true);
              localStorage.setItem(WALLET_STORAGE_KEY, hexAddr);
            }
          }
        } catch (err) {
          console.error("Failed to reconnect to Lace wallet:", err);
          // Clear stored address if wallet connection fails
          localStorage.removeItem(WALLET_STORAGE_KEY);
        }
      }
    }

    init();
  }, []);

  useEffect(() => {
    if (walletAddress && isConnected) {
      loadNotes();
    }
  }, [walletAddress, isConnected]);

  const openWalletModal = async () => {
    console.log("Connect wallet clicked");
    console.log("window.cardano:", window.cardano);
    console.log("window.cardano?.lace:", window.cardano?.lace);
    
    // Check for Lace wallet with multiple possible property names
    const laceWallet = window.cardano?.lace || window.cardano?.lacewallet;
    
    if (!laceWallet) {
      console.error("Lace wallet not found. Available wallets:", Object.keys(window.cardano || {}));
      alert("Lace wallet is not installed. Please install Lace to use this app.");
      return;
    }

    try {
      setLoadingAddresses(true);
      setShowWalletModal(true);
      console.log("Enabling wallet...");
      // Request wallet connection (CIP-30 standard)
      const walletApi = await laceWallet.enable();
      console.log("Wallet API enabled:", walletApi);
      console.log("Available API methods:", Object.keys(walletApi));
      
      // Fetch ALL addresses from all available methods
      const allAddresses = [];
      
      // Get used addresses - this should return all used addresses for the current account
      try {
        const usedAddresses = await walletApi.getUsedAddresses();
        console.log("Used addresses (count):", usedAddresses?.length);
        console.log("Used addresses (raw):", usedAddresses);
        if (usedAddresses && usedAddresses.length > 0) {
          allAddresses.push(...usedAddresses);
        }
      } catch (err) {
        console.warn("Error getting used addresses:", err);
      }
      
      // Get unused addresses - these are addresses that haven't been used yet
      try {
        const unusedAddresses = await walletApi.getUnusedAddresses();
        console.log("Unused addresses (count):", unusedAddresses?.length);
        console.log("Unused addresses (raw):", unusedAddresses);
        if (unusedAddresses && unusedAddresses.length > 0) {
          allAddresses.push(...unusedAddresses);
        }
      } catch (err) {
        console.warn("Error getting unused addresses:", err);
      }
      
      // Get change address - this is typically the same as the first unused address
      try {
        const changeAddress = await walletApi.getChangeAddress();
        console.log("Change address:", changeAddress);
        if (changeAddress) {
          allAddresses.push(changeAddress);
        }
      } catch (err) {
        console.warn("Error getting change address:", err);
      }
      
      console.log("Total addresses collected (before deduplication):", allAddresses.length);
      
      // Convert all addresses to strings, convert to bech32, and deduplicate
      // Only include payment addresses (addr1... or addr_test1...), skip stake addresses
      const addressMap = new Map();
      allAddresses.forEach(addr => {
        const addrStr = typeof addr === 'string' ? addr : addr.toString();
        if (addrStr) {
          try {
            // Convert hex to bech32 for display
            const bech32Addr = hexToBech32(addrStr);
            
            // Only include payment addresses, skip stake addresses
            if (bech32Addr.startsWith('addr1') || bech32Addr.startsWith('addr_test1')) {
              if (!addressMap.has(bech32Addr)) {
                // Store both hex (for API) and bech32 (for display)
                addressMap.set(bech32Addr, { hex: addrStr, bech32: bech32Addr });
              }
            } else if (bech32Addr.startsWith('stake1') || bech32Addr.startsWith('stake_test1')) {
              // Skip stake addresses - they're not payment addresses
              console.log("Skipping stake address:", bech32Addr);
            }
          } catch (err) {
            console.warn("Failed to convert address to bech32:", err);
            // If conversion fails, check if it's already a payment address
            if (addrStr.startsWith('addr1') || addrStr.startsWith('addr_test1')) {
              if (!addressMap.has(addrStr)) {
                addressMap.set(addrStr, { hex: addrStr, bech32: addrStr });
              }
            }
          }
        }
      });
      
      const uniqueAddresses = Array.from(addressMap.values());
      console.log("All unique addresses (bech32):", uniqueAddresses.map(a => a.bech32));
      
      setAvailableAddresses(uniqueAddresses);
      
      if (uniqueAddresses.length === 0) {
        alert("No addresses found in wallet. Please ensure your wallet has addresses.");
        setShowWalletModal(false);
      }
    } catch (err) {
      console.error("Wallet connection error:", err);
      const errorMessage = err.message || err.toString() || "Unknown error";
      alert(`Connection failed: ${errorMessage}. Please check your wallet and try again.`);
      setShowWalletModal(false);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const selectWalletAddress = (addressObj) => {
    // addressObj contains both hex and bech32
    const addressToStore = addressObj.hex || addressObj.bech32;
    const addressToDisplay = addressObj.bech32 || addressObj.hex;
    console.log("Selected wallet address (hex):", addressToStore);
    console.log("Selected wallet address (bech32):", addressToDisplay);
    // Store hex for API calls, but display bech32
    setWalletAddress({ hex: addressToStore, bech32: addressToDisplay });
    setIsConnected(true);
    // Store hex in localStorage for API compatibility
    localStorage.setItem(WALLET_STORAGE_KEY, addressToStore);
    setShowWalletModal(false);
    setAvailableAddresses([]);
  };

  const closeWalletModal = () => {
    setShowWalletModal(false);
    setAvailableAddresses([]);
    setLoadingAddresses(false);
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    setIsConnected(false);
    setNotes([]);
    setNewNote("");
    setEditingNote(null);
    setLoading(false);
    localStorage.removeItem(WALLET_STORAGE_KEY);
  };

  const loadNotes = async () => {
    if (!walletAddress) return;
    const addressHex = typeof walletAddress === 'string' ? walletAddress : walletAddress.hex;
    if (!addressHex) return;
    try {
      setLoading(true);
      const notesData = await api(`/api/notes/${addressHex}`);
      setNotes(notesData);
    } catch (error) {
      console.error("Error loading notes:", error);
      alert("Failed to load notes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const createNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim() || !walletAddress) return;
    const addressHex = typeof walletAddress === 'string' ? walletAddress : walletAddress.hex;
    if (!addressHex) return;

    try {
      setLoading(true);
      const noteData = await api("/api/notes", {
        method: "POST",
        body: { text: newNote.trim() },
        headers: { "X-Wallet-Address": addressHex },
      });
      setNotes([noteData, ...notes]);
      setNewNote("");
    } catch (error) {
      console.error("Error creating note:", error);
      alert("Failed to create note. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateNote = async (e) => {
    e.preventDefault();
    if (!editingNote || !newNote.trim() || !walletAddress) return;
    const addressHex = typeof walletAddress === 'string' ? walletAddress : walletAddress.hex;
    if (!addressHex) return;

    try {
      setLoading(true);
      const updatedNote = await api(`/api/notes/${editingNote.id}`, {
        method: "PUT",
        body: { text: newNote.trim() },
        headers: { "X-Wallet-Address": addressHex },
      });
      setNotes(notes.map((note) => (note.id === editingNote.id ? updatedNote : note)));
      setEditingNote(null);
      setNewNote("");
    } catch (error) {
      console.error("Error updating note:", error);
      alert("Failed to update note. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const deleteNote = async (noteId) => {
    if (!walletAddress) return;
    const addressHex = typeof walletAddress === 'string' ? walletAddress : walletAddress.hex;
    if (!addressHex) return;
    if (!confirm("Are you sure you want to delete this note?")) return;
  
    try {
      setLoading(true);
      await api(`/api/notes/${noteId}`, {
        method: "DELETE",
        headers: { "X-Wallet-Address": addressHex },
      });
      
      // Update the UI immediately by removing the note from state
      setNotes((prevNotes) => prevNotes.filter((note) => note.id !== noteId));
      
      // Show success message after UI update
      alert("Note deleted successfully!");
    } catch (error) {
      console.error("Error deleting note:", error);
      alert("Failed to delete note. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  const startEdit = (note) => {
    setEditingNote(note);
    setNewNote(note.text);
  };

  const cancelEdit = () => {
    setEditingNote(null);
    setNewNote("");
  };

  const formatAddress = (address) => `${address.slice(0, 6)}...${address.slice(-4)}`;
  const formatDate = (dateString) => dateString || "-";

  const hexToBech32 = (hexAddress) => {
    try {
      // If already in bech32 format (payment address), return as-is
      if (hexAddress.startsWith('addr1') || hexAddress.startsWith('addr_test1')) {
        return hexAddress;
      }
      
      // If it's a stake address in bech32, return as-is (will be filtered out later)
      if (hexAddress.startsWith('stake1') || hexAddress.startsWith('stake_test1')) {
        return hexAddress;
      }
      
      // Convert hex string to Uint8Array
      const hexString = hexAddress.startsWith('0x') ? hexAddress.slice(2) : hexAddress;
      const addressBytes = Uint8Array.from(
        hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
      );
      
      if (addressBytes.length === 0) {
        return hexAddress;
      }
      
      // Create Cardano address from bytes using CSL
      const address = CardanoWasm.Address.from_bytes(addressBytes);
      
      // Convert to bech32 format
      return address.to_bech32();
    } catch (error) {
      console.error("Error converting address to bech32:", error);
      // If conversion fails, return original address
      return hexAddress;
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert("Address copied to clipboard!");
    }).catch(err => {
      console.error("Failed to copy:", err);
      alert("Failed to copy address");
    });
  };


  if (!isConnected) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
          <div className="max-w-md w-full mx-4">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl">📝</span>
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Noter</h1>
                <p className="text-gray-300 mb-8">
                  Connect your wallet to start taking notes
                </p>
                <button
                  onClick={openWalletModal}
                  disabled={loadingAddresses}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingAddresses ? "Loading..." : "Connect Wallet"}
                </button>
                <p className="text-sm text-gray-400 mt-4">
                  You'll need Lace or a compatible Cardano wallet
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Wallet Selection Modal */}
        {showWalletModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">Select Wallet Address</h2>
                <button
                  onClick={closeWalletModal}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {loadingAddresses ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                  <p className="text-gray-300">Loading wallet addresses...</p>
                </div>
              ) : availableAddresses.length > 0 ? (
                <div>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {availableAddresses.map((addressObj, index) => (
                      <div
                        key={index}
                        className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-4 transition-all duration-200"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-mono text-xs mb-1">
                              {formatAddress(addressObj.bech32)}
                            </p>
                            <p className="text-gray-400 text-xs">
                              Address {index + 1}
                            </p>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <button
                              onClick={() => copyToClipboard(addressObj.bech32)}
                              className="text-blue-400 hover:text-blue-300 text-xs px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition-colors"
                              title="Copy full address"
                            >
                              Copy
                            </button>
                            <button
                              onClick={() => selectWalletAddress(addressObj)}
                              className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded transition-colors"
                            >
                              Select
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-300">No addresses found in wallet.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8 shadow-2xl border border-white/20">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">📝 Noter</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-gray-300">
                  Wallet: 
                </p>
                <span className="font-mono text-blue-300 text-sm">
                  {walletAddress && (showFullAddress 
                    ? (typeof walletAddress === 'string' ? walletAddress : walletAddress.bech32)
                    : formatAddress(typeof walletAddress === 'string' ? walletAddress : walletAddress.bech32)
                  )}
                </span>
                <button
                  onClick={() => setShowFullAddress(!showFullAddress)}
                  className="text-blue-400 hover:text-blue-300 text-xs underline"
                  title={showFullAddress ? "Show shortened" : "Show full address"}
                >
                  {showFullAddress ? "Shorten" : "Show Full"}
                </button>
                <button
                  onClick={() => copyToClipboard(typeof walletAddress === 'string' ? walletAddress : walletAddress.bech32)}
                  className="text-blue-400 hover:text-blue-300 text-xs underline"
                  title="Copy full address"
                >
                  Copy
                </button>
              </div>
            </div>
            <button
              onClick={disconnectWallet}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Disconnect
            </button>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8 shadow-2xl border border-white/20">
          <h2 className="text-xl font-semibold text-white mb-4">
            {editingNote ? "Edit Note" : "Create New Note"}
          </h2>
          <form onSubmit={editingNote ? updateNote : createNote} className="space-y-4">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Write your note here..."
              className="w-full bg-white/20 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
              rows="4"
              required
            />
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading || !newNote.trim()}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Saving..." : editingNote ? "Update Note" : "Create Note"}
              </button>
              {editingNote && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
          <h2 className="text-xl font-semibold text-white mb-6">Your Notes ({notes.length})</h2>
          {loading && notes.length === 0 ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-gray-300">Loading notes...</p>
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📝</span>
              </div>
              <p className="text-gray-300">No notes yet. Create your first note above!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors duration-200"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <p className="text-white mb-2 whitespace-pre-wrap">{note.text}</p>
                      <p className="text-xs text-gray-400">
                        Created: {formatDate(note.createdAt)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(note)}
                        className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold py-1 px-3 rounded transition-colors duration-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteNote(note.id)}
                        className="bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-1 px-3 rounded transition-colors duration-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
