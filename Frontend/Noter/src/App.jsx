import { useState } from "react";
import "./App.css";

function App() {
  const [users, setUsers] = useState([]); // registered users
  const [currentUser, setCurrentUser] = useState(null); // logged-in user
  const [notes, setNotes] = useState([]); // { text, owner }

  const [form, setForm] = useState({ username: "", password: "" });
  const [authMode, setAuthMode] = useState("login"); // "login" | "register"
  const [input, setInput] = useState("");
  const [editIndex, setEditIndex] = useState(null);

  // Register
  const handleRegister = (e) => {
    e.preventDefault();
    if (!form.username || !form.password) return alert("Fill all fields");

    if (users.some((u) => u.username === form.username)) {
      return alert("User already exists");
    }

    setUsers([...users, { ...form }]);
    alert("Registered successfully! Please login.");
    setForm({ username: "", password: "" });
    setAuthMode("login");
  };

  // Login
  const handleLogin = (e) => {
    e.preventDefault();
    const found = users.find(
      (u) => u.username === form.username && u.password === form.password
    );
    if (!found) return alert("Invalid username or password");

    setCurrentUser(found.username);
    setForm({ username: "", password: "" });
  };

  // Add / Update note
  const handleNote = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (editIndex !== null) {
      if (notes[editIndex].owner !== currentUser)
        return alert("You can only edit your own notes!");

      const updated = [...notes];
      updated[editIndex].text = input;
      setNotes(updated);
      setEditIndex(null);
    } else {
      setNotes([...notes, { text: input, owner: currentUser }]);
    }
    setInput("");
  };

  // Delete
  const handleDelete = (i) => {
    if (notes[i].owner !== currentUser)
      return alert("You can only delete your own notes!");
    setNotes(notes.filter((_, idx) => idx !== i));
  };

  // Edit
  const handleEdit = (i) => {
    if (notes[i].owner !== currentUser)
      return alert("You can only edit your own notes!");
    setInput(notes[i].text);
    setEditIndex(i);
  };

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
            <button className="logout-btn" onClick={() => setCurrentUser(null)}>
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
            <button type="submit">{editIndex !== null ? "Update" : "Add"}</button>
          </form>

          <ul className="notes-list">
            {notes.map((note, i) => (
              <li key={i} className="note-item">
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
