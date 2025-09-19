import { useState, useEffect } from "react";

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

  // Silent auto-connect to currently open MetaMask account
  useEffect(() => {
    async function init() {
      if (!window.ethereum) return;

      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setIsConnected(true);
          localStorage.setItem(WALLET_STORAGE_KEY, accounts[0]);
        }
      } catch (err) {
        console.error("Failed to read MetaMask accounts:", err);
      }

      const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setIsConnected(true);
          localStorage.setItem(WALLET_STORAGE_KEY, accounts[0]);
        } else {
          disconnectWallet();
        }
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);

      return () => {
        if (window.ethereum?.removeListener) {
          window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        }
      };
    }

    init();
  }, []);

  useEffect(() => {
    if (walletAddress && isConnected) {
      loadNotes();
    }
  }, [walletAddress, isConnected]);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask is not installed. Please install MetaMask to use this app.");
      return;
    }

    try {
      setLoading(true);
      // Request account authorization if needed (first-time users)
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setIsConnected(true);
        localStorage.setItem(WALLET_STORAGE_KEY, accounts[0]);
      }
    } catch (err) {
      console.error("User rejected connection:", err);
      alert("Connection rejected. Please connect your wallet to continue.");
    } finally {
      setLoading(false);
    }
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
    try {
      setLoading(true);
      const notesData = await api(`/api/notes/${walletAddress}`);
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

    try {
      setLoading(true);
      const noteData = await api("/api/notes", {
        method: "POST",
        body: { text: newNote.trim() },
        headers: { "X-Wallet-Address": walletAddress },
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

    try {
      setLoading(true);
      const updatedNote = await api(`/api/notes/${editingNote.id}`, {
        method: "PUT",
        body: { text: newNote.trim() },
        headers: { "X-Wallet-Address": walletAddress },
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
    if (!confirm("Are you sure you want to delete this note?")) return;
  
    try {
      setLoading(true);
      await api(`/api/notes/${noteId}`, {
        method: "DELETE",
        headers: { "X-Wallet-Address": walletAddress },
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


  if (!isConnected) {
    return (
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
                onClick={connectWallet}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Connecting..." : "Connect Wallet"}
              </button>
              <p className="text-sm text-gray-400 mt-4">
                You'll need MetaMask or a compatible wallet
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8 shadow-2xl border border-white/20">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">📝 Noter</h1>
              <p className="text-gray-300">
                Wallet: <span className="font-mono text-blue-300">{formatAddress(walletAddress)}</span>
              </p>
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
