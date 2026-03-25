import { useEffect, useState } from 'react';
import NavBar from '../components/NavBar';
import PageHeader from '../components/PageHeader';
import ErrorBanner from '../components/ErrorBanner';
import BotStatusBadge from '../components/BotStatusBadge';
import Pagination from '../components/Pagination';

const statusOptions = ['pending', 'confirmed', 'cancelled', 'expired'];
const statusLabels = {
  pending: 'Đang chờ',
  confirmed: 'Đã xác nhận',
  cancelled: 'Đã hủy',
  expired: 'Hết hạn'
};

export default function Deposits() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  async function load() {
    try {
      setLoading(true);
      const res = await fetch(`/api/deposits?page=${page}&limit=${limit}`);
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
    await fetch('/api/deposits', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status })
    });
    await load();
  }

  return (
    <main className="page">
      <NavBar active="/deposits" />

      <PageHeader
        eyebrow="Thanh toán"
        title="Yêu cầu nạp tiền"
        subtitle="Theo dõi yêu cầu nạp và trạng thái."
        right={<BotStatusBadge />}
      />

      <ErrorBanner message={error} />

      <section className="panel">
        <div className="panel-head">
            <h2>Nạp tiền gần đây</h2>
            <span className="muted">{loading ? 'Đang tải...' : `${total} yêu cầu`}</span>
        </div>
        <div className="table">
          <div className="table-row table-head deposits">
              <div>Mã</div>
              <div>Người nạp</div>
              <div>Số tiền</div>
              <div>Phương thức</div>
              <div>Mã nạp</div>
              <div>Trạng thái</div>
              <div>Thời gian</div>
          </div>
          {items.map(item => (
            <div className="table-row deposits" key={item.id}>
              <div>#{item.id}</div>
              <div>{item.first_name || item.username || item.user_id}</div>
              <div>{Number(item.amount || 0).toFixed(2)} {item.currency || 'USDT'}</div>
              <div>{item.payment_method}</div>
              <div className="mono">{item.payment_code}</div>
              <div>
                    {statusLabels[item.status] || item.status}
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
