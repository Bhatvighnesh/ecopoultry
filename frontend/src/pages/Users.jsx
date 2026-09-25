import { useEffect, useState, useCallback } from 'react';
import { UserPlus, Users as UsersIcon, Power } from 'lucide-react';
import apiClient from '../api/client';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'farmer' });
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    const { data } = await apiClient.get('/api/users');
    setUsers(data.users);
  }, []);

  useEffect(() => {
    load().catch((err) => console.error(err));
  }, [load]);

  async function handleCreate(e) {
    e.preventDefault();
    setMessage('');
    try {
      await apiClient.post('/api/auth/users', form);
      setForm({ name: '', email: '', password: '', role: 'farmer' });
      setMessage('Account created.');
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to create account');
    }
  }

  async function toggleActive(user) {
    await apiClient.patch(`/api/users/${user.id}/active`, { active: !user.active });
    load();
  }

  return (
    <div className="page">
      <section className="panel">
        <div className="panel-header">
          <h2>
            <UserPlus size={18} /> Create Farmer / Admin Account
          </h2>
        </div>
        {message && <div className="form-message">{message}</div>}
        <form onSubmit={handleCreate} className="inline-form">
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input type="password" placeholder="Password (min 8 chars)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="farmer">Farmer</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit">Create</button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>
            <UsersIcon size={18} /> User Accounts
          </h2>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td style={{ textTransform: 'capitalize' }}>{u.role}</td>
                  <td>
                    <span className={`badge badge-${u.active ? 'safe' : 'stale'}`}>{u.active ? 'Active' : 'Disabled'}</span>
                  </td>
                  <td>
                    <button className="btn-small" onClick={() => toggleActive(u)}>
                      <Power size={13} /> {u.active ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
