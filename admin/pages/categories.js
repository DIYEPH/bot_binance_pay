import { useEffect, useState } from 'react';
import NavBar from '../components/NavBar';
import PageHeader from '../components/PageHeader';
import ErrorBanner from '../components/ErrorBanner';
import BotStatusBadge from '../components/BotStatusBadge';

export default function Categories() {
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', is_active: true });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      setLoading(true);
      const [categoriesRes, productsRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/products')
      ]);
      const categories = await categoriesRes.json();
      const productsData = await productsRes.json();
      setItems(categories);
      setProducts(productsData);
      if (categories.length && !selectedId) {
        setSelectedId(categories[0].id);
      }
    } catch (err) {
      setError(err.message || 'Lỗi');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const method = editing ? 'PUT' : 'POST';
      const payload = editing ? { ...form, id: editing } : form;
      const res = await fetch('/api/categories', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Lưu thất bại');
      setForm({ name: '', description: '', is_active: true });
      setEditing(null);
      await load();
    } catch (err) {
      setError(err.message || 'Lỗi');
    }
  }

  function startEdit(item) {
    setEditing(item.id);
    setForm({
      name: item.name || '',
      description: item.description || '',
      is_active: item.is_active === 1
    });
  }

  async function remove(id) {
    if (!confirm('Xóa danh mục?')) return;
    await fetch('/api/categories', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    if (selectedId === id) {
      setSelectedId(null);
    }
    await load();
  }

  const selectedCategory = items.find(item => item.id === selectedId);
  const filteredProducts = products.filter(p => p.category_id === selectedId);

  return (
    <main className="page">
      <NavBar active="/categories" />

      <PageHeader
        eyebrow="Danh mục"
        title="Danh mục sản phẩm"
        subtitle="Tạo và quản lý nhóm sản phẩm."
        right={<BotStatusBadge />}
      />

      <ErrorBanner message={error} />

      <section className="panel">
        <h2>{editing ? 'Sửa danh mục' : 'Thêm danh mục'}</h2>
        <form className="form" onSubmit={onSubmit}>
          <div className="field">
            <label>Tên danh mục</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="field">
            <label>Mô tả</label>
            <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <label className="checkbox">
            <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
            Đang hiển thị
          </label>
          <div className="actions">
            <button className="btn" type="submit">{editing ? 'Lưu' : 'Tạo mới'}</button>
            {editing && (
              <button type="button" className="btn secondary" onClick={() => {
                setEditing(null);
                setForm({ name: '', description: '', is_active: true });
              }}>Hủy</button>
            )}
          </div>
        </form>
      </section>

      <section className="split">
        <div className="panel">
          <div className="panel-head">
            <h2>Danh mục</h2>
            <span className="muted">{loading ? 'Đang tải...' : `${items.length} mục`}</span>
          </div>
          <div className="list">
            {items.map(item => (
              <div
                className={`list-item ${selectedId === item.id ? 'active' : ''}`}
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedId(item.id)}
                onKeyDown={e => e.key === 'Enter' && setSelectedId(item.id)}
              >
                <div className="list-title">
                  <span>#{item.id} {item.name}</span>
                  <span className="pill">{item.product_count || 0} sản phẩm</span>
                </div>
                <div className="list-meta">
                  <span className="muted">{item.description || '-'}</span>
                  <span className={item.is_active ? 'status active' : 'status'}>{item.is_active ? 'Hiển thị' : 'Ẩn'}</span>
                </div>
                <div className="row-actions">
                  <button className="link" onClick={(e) => { e.stopPropagation(); startEdit(item); }}>Sửa</button>
                  <button className="link danger" onClick={(e) => { e.stopPropagation(); remove(item.id); }}>Xóa</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>{selectedCategory ? selectedCategory.name : 'Sản phẩm'}</h2>
            <span className="muted">{selectedCategory ? `${filteredProducts.length} sản phẩm` : 'Chọn danh mục'}</span>
          </div>
          {!selectedCategory && <p className="muted">Chọn một danh mục để xem sản phẩm.</p>}
          {selectedCategory && (
            <div className="table">
              <div className="table-row table-head products">
                <div>Tên</div>
                <div>Giá</div>
                <div>Xu</div>
                <div>Tồn kho</div>
                <div>Trạng thái</div>
              </div>
              {filteredProducts.map(product => (
                <div className="table-row products" key={product.id}>
                  <div>{product.name}</div>
                  <div>{Number(product.price || 0).toFixed(2)} USDT</div>
                  <div>{product.credits_enabled ? `${Number(product.credits_price || 0).toFixed(2)} Xu` : '-'}</div>
                  <div>{product.stock_count || 0}</div>
                  <div>{product.is_active ? 'Hiển thị' : 'Ẩn'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
