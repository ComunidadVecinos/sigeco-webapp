import React, { useEffect, useState } from 'react';

function App() {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setStatus('Logging in...');
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Login failed: ${res.status} - ${text}`);
      }

      const data = await res.json();
      setUser(data);
      setStatus('Logged in!');
      await fetchItems(); // load items after login
    } catch (err) {
      console.error(err);
      setError('Login failed');
      setStatus('');
    }
  }

  async function fetchItems() {
    setStatus('Loading items...');
    setError('');

    try {
      const res = await fetch('/api/items');

      if (res.status === 401) {
        setError('You must be logged in to see items');
        setStatus('');
        return;
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to load items: ${res.status} - ${text}`);
      }

      const data = await res.json();
      setItems(data);
      setStatus('Items loaded');
    } catch (err) {
      console.error(err);
      setError('Failed to load items');
      setStatus('');
    }
  }

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error(err);
    }
    setUser(null);
    setItems([]);
    setStatus('Logged out');
  }

  useEffect(() => {
    // Optionally try to load items on load (will 401 if not logged in)
    // fetchItems();
  }, []);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem', maxWidth: 600 }}>
      <h1>JWT Auth + Items Demo</h1>

      {status && <p style={{ color: 'green' }}>{status}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!user ? (
        <form onSubmit={handleLogin} style={{ marginBottom: '2rem' }}>
          <h2>Login</h2>
          <div style={{ marginBottom: '0.5rem' }}>
            <label>
              Email:{' '}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%' }}
              />
            </label>
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <label>
              Password:{' '}
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%' }}
              />
            </label>
          </div>
          <button type="submit">Log in</button>
        </form>
      ) : (
        <div style={{ marginBottom: '2rem' }}>
          <p>
            Logged in as <strong>{user.email}</strong>
          </p>
          <button onClick={handleLogout}>Log out</button>
        </div>
      )}

      <section>
        <h2>Your Items</h2>
        {user ? (
          <>
            <button onClick={fetchItems} style={{ marginBottom: '1rem' }}>
              Refresh items
            </button>
            {items.length === 0 ? (
              <p>No items found.</p>
            ) : (
              <ul>
                {items.map((item) => (
                  <li key={item.id}>
                    <strong>{item.name}</strong>
                    {item.description ? ` – ${item.description}` : null}
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p>Log in to see your items.</p>
        )}
      </section>
    </div>
  );
}

export default App;
