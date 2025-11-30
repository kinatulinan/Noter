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
  const [walletBalance, setWalletBalance] = useState(null);
  const [walletApi, setWalletApi] = useState(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendAddress, setSendAddress] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function init() {
      const laceWallet = window.cardano?.lace || window.cardano?.lacewallet;
      
      if (!laceWallet) {
        return;
      }

      const storedAddress = localStorage.getItem(WALLET_STORAGE_KEY);
      if (storedAddress) {
        try {
          const walletApi = await laceWallet.enable();
          setWalletApi(walletApi);
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
              const hexAddr = address;
              const bech32Addr = hexToBech32(hexAddr);
              setWalletAddress({ hex: hexAddr, bech32: bech32Addr });
              setIsConnected(true);
              localStorage.setItem(WALLET_STORAGE_KEY, hexAddr);
            }
          }
        } catch (err) {
          console.error("Failed to reconnect to Lace wallet:", err);
          localStorage.removeItem(WALLET_STORAGE_KEY);
        }
      }
    }

    init();
  }, []);

  useEffect(() => {
    if (walletAddress && isConnected && walletApi) {
      loadNotes();
      loadWalletBalance();
    }
  }, [walletAddress, isConnected, walletApi]);

  const loadWalletBalance = async () => {
    if (!walletAddress || !walletApi) return;
    
    try {
      if (!walletApi.getBalance) {
        setWalletBalance(0);
        return;
      }

      const balanceCbor = await walletApi.getBalance();
      
      if (!balanceCbor) {
        setWalletBalance(0);
        return;
      }

      let cborBytes;
      if (balanceCbor instanceof Uint8Array) {
        cborBytes = balanceCbor;
      } else if (typeof balanceCbor === 'string') {
        const cborHex = balanceCbor.startsWith('0x') ? balanceCbor.slice(2) : balanceCbor;
        cborBytes = Uint8Array.from(
          cborHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
        );
      } else {
        setWalletBalance(0);
        return;
      }

      const value = CardanoWasm.Value.from_bytes(cborBytes);
      const coin = value.coin();
      const lovelace = BigInt(coin.to_str());
      const adaBalance = Number(lovelace) / 1000000;
      
      setWalletBalance(adaBalance);
    } catch (error) {
      console.error("Error loading wallet balance:", error);
      setWalletBalance(0);
    }
  };

  const openWalletModal = async () => {
    const laceWallet = window.cardano?.lace || window.cardano?.lacewallet;
    
    if (!laceWallet) {
      alert("Lace wallet is not installed. Please install Lace to use this app.");
      return;
    }

    try {
      setLoadingAddresses(true);
      setShowWalletModal(true);
      const walletApi = await laceWallet.enable();
      setWalletApi(walletApi);
      
      const allAddresses = [];
      
      try {
        const usedAddresses = await walletApi.getUsedAddresses();
        if (usedAddresses && usedAddresses.length > 0) {
          allAddresses.push(...usedAddresses);
        }
      } catch (err) {
        console.warn("Error getting used addresses:", err);
      }
      
      try {
        const unusedAddresses = await walletApi.getUnusedAddresses();
        if (unusedAddresses && unusedAddresses.length > 0) {
          allAddresses.push(...unusedAddresses);
        }
      } catch (err) {
        console.warn("Error getting unused addresses:", err);
      }
      
      try {
        const changeAddress = await walletApi.getChangeAddress();
        if (changeAddress) {
          allAddresses.push(changeAddress);
        }
      } catch (err) {
        console.warn("Error getting change address:", err);
      }
      
      const addressMap = new Map();
      allAddresses.forEach(addr => {
        const addrStr = typeof addr === 'string' ? addr : addr.toString();
        if (addrStr) {
          try {
            const bech32Addr = hexToBech32(addrStr);
            
            if (bech32Addr.startsWith('addr1') || bech32Addr.startsWith('addr_test1')) {
              if (!addressMap.has(bech32Addr)) {
                addressMap.set(bech32Addr, { hex: addrStr, bech32: bech32Addr });
              }
            }
          } catch (err) {
            console.warn("Failed to convert address to bech32:", err);
            if (addrStr.startsWith('addr1') || addrStr.startsWith('addr_test1')) {
              if (!addressMap.has(addrStr)) {
                addressMap.set(addrStr, { hex: addrStr, bech32: addrStr });
              }
            }
          }
        }
      });
      
      const uniqueAddresses = Array.from(addressMap.values());
      
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
    const addressToStore = addressObj.hex || addressObj.bech32;
    const addressToDisplay = addressObj.bech32 || addressObj.hex;
    setWalletAddress({ hex: addressToStore, bech32: addressToDisplay });
    setIsConnected(true);
    localStorage.setItem(WALLET_STORAGE_KEY, addressToStore);
    setShowWalletModal(false);
    setAvailableAddresses([]);
    if (walletApi) {
      loadWalletBalance();
    }
  };

  const sendTransaction = async (e) => {
    e.preventDefault();
    if (!sendAddress.trim() || !sendAmount || !walletApi) {
      alert("Please enter a valid address and amount");
      return;
    }

    const amountAda = parseFloat(sendAmount);
    if (isNaN(amountAda) || amountAda <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    setSending(true);

    try {
      const recipientAddress = CardanoWasm.Address.from_bech32(sendAddress.trim());
      if (CardanoWasm.ByronAddress.from_address(recipientAddress)) {
        throw new Error("Sending to legacy Byron addresses is not supported.");
      }

      const changeAddrHex = await walletApi.getChangeAddress();
      const changeAddr = CardanoWasm.Address.from_bytes(
        Uint8Array.from(changeAddrHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)))
      );
       if (CardanoWasm.ByronAddress.from_address(changeAddr)) {
        throw new Error("Your wallet's change address is a legacy Byron address, which is not supported.");
      }

      const utxosHex = await walletApi.getUtxos();
      if (!utxosHex || utxosHex.length === 0) {
        throw new Error("No UTXOs found in wallet.");
      }

      const utxoList = CardanoWasm.TransactionUnspentOutputs.new();
      for (const utxoHex of utxosHex) {
        const utxo = CardanoWasm.TransactionUnspentOutput.from_bytes(
          Uint8Array.from(utxoHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)))
        );
        if (!CardanoWasm.ByronAddress.from_address(utxo.output().address())) {
          utxoList.add(utxo);
        } else {
          console.warn("Skipping legacy Byron UTXO");
        }
      }

      if (utxoList.len() === 0) {
        throw new Error("No compatible (Shelley-era) UTXOs available for transaction.");
      }

      const txBuilderConfig = CardanoWasm.TransactionBuilderConfigBuilder.new()
        .fee_algo(CardanoWasm.LinearFee.new(
          CardanoWasm.BigNum.from_str("44"),
          CardanoWasm.BigNum.from_str("155381")
        ))
        .coins_per_utxo_byte(CardanoWasm.BigNum.from_str("4310"))
        .pool_deposit(CardanoWasm.BigNum.from_str("500000000"))
        .key_deposit(CardanoWasm.BigNum.from_str("2000000"))
        .max_value_size(5000)
        .max_tx_size(16384)
        .build();
        
      const txBuilder = CardanoWasm.TransactionBuilder.new(txBuilderConfig);

      const output = CardanoWasm.TransactionOutput.new(
        recipientAddress,
        CardanoWasm.Value.new(CardanoWasm.BigNum.from_str(Math.floor(amountAda * 1_000_000).toString()))
      );
      txBuilder.add_output(output);

      txBuilder.add_inputs_from(utxoList, CardanoWasm.CoinSelectionStrategyCIP2.RandomImprove);
      txBuilder.add_change_if_needed(changeAddr);

      const txBody = txBuilder.build();
      
      const unsignedTx = CardanoWasm.Transaction.new(txBody, CardanoWasm.TransactionWitnessSet.new());
      const txHex = Array.from(unsignedTx.to_bytes(), byte => byte.toString(16).padStart(2, '0')).join('');

      const witnessSetHex = await walletApi.signTx(txHex, true);
      const witnessSet = CardanoWasm.TransactionWitnessSet.from_bytes(
        Uint8Array.from(witnessSetHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)))
      );
      
      const signedTx = CardanoWasm.Transaction.new(txBody, witnessSet);
      const signedTxHex = Array.from(signedTx.to_bytes(), byte => byte.toString(16).padStart(2, '0')).join('');

      const txHash = await walletApi.submitTx(signedTxHex);
      if (!txHash) {
        throw new Error("Transaction submission failed.");
      }

      setSendAddress("");
      setSendAmount("");
      setShowSendModal(false);
      await loadWalletBalance();
      
      alert(`Transaction sent successfully! Hash: ${txHash}`);

    } catch (error) {
      const errorMsg = error.message || error.toString() || "Unknown error";
      console.error("Transaction Error:", error);
      alert(`Failed to send transaction: ${errorMsg}`);
    } finally {
      setSending(false);
    }
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
      
      setNotes((prevNotes) => prevNotes.filter((note) => note.id !== noteId));
      
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
      if (hexAddress.startsWith('addr1') || hexAddress.startsWith('addr_test1')) {
        return hexAddress;
      }
      
      if (hexAddress.startsWith('stake1') || hexAddress.startsWith('stake_test1')) {
        return hexAddress;
      }
      
      const hexString = hexAddress.startsWith('0x') ? hexAddress.slice(2) : hexAddress;
      const addressBytes = Uint8Array.from(
        hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
      );
      
      if (addressBytes.length === 0) {
        return hexAddress;
      }
      
      const address = CardanoWasm.Address.from_bytes(addressBytes);
      
      return address.to_bech32();
    } catch (error) {
      console.error("Error converting address to bech32:", error);
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
          <h2 className="text-xl font-semibold text-white mb-4">Wallet</h2>
          <div className="flex flex-col md:flex-row items-center gap-6 mb-4">
            <div className="bg-white/5 rounded-lg p-4 w-full md:flex-grow">
              <p className="text-gray-400 text-sm mb-1">Balance</p>
              <p className="text-3xl font-bold text-white">
                {walletBalance !== null ? `${walletBalance.toFixed(2)} ADA` : "Loading..."}
              </p>
            </div>
            <button
              onClick={() => setShowSendModal(true)}
              className="w-full md:w-auto bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 text-lg"
            >
              Send
            </button>
          </div>
        </div>


        {showSendModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">Send ADA</h2>
                <button
                  onClick={() => {
                    setShowSendModal(false);
                    setSendAddress("");
                    setSendAmount("");
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={sendTransaction} className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Recipient Address</label>
                  <input
                    type="text"
                    value={sendAddress}
                    onChange={(e) => setSendAddress(e.target.value)}
                    placeholder="addr1... or addr_test1..."
                    className="w-full bg-white/20 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Amount (ADA)</label>
                  <input
                    type="number"
                    step="0.000001"
                    min="0"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    placeholder="0.0"
                    className="w-full bg-white/20 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={sending}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? "Sending..." : "Send"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSendModal(false);
                      setSendAddress("");
                      setSendAmount("");
                    }}
                    className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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