import { useState } from 'react';

const ROLES = ['STUDENT', 'STAFF', 'ADMIN'];

// Dev-only login: calls POST /auth/dev-login, which only exists when the
// backend is running with AUTH_MODE=mock (see server .env.local). Real AD
// login replaces this once the Azure AD app registration is granted.
export default function LoginCard({ onLogin }) {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('STAFF');
  const [department, setDepartment] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin({ email, displayName, role, department: department || undefined });
  };

  return (
    <div className="card login-card">
      <h2>CampusStore Admin — Dev Login</h2>
      <p className="hint">
        Uses the AUTH_MODE=mock dev login. Real Azure AD sign-in lands once
        the app registration is granted (proposal Wk3).
      </p>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="staff@uni.edu"
          />
        </div>
        <div className="field">
          <label htmlFor="displayName">Display name</label>
          <input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Staff Person"
          />
        </div>
        <div className="field">
          <label htmlFor="role">Role</label>
          <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="department">Department (optional)</label>
          <input
            id="department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="CS"
          />
        </div>
        <button type="submit" className="btn-primary">
          Log in
        </button>
      </form>
    </div>
  );
}
