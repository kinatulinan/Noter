import { useState, useEffect } from "react";
import WalletConnection from "./components/WalletConnection";
import BlockchainNoteForm from "./components/BlockchainNoteForm";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

async function api(path, { method = "GET", body, headers } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(headers || {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty or non-json */
  }
  if (!res.ok) {
    const msg =
      data?.message ||
      data?.error ||
      (typeof data === "string" ? data : res.statusText);
    throw new Error(msg);
  }
  return data;
}

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserEmail, setCurrentUserEmail] = useState(null);
  const [notes, setNotes] = useState([]);
  const [form, setForm] = useState({ username: "", password: "" });
  const [authMode, setAuthMode] = useState("login");
  const [input, setInput] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);

  useEffect(() => {
    if (currentUserEmail) loadNotes();
  }, [currentUserEmail]);

  const loadNotes = async () => {
    try {
      const list = await api("/api/notes");
      const mapped = (list || []).map((n) => {
        const authorName = n.authorName || n.authorEmail || "unknown";
        const mine =
          currentUserEmail &&
          n.authorEmail &&
          n.authorEmail.toLowerCase() === currentUserEmail.toLowerCase();
        return {
          id: n.id,
          text: n.content || n.title || "",
          owner: mine ? currentUser || authorName : authorName,
          isBlockchain: n.blockchainTxHash ? true : false,
          txHash: n.blockchainTxHash || null,
        };
      });
      setNotes(mapped);
    } catch (e) {
      console.error(e);
      alert(`Failed to load notes: ${e.message}`);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) return alert("Fill all fields");
    try {
      await api("/api/auth/register", {
        method: "POST",
        body: {
          name: form.username,
          email: form.username,
          password: form.password,
        },
      });
      alert("Registered successfully! Please login.");
      setForm({ username: "", password: "" });
      setAuthMode("login");
    } catch (err) {
      alert(err.message || "Registration failed");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const { username, password } = form;
    if (!username || !password) return alert("Fill all fields");
    try {
      const data = await api("/api/auth/login", {
        method: "POST",
        body: { email: username, password },
      });
      if (!data?.success)
        return alert(data?.message || "Invalid username or password");
      const label = data.user?.name || data.user?.email || username;
      setCurrentUser(label);
      setCurrentUserEmail(data.user?.email || username);
      setForm({ username: "", password: "" });
      loadNotes();
    } catch (err) {
      alert(err.message || "Login failed");
    }
  };

  const handleNote = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const title = input.length > 60 ? input.slice(0, 60) : input || "Note";
    const content = input;

    try {
      if (editIndex !== null) {
        if (notes[editIndex].owner !== currentUser)
          return alert("You can only edit your own notes!");
        const id = notes[editIndex].id;
        if (id) {
          await api(`/api/notes/${id}`, {
            method: "PUT",
            body: { title, content, actorEmail: currentUserEmail },
          });
        }
        const updated = [...notes];
        updated[editIndex].text = content;
        setNotes(updated);
        setEditIndex(null);
      } else {
        const created = await api("/api/notes", {
          method: "POST",
          body: { title, content, authorEmail: currentUserEmail },
        });
        setNotes([
          ...notes,
          { id: created?.id, text: content, owner: currentUser, isBlockchain: false },
        ]);
      }
      setInput("");
    } catch (err) {
      alert(err.message || "Save failed");
    }
  };

  const handleDelete = async (i) => {
    if (notes[i].owner !== currentUser)
      return alert("You can only delete your own notes!");
    try {
      const id = notes[i].id;
      if (id) {
        await fetch(`${API}/api/notes/${id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "X-User-Email": currentUserEmail || "",
          },
        }).then(async (r) => {
          if (!r.ok) {
            const t = await r.text().catch(() => "");
            throw new Error(t || r.statusText);
          }
        });
      }
      setNotes(notes.filter((_, idx) => idx !== i));
    } catch (err) {
      alert(err.message || "Delete failed");
    }
  };

  const handleEdit = (i) => {
    if (notes[i].owner !== currentUser)
      return alert("You can only edit your own notes!");
    setInput(notes[i].text);
    setEditIndex(i);
  };

  const handleWalletConnection = (connected, address) => {
    setIsWalletConnected(connected);
    setWalletAddress(address);
  };

  const handleBlockchainNoteStored = (result) => {
    // Add blockchain note to local state for immediate feedback
    const newNote = {
      id: `blockchain-${result.noteId}`,
      text: `Blockchain Note (ID: ${result.noteId})`,
      owner: currentUser,
      isBlockchain: true,
      txHash: result.transactionHash,
    };
    setNotes([newNote, ...notes]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {!currentUser ? (
          <div className="max-w-md mx-auto">
            <div className="card p-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">
                  📝 Noter 2.0
                </h1>
                <p className="text-gray-400">Blockchain-powered note taking</p>
              </div>
              
              <form onSubmit={authMode === "login" ? handleLogin : handleRegister} className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    placeholder="Enter username"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    className="input-field w-full"
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="input-field w-full"
                  />
                </div>
                
                <button type="submit" className="btn-primary w-full">
                  {authMode === "login" ? "Login" : "Register"}
                </button>
              </form>
              
              <div className="mt-6 text-center">
                <p className="text-gray-400 text-sm">
                  {authMode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
                  <button
                    type="button"
                    onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}
                    className="text-primary-400 hover:text-primary-300 font-medium"
                  >
                    {authMode === "login" ? "Register" : "Login"}
                  </button>
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="card p-6 mb-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    📝 Noter 2.0
                  </h1>
                  <p className="text-gray-400">
                    Welcome back, <span className="text-white font-medium">{currentUser}</span>
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <WalletConnection onConnectionChange={handleWalletConnection} />
                  <button
                    onClick={() => {
                      setCurrentUser(null);
                      setCurrentUserEmail(null);
                      setIsWalletConnected(false);
                      setWalletAddress(null);
                    }}
                    className="btn-danger"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>

            {/* Blockchain Note Form */}
            <BlockchainNoteForm 
              onNoteStored={handleBlockchainNoteStored}
              isWalletConnected={isWalletConnected}
            />

            {/* Traditional Note Form */}
            <div className="card p-6 mb-8">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
                </svg>
                Traditional Note (Database)
              </h3>
              
              <form onSubmit={handleNote} className="flex gap-3">
                <input
                  type="text"
                  placeholder="Write your note..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="input-field flex-1"
                />
                <button type="submit" className="btn-primary">
                  {editIndex !== null ? "Update" : "Add"}
                </button>
              </form>
            </div>

            {/* Notes List */}
            <div className="card p-6">
              <h3 className="text-xl font-semibold mb-4">Your Notes</h3>
              
              {notes.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
                  </svg>
                  <p>No notes yet. Create your first note above!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notes.map((note, i) => (
                    <div
                      key={note.id ?? i}
                      className={`p-4 rounded-lg border-l-4 ${
                        note.isBlockchain 
                          ? 'bg-blue-900 bg-opacity-20 border-blue-400' 
                          : 'bg-gray-800 border-green-400'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-white">{note.owner}</span>
                            {note.isBlockchain ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 114 0 2 2 0 01-4 0zm6 0a2 2 0 114 0 2 2 0 01-4 0z" clipRule="evenodd" />
                                </svg>
                                Blockchain
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                                </svg>
                                Database
                              </span>
                            )}
                          </div>
                          <p className="text-gray-300">{note.text}</p>
                          {note.txHash && (
                            <p className="text-xs text-blue-400 mt-2 font-mono">
                              TX: {note.txHash.slice(0, 20)}...
                            </p>
                          )}
                        </div>
                        
                        {note.owner === currentUser && !note.isBlockchain && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(i)}
                              className="btn-secondary text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(i)}
                              className="btn-danger text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;