import { useEffect, useState } from 'react';
import NavBar from '../components/NavBar';
import PageHeader from '../components/PageHeader';
import ErrorBanner from '../components/ErrorBanner';
import BotStatusBadge from '../components/BotStatusBadge';

const emptyForm = {
  name: '',
  type: 'promo',
  code: '',
  reward_amount: '',
  reward_type: 'fixed',
  min_amount: '',
  max_claims: '',
  max_per_user: '1',
  is_active: true
};

export default function Events() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      setLoading(true);
      const res = await fetch('/api/events');
      const data = await res.json();
      setItems(data);
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
        reward_amount: Number(form.reward_amount || 0),
        min_amount: Number(form.min_amount || 0),
        max_claims: form.max_claims ? Number(form.max_claims) : null,
        max_per_user: form.max_per_user ? Number(form.max_per_user) : 1,
        code: form.code ? form.code.toUpperCase() : null
      };
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Lưu thất bại');
      setForm(emptyForm);
      await load();
    } catch (err) {
      setError(err.message || 'Lỗi');
    }
  }

  async function toggleEvent(item) {
    await fetch('/api/events', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, is_active: !item.is_active })
    });
    await load();
  }

  async function removeEvent(id) {
    if (!confirm('Xóa sự kiện?')) return;
    await fetch('/api/events', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    await load();
  }

  return (
    <main className="page">
      <NavBar active="/events" />

      <PageHeader
        eyebrow="Khuyến mãi"
        title="Sự kiện"
        subtitle="Quản lý mã khuyến mãi và thưởng tự động."
        right={<BotStatusBadge />}
      />

      <ErrorBanner message={error} />

      <section className="panel">
        <h2>Tạo sự kiện mới</h2>
        <form className="form" onSubmit={onSubmit}>
          <div className="field">
            <label>Tên sự kiện</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="field">
            <label>Loại</label>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="promo">Mã khuyến mãi</option>
              <option value="welcome">Thưởng chào mừng</option>
              <option value="deposit">Thưởng nạp tiền</option>
              <option value="purchase">Thưởng mua hàng</option>
            </select>
          </div>
          <div className="field">
            <label>Mã code (chỉ áp dụng promo)</label>
            <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="Tuỳ chọn" />
          </div>
          <div className="field">
            <label>Mức thưởng</label>
            <input type="number" step="0.01" value={form.reward_amount} onChange={e => setForm({ ...form, reward_amount: e.target.value })} required />
          </div>
          <div className="field">
            <label>Kiểu thưởng</label>
            <select value={form.reward_type} onChange={e => setForm({ ...form, reward_type: e.target.value })}>
              <option value="fixed">Cố định</option>
              <option value="percent">Phần trăm</option>
            </select>
          </div>
          <div className="field">
            <label>Số tiền tối thiểu</label>
            <input type="number" step="0.01" value={form.min_amount} onChange={e => setForm({ ...form, min_amount: e.target.value })} />
          </div>
          <div className="field">
            <label>Số lần tối đa</label>
            <input type="number" value={form.max_claims} onChange={e => setForm({ ...form, max_claims: e.target.value })} />
          </div>
          <div className="field">
            <label>Tối đa mỗi người</label>
            <input type="number" value={form.max_per_user} onChange={e => setForm({ ...form, max_per_user: e.target.value })} />
          </div>
          <label className="checkbox">
            <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
            Đang hoạt động
          </label>
          <div className="actions">
            <button className="btn" type="submit">Tạo mới</button>
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="panel-head">
            <h2>Danh sách sự kiện</h2>
            <span className="muted">{loading ? 'Đang tải...' : `${items.length} sự kiện`}</span>
        </div>
        <div className="table">
          <div className="table-row table-head events">
              <div>Mã</div>
              <div>Tên</div>
              <div>Loại</div>
              <div>Thưởng</div>
              <div>Lượt nhận</div>
              <div>Trạng thái</div>
            <div></div>
          </div>
          {items.map(item => (
            <div className="table-row events" key={item.id}>
              <div>#{item.id}</div>
              <div>{item.name}</div>
              <div>{item.type}</div>
              <div>{item.reward_amount} {item.reward_type === 'percent' ? '%' : 'Xu'}</div>
              <div>{item.stats?.claims || 0}</div>
                <div>{item.is_active ? 'Hoạt động' : 'Tạm dừng'}</div>
              <div className="row-actions">
                  <button className="link" onClick={() => toggleEvent(item)}>{item.is_active ? 'Tạm dừng' : 'Bật lại'}</button>
                  <button className="link danger" onClick={() => removeEvent(item.id)}>Xóa</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
