import { useEffect, useState } from 'react';
import NavBar from '../components/NavBar';
import PageHeader from '../components/PageHeader';
import ErrorBanner from '../components/ErrorBanner';
import BotStatusBadge from '../components/BotStatusBadge';
import Pagination from '../components/Pagination';

const statusOptions = ['pending', 'completed', 'cancelled', 'expired'];
const statusLabels = {
  pending: 'Đang chờ',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
  expired: 'Hết hạn'
};

export default function Orders() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  async function load() {
    try {
      setLoading(true);
      const res = await fetch(`/api/orders?page=${page}&limit=${limit}`);
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message || 'Lỗi');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [page]);

  async function updateStatus(id, status) {
    await fetch('/api/orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status })
    });
    await load();
  }

  return (
    <main className="page">
      <NavBar active="/orders" />

      <PageHeader
        eyebrow="Bán hàng"
        title="Đơn hàng"
        subtitle="Xem và cập nhật trạng thái đơn."
        right={<BotStatusBadge />}
      />

      <ErrorBanner message={error} />

      <section className="panel">
        <div className="panel-head">
            <h2>Đơn hàng gần đây</h2>
            <span className="muted">{loading ? 'Đang tải...' : `${total} đơn`}</span>
        </div>
        <div className="table">
          <div className="table-row table-head">
              <div>Mã</div>
              <div>Người mua</div>
              <div>Sản phẩm</div>
              <div>Số tiền</div>
              <div>Trạng thái</div>
              <div>Cập nhật</div>
          </div>
          {items.map(item => (
            <div className="table-row" key={item.id}>
              <div>#{item.id}</div>
              <div>{item.first_name || item.username || item.user_id}</div>
              <div>{item.product_name || '-'}</div>
              <div>{item.total_price} USDT</div>
              <div>
                <select value={item.status} onChange={e => updateStatus(item.id, e.target.value)}>
                  {statusOptions.map(status => (
                    <option key={status} value={status}>{statusLabels[status] || status}</option>
                  ))}
                </select>
              </div>
              <div className="muted">{new Date(item.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
        <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
      </section>
    </main>
  );
}
