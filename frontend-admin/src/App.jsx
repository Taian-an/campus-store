import { useEffect, useState, useCallback } from 'react';
import { request } from './api';
import LoginCard from './components/LoginCard';
import CategoriesPanel from './components/CategoriesPanel';
import ProductsPanel from './components/ProductsPanel';

const STORAGE_KEY = 'campus-store-auth';

function loadAuth() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null;
  } catch {
    return null;
  }
}

export default function App() {
  const [auth, setAuth] = useState(loadAuth);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');

  const token = auth?.token;
  const role = auth?.user?.role;

  const refreshCategories = useCallback(async () => {
    const { data } = await request('/api/categories');
    setCategories(data);
  }, []);

  const refreshProducts = useCallback(async () => {
    const { data } = await request('/api/products');
    setProducts(data);
  }, []);

  useEffect(() => {
    refreshCategories().catch((err) => setError(err.message));
    refreshProducts().catch((err) => setError(err.message));
  }, [refreshCategories, refreshProducts]);

  const runOrReportError = async (action) => {
    setError('');
    try {
      await action();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogin = (form) =>
    runOrReportError(async () => {
      const { token: newToken, user } = await request('/auth/dev-login', { method: 'POST', body: form });
      const next = { token: newToken, user };
      setAuth(next);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    });

  const handleLogout = () => {
    setAuth(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleCreateCategory = (body) =>
    runOrReportError(async () => {
      await request('/api/categories', { method: 'POST', token, body });
      await refreshCategories();
    });

  const handleDeleteCategory = (id) =>
    runOrReportError(async () => {
      await request(`/api/categories/${id}`, { method: 'DELETE', token });
      await refreshCategories();
    });

  const handleCreateProduct = (body) =>
    runOrReportError(async () => {
      await request('/api/products', { method: 'POST', token, body });
      await refreshProducts();
    });

  const handleDeleteProduct = (id) =>
    runOrReportError(async () => {
      await request(`/api/products/${id}`, { method: 'DELETE', token });
      await refreshProducts();
    });

  return (
    <div className="app">
      <div className="topbar">
        <h1>
          CampusStore Admin
          {role && <span className={`badge badge-${role}`}>{role}</span>}
        </h1>
        {auth && (
          <button className="btn-ghost" onClick={handleLogout}>
            Log out ({auth.user.email})
          </button>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      {!auth ? (
        <LoginCard onLogin={handleLogin} />
      ) : (
        <>
          <CategoriesPanel
            categories={categories}
            role={role}
            onCreate={handleCreateCategory}
            onDelete={handleDeleteCategory}
          />
          <ProductsPanel
            products={products}
            categories={categories}
            role={role}
            onCreate={handleCreateProduct}
            onDelete={handleDeleteProduct}
          />
        </>
      )}
    </div>
  );
}
