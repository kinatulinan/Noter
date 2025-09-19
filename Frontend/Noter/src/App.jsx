import { useState, useEffect } from "react";
import "./App.css";

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
  const [users, setUsers] = useState([]); // kept for parity
  const [currentUser, setCurrentUser] = useState(null); // display name
  const [currentUserEmail, setCurrentUserEmail] = useState(null); // real identity for ownership
  const [notes, setNotes] = useState([]); // [{ id, text, owner }]
  const [form, setForm] = useState({ username: "", password: "" });
  const [authMode, setAuthMode] = useState("login");
  const [input, setInput] = useState("");
  const [editIndex, setEditIndex] = useState(null);

  // Load notes after login
  useEffect(() => {
    if (currentUserEmail) loadNotes();
  }, [currentUserEmail]);

  const loadNotes = async () => {
    try {
      const list = await api("/api/notes");
      // Map server -> UI; mark my notes' owner as my display name to keep existing edit/delete checks
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
        };
      });
      setNotes(mapped);
    } catch (e) {
      console.error(e);
      alert(`Failed to load notes: ${e.message}`);
    }
  };

  // Register (use username as name+email to match your backend DTOs)
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

  // Login (username treated as email)
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
      // optional: preload notes here; effect will also run
      loadNotes();
    } catch (err) {
      alert(err.message || "Login failed");
    }
  };

  // Add / Update note (server-enforced ownership)
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
          { id: created?.id, text: content, owner: currentUser },
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

  // ---------- UI (unchanged) ----------
  return (
    <div className="app-container">
      {!currentUser ? (
        <div className="auth-form">
          <h1>{authMode === "login" ? "Login" : " Register"}</h1>
          <form onSubmit={authMode === "login" ? handleLogin : handleRegister}>
            <input
              type="text"
              placeholder="Username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button type="submit">
              {authMode === "login" ? "Login" : "Register"}
            </button>
          </form>
          <p className="switch-text">
            {authMode === "login" ? "No account?" : "Have an account?"}{" "}
            <button
              type="button"
              className="link-button"
              onClick={() =>
                setAuthMode(authMode === "login" ? "register" : "login")
              }
            >
              {authMode === "login" ? "Register" : "Login"}
            </button>
          </p>
        </div>
      ) : (
        <>
          <h1>📝 Noter 1.0</h1>
          <p>
            Welcome, <b>{currentUser}</b>{" "}
            <button
              className="logout-btn"
              onClick={() => {
                setCurrentUser(null);
                setCurrentUserEmail(null);
              }}
            >
              Logout
            </button>
          </p>

          <form onSubmit={handleNote} className="note-form">
            <input
              type="text"
              placeholder="Write your note..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit">
              {editIndex !== null ? "Update" : "Add"}
            </button>
          </form>

          <ul className="notes-list">
            {notes.map((note, i) => (
              <li key={note.id ?? i} className="note-item">
                <span>
                  <b>{note.owner}:</b> {note.text}
                </span>
                {note.owner === currentUser && (
                  <div className="actions">
                    <button onClick={() => handleEdit(i)}> Edit</button>
                    <button onClick={() => handleDelete(i)}> Delete</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default App;
