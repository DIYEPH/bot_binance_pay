import { useEffect, useState } from 'react';
import NavBar from '../components/NavBar';
import PageHeader from '../components/PageHeader';
import ErrorBanner from '../components/ErrorBanner';
import BotStatusBadge from '../components/BotStatusBadge';

const emptyForm = {
  name: '',
  price: '',
  description: '',
  category_id: '',
  credits_price: '',
  credits_enabled: false,
  is_active: true
};

export default function Products() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      setLoading(true);
      const [productsRes, categoriesRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories')
      ]);
      setItems(await productsRes.json());
      setCategories(await categoriesRes.json());
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
      const payload = {
        ...form,
        price: Number(form.price || 0),
        category_id: form.category_id ? Number(form.category_id) : null,
        credits_price: form.credits_price ? Number(form.credits_price) : null
      };
      const method = editing ? 'PUT' : 'POST';
      const body = editing ? { ...payload, id: editing } : payload;
      const res = await fetch('/api/products', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Lưu thất bại');
      setForm(emptyForm);
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
      price: item.price ?? '',
      description: item.description || '',
      category_id: item.category_id || '',
      credits_price: item.credits_price || '',
      credits_enabled: item.credits_enabled === 1,
      is_active: item.is_active === 1
    });
  }

  async function remove(id) {
    if (!confirm('Xóa sản phẩm?')) return;
    await fetch('/api/products', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    await load();
  }

  return (
    <main className="page">
      <NavBar active="/products" />

      <PageHeader
        eyebrow="Sản phẩm"
        title="Quản lý sản phẩm"
        subtitle="Quản lý giá, tồn kho và trạng thái hiển thị."
        right={<BotStatusBadge />}
      />

      <ErrorBanner message={error} />

      <section className="panel">
        <h2>{editing ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</h2>
        <form className="form" onSubmit={onSubmit}>
          <div className="field">
            <label>Tên sản phẩm</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="field">
            <label>Giá (USDT)</label>
            <input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
          </div>
          <div className="field">
            <label>Danh mục</label>
            <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
              <option value="">Không có danh mục</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Mô tả</label>
            <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="field">
            <label>Giá xu</label>
            <input type="number" step="0.01" value={form.credits_price} onChange={e => setForm({ ...form, credits_price: e.target.value })} />
          </div>
          <label className="checkbox">
            <input type="checkbox" checked={form.credits_enabled} onChange={e => setForm({ ...form, credits_enabled: e.target.checked })} />
            Cho phép mua bằng xu
          </label>
          <label className="checkbox">
            <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
            Đang hiển thị
          </label>
          <div className="actions">
            <button className="btn" type="submit">{editing ? 'Lưu' : 'Tạo mới'}</button>
            {editing && (
              <button type="button" className="btn secondary" onClick={() => {
                setEditing(null);
                setForm(emptyForm);
              }}>Hủy</button>
            )}
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="panel-head">
            <h2>Tất cả sản phẩm</h2>
            <span className="muted">{loading ? 'Đang tải...' : `${items.length} mục`}</span>
        </div>
        <div className="table">
          <div className="table-row table-head">
              <div>Mã</div>
              <div>Tên</div>
              <div>Danh mục</div>
              <div>Giá</div>
              <div>Tồn kho</div>
              <div>Trạng thái</div>
            <div></div>
          </div>
          {items.map(item => (
            <div className="table-row" key={item.id}>
              <div>#{item.id}</div>
              <div>{item.name}</div>
              <div className="muted">{item.category_name || '-'}</div>
              <div>{item.price} USDT</div>
              <div>{item.stock_count || 0}</div>
                <div>{item.is_active ? 'Hiển thị' : 'Ẩn'}</div>
              <div className="row-actions">
                  <button className="link" onClick={() => startEdit(item)}>Sửa</button>
                  <button className="link danger" onClick={() => remove(item.id)}>Xóa</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
