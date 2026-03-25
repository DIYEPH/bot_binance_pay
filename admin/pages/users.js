import { useEffect, useMemo, useState } from 'react';
import NavBar from '../components/NavBar';
import PageHeader from '../components/PageHeader';
import ErrorBanner from '../components/ErrorBanner';
import BotStatusBadge from '../components/BotStatusBadge';
import Pagination from '../components/Pagination';

const txTypeLabels = {
  deposit: 'Nạp tiền',
  purchase: 'Mua hàng',
  referral: 'Thưởng giới thiệu',
  admin_add: 'Cộng tay',
  refund: 'Hoàn tiền',
  event: 'Thưởng sự kiện'
};

export default function Users() {
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [orders, setOrders] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');
  const [detailError, setDetailError] = useState('');
  const [adjustForm, setAdjustForm] = useState({ action: 'add_balance', amount: '', note: '' });
  const [adjusting, setAdjusting] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [notifyMessage, setNotifyMessage] = useState('');
  const [notifying, setNotifying] = useState(false);
  const [notifyResult, setNotifyResult] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  async function load() {
    try {
      setLoading(true);
      const res = await fetch(`/api/users?page=${page}&limit=${limit}`);
      const data = await res.json();
      const rows = data.items || [];
      setItems(rows);
      setTotal(data.total || 0);
      if (rows.length && !selectedId) {
        setSelectedId(rows[0].id);
      }
    } catch (err) {
      setError(err.message || 'Lỗi');
    } finally {
      setLoading(false);
    }
  }

  async function loadDetail(userId) {
    if (!userId) return;
    try {
      setDetailLoading(true);
      setDetailError('');
      const res = await fetch(`/api/users?userId=${userId}`);
      const data = await res.json();
      setDetail(data.user);
      setOrders(data.orders || []);
      setTransactions(data.transactions || []);
    } catch (err) {
      setDetailError(err.message || 'Lỗi');
      setDetail(null);
      setOrders([]);
      setTransactions([]);
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [page]);

  useEffect(() => {
    if (selectedId) {
      loadDetail(selectedId);
    }
  }, [selectedId]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const name = `${item.first_name || ''} ${item.username || ''}`.toLowerCase();
      const idText = String(item.id || '');
      return name.includes(q) || idText.includes(q);
    });
  }, [items, query]);

  const allFilteredSelected = useMemo(() => {
    if (!filteredItems.length) return false;
    return filteredItems.every((item) => selectedIds.includes(item.id));
  }, [filteredItems, selectedIds]);

  function toggleSelected(id) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleSelectAllFiltered() {
    if (allFilteredSelected) {
      const filteredIds = new Set(filteredItems.map((item) => item.id));
      setSelectedIds((prev) => prev.filter((id) => !filteredIds.has(id)));
      return;
    }
    setSelectedIds((prev) => {
      const merged = new Set(prev);
      filteredItems.forEach((item) => merged.add(item.id));
      return Array.from(merged);
    });
  }

  async function sendNotification(targetIds) {
    if (!notifyMessage.trim() || !targetIds.length) return;
    setNotifying(true);
    setNotifyResult('');
    try {
      const res = await fetch('/api/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: notifyMessage, userIds: targetIds })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gửi thông báo thất bại');
      setNotifyResult(`Đã gửi: ${data.sent} / ${data.total} | Lỗi: ${data.failed}`);
      setNotifyMessage('');
    } catch (err) {
      setNotifyResult(err.message || 'Lỗi');
    } finally {
      setNotifying(false);
    }
  }

  async function submitAdjustment(e) {
    e.preventDefault();
    if (!selectedId) return;
    setAdjusting(true);
    try {
      await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedId,
          action: adjustForm.action,
          amount: Number(adjustForm.amount || 0),
          note: adjustForm.note || ''
        })
      });
      setAdjustForm({ ...adjustForm, amount: '', note: '' });
      await loadDetail(selectedId);
    } catch (err) {
      setDetailError(err.message || 'Lỗi');
    } finally {
      setAdjusting(false);
    }
  }

  return (
    <main className="page">
      <NavBar active="/users" />

      <PageHeader
        eyebrow="Khách hàng"
        title="Người dùng"
        subtitle="Xem thông tin và lịch sử mua hàng."
        right={<BotStatusBadge />}
      />

      <ErrorBanner message={error} />

      <section className="split">
        <div className="panel">
          <div className="panel-head">
            <h2>Danh sách người dùng</h2>
            <span className="muted">{loading ? 'Đang tải...' : `${total} người`}</span>
          </div>
          <div className="toolbar">
            <input
              className="input"
              placeholder="Tìm theo tên, username hoặc ID"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button className="btn secondary" type="button" onClick={toggleSelectAllFiltered}>
              {allFilteredSelected ? 'Bỏ chọn' : 'Chọn tất cả'}
            </button>
            <span className="muted">Đã chọn: {selectedIds.length}</span>
          </div>
          <div className="list">
            {filteredItems.map(item => (
              <div
                className={`list-item ${selectedId === item.id ? 'active' : ''}`}
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedId(item.id)}
                onKeyDown={e => e.key === 'Enter' && setSelectedId(item.id)}
              >
                <div className="list-title">
                  <span>
                    <input
                      type="checkbox"
                      className="checkbox-inline"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => toggleSelected(item.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    #{item.id} {item.first_name || item.username || 'Không rõ'}
                  </span>
                  <span className="pill">{item.order_count || 0} đơn</span>
                </div>
                <div className="list-meta">
                  <span className="muted">@{item.username || 'chưa có'}</span>
                  <span className="muted">{item.language || 'en'}</span>
                </div>
                <div className="list-meta">
                  <span className="muted">Số dư: {Number(item.balance || 0).toFixed(2)} USDT</span>
                  <span className="muted">Đã chi: {Number(item.total_spent || 0).toFixed(2)} USDT</span>
                </div>
              </div>
            ))}
          </div>
          <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>{detail ? `Người dùng #${detail.id}` : 'Chi tiết người dùng'}</h2>
            <span className="muted">{detailLoading ? 'Đang tải...' : `${orders.length} đơn`}</span>
          </div>

          <ErrorBanner message={detailError} />

          {!detail && !detailLoading && <p className="muted">Chọn một người dùng để xem đơn hàng.</p>}

          {detail && (
            <>
              <div className="panel">
                <div className="panel-head">
                  <h2>Gửi thông báo</h2>
                  <span className="muted">1 người hoặc nhóm đã chọn</span>
                </div>
                <div className="form">
                  <div className="field">
                    <label>Nội dung</label>
                    <textarea
                      className="textarea"
                      rows={4}
                      value={notifyMessage}
                      onChange={(e) => setNotifyMessage(e.target.value)}
                      placeholder="Nhập nội dung thông báo..."
                    />
                  </div>
                  <div className="actions">
                    <button
                      className="btn"
                      type="button"
                      disabled={notifying || !detail?.id || !notifyMessage.trim()}
                      onClick={() => sendNotification([detail.id])}
                    >
                      {notifying ? 'Đang gửi...' : 'Gửi cho người đang xem'}
                    </button>
                    <button
                      className="btn secondary"
                      type="button"
                      disabled={notifying || !selectedIds.length || !notifyMessage.trim()}
                      onClick={() => sendNotification(selectedIds)}
                    >
                      {notifying ? 'Đang gửi...' : `Gửi cho nhóm đã chọn (${selectedIds.length})`}
                    </button>
                  </div>
                  {notifyResult && <div className="notice">{notifyResult}</div>}
                </div>
              </div>

              <div className="detail">
                <div className="detail-row">
                  <span className="muted">Tên</span>
                  <span>{detail.first_name || 'Không rõ'}</span>
                </div>
                <div className="detail-row">
                  <span className="muted">Username</span>
                  <span>@{detail.username || 'chưa có'}</span>
                </div>
                <div className="detail-row">
                  <span className="muted">Ngôn ngữ</span>
                  <span>{detail.language || 'en'}</span>
                </div>
                <div className="detail-row">
                  <span className="muted">Số dư</span>
                  <span>{Number(detail.balance || 0).toFixed(2)} USDT</span>
                </div>
                <div className="detail-row">
                  <span className="muted">Xu</span>
                  <span>{Number(detail.credits || 0).toFixed(2)} Xu</span>
                </div>
                <div className="detail-row">
                  <span className="muted">Đã chi</span>
                  <span>{Number(detail.balance_spent || 0).toFixed(2)} USDT</span>
                </div>
              </div>

              <form className="panel" onSubmit={submitAdjustment}>
                <div className="panel-head">
                  <h2>Điều chỉnh ví</h2>
                  <span className="muted">Cộng tay số dư/xu</span>
                </div>
                <div className="form">
                  <div className="field">
                    <label>Hành động</label>
                    <select value={adjustForm.action} onChange={e => setAdjustForm({ ...adjustForm, action: e.target.value })}>
                      <option value="add_balance">Cộng số dư (USDT)</option>
                      <option value="add_credits">Cộng xu</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>Số lượng</label>
                    <input type="number" step="0.01" value={adjustForm.amount} onChange={e => setAdjustForm({ ...adjustForm, amount: e.target.value })} required />
                  </div>
                  <div className="field">
                    <label>Ghi chú</label>
                    <input value={adjustForm.note} onChange={e => setAdjustForm({ ...adjustForm, note: e.target.value })} placeholder="Ghi chú (tuỳ chọn)" />
                  </div>
                  <div className="actions">
                    <button className="btn" type="submit" disabled={adjusting}>{adjusting ? 'Đang lưu...' : 'Áp dụng'}</button>
                  </div>
                </div>
              </form>

              <div className="table">
                <div className="table-row table-head user-orders">
                  <div>Mã</div>
                  <div>Sản phẩm</div>
                  <div>SL</div>
                  <div>Số tiền</div>
                  <div>Trạng thái</div>
                  <div>Thời gian</div>
                </div>
                {orders.map(order => (
                  <div className="table-row user-orders" key={order.id}>
                    <div>#{order.id}</div>
                    <div>{order.product_name || '-'}</div>
                    <div>{order.quantity}</div>
                    <div>{Number(order.total_price || 0).toFixed(2)} USDT</div>
                    <div>{order.status}</div>
                    <div className="muted">{new Date(order.created_at).toLocaleString()}</div>
                  </div>
                ))}
              </div>

              <div className="table">
                <div className="table-row table-head user-transactions">
                  <div>Mã</div>
                  <div>Loại</div>
                  <div>Số tiền</div>
                  <div>Đơn vị</div>
                  <div>Ghi chú</div>
                  <div>Thời gian</div>
                </div>
                {transactions.map(tx => (
                  <div className="table-row user-transactions" key={tx.id}>
                    <div>#{tx.id}</div>
                    <div>{txTypeLabels[tx.type] || tx.type}</div>
                    <div>{Number(tx.amount || 0).toFixed(2)}</div>
                    <div>{tx.currency || 'USDT'}</div>
                    <div className="muted">{tx.note || '-'}</div>
                    <div className="muted">{new Date(tx.created_at).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
