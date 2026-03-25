import { useEffect, useState } from 'react';
import NavBar from '../components/NavBar';
import PageHeader from '../components/PageHeader';
import ErrorBanner from '../components/ErrorBanner';
import BotStatusBadge from '../components/BotStatusBadge';

const emptyStats = {
  users: 0,
  categories: 0,
  products: 0,
  orders: 0,
  revenue: 0,
  daily: { labels: [], totals: [] },
  weekly: { labels: [], totals: [] },
  topProducts: [],
  latestOrders: []
};

const orderStatusLabels = {
  pending: 'Đang chờ',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
  expired: 'Hết hạn'
};

export default function Home() {
  const [stats, setStats] = useState(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch('/api/stats');
        if (!res.ok) throw new Error('Failed to load stats');
        const data = await res.json();
        if (active) setStats(data);
      } catch (err) {
        if (active) setError(err.message || 'Lỗi');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);


  return (
    <main className="page">
      <NavBar active="/" />

      <PageHeader
        eyebrow="Bảng quản trị"
        title="Tổng quan"
        subtitle="Doanh thu, đơn hàng và tình trạng kho."
        right={<BotStatusBadge />}
      />

      <ErrorBanner message={error} />

      <section className="grid">
        <StatCard label="Người dùng" value={stats.users} loading={loading} />
        <StatCard label="Danh mục" value={stats.categories} loading={loading} />
        <StatCard label="Sản phẩm" value={stats.products} loading={loading} />
        <StatCard label="Đơn hàng" value={stats.orders} loading={loading} />
        <StatCard label="Doanh thu (USDT)" value={stats.revenue} loading={loading} />
      </section>

      <section className="panel-grid">
        <div className="panel">
          <div className="panel-head">
            <h2>Doanh thu theo ngày</h2>
            <span className="muted">7 ngày gần nhất</span>
          </div>
          <MiniChart labels={stats.daily.labels} data={stats.daily.totals} />
        </div>
        <div className="panel">
          <div className="panel-head">
            <h2>Doanh thu theo tuần</h2>
            <span className="muted">4 tuần gần nhất</span>
          </div>
          <MiniChart labels={stats.weekly.labels} data={stats.weekly.totals} />
        </div>
      </section>

      <section className="panel-grid">
        <div className="panel">
          <div className="panel-head">
            <h2>Sản phẩm top</h2>
            <span className="muted">Theo doanh thu</span>
          </div>
          <div className="table">
            <div className="table-row table-head">
              <div>Sản phẩm</div>
              <div>Số lượng</div>
              <div>Doanh thu</div>
            </div>
            {stats.topProducts.map(item => (
              <div className="table-row" key={item.id}>
                <div>{item.name}</div>
                <div>{item.qty}</div>
                <div>{Number(item.revenue || 0).toFixed(2)} USDT</div>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="panel-head">
            <h2>Đơn hàng mới nhất</h2>
            <span className="muted">10 đơn gần nhất</span>
          </div>
          <div className="table">
            <div className="table-row table-head">
              <div>Mã</div>
              <div>Người mua</div>
              <div>Sản phẩm</div>
              <div>Số tiền</div>
              <div>Trạng thái</div>
            </div>
            {stats.latestOrders.map(item => (
              <div className="table-row" key={item.id}>
                <div>#{item.id}</div>
                <div>{item.first_name || item.username || item.id}</div>
                <div>{item.product_name || '-'}</div>
                <div>{Number(item.total_price || 0).toFixed(2)} USDT</div>
                <div>{orderStatusLabels[item.status] || item.status}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function StatCard({ label, value, loading }) {
  return (
    <div className="card">
      <div className="card-label">{label}</div>
      <div className="card-value">{loading ? '...' : value}</div>
    </div>
  );
}

function MiniChart({ labels, data }) {
  const max = Math.max(1, ...data);
  return (
    <div className="chart">
      {data.map((value, idx) => (
        <div className="chart-bar" key={labels[idx] || idx}>
          <div className="bar" style={{ height: `${(value / max) * 100}%` }} />
          <span>{value.toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}
