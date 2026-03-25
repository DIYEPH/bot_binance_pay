import { useEffect, useState } from 'react';
import NavBar from '../components/NavBar';
import PageHeader from '../components/PageHeader';
import ErrorBanner from '../components/ErrorBanner';
import BotStatusBadge from '../components/BotStatusBadge';

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [stock, setStock] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [stockLoading, setStockLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadProducts() {
    try {
      setLoading(true);
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);
      if (data.length && !selectedId) setSelectedId(data[0].id);
    } catch (err) {
      setError(err.message || 'Lỗi');
    } finally {
      setLoading(false);
    }
  }

  async function loadStock(productId) {
    if (!productId) return;
    try {
      setStockLoading(true);
      const res = await fetch(`/api/stock?productId=${productId}`);
      const data = await res.json();
      setStock(data);
    } catch (err) {
      setError(err.message || 'Lỗi');
    } finally {
      setStockLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (selectedId) loadStock(selectedId);
  }, [selectedId]);

  async function addStock(e) {
    e.preventDefault();
    if (!selectedId || !text.trim()) return;
    const accounts = text.split('\n').map(line => line.trim()).filter(Boolean);
    await fetch('/api/stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: selectedId, accounts })
    });
    setText('');
    await loadStock(selectedId);
  }

  async function deleteStock(id) {
    await fetch('/api/stock', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stockId: id })
    });
    await loadStock(selectedId);
  }

  async function clearStock() {
    if (!selectedId) return;
    if (!confirm('Xóa hàng chưa bán?')) return;
    await fetch('/api/stock', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'clear', productId: selectedId })
    });
    await loadStock(selectedId);
  }

  const selectedProduct = products.find(p => p.id === selectedId);

  return (
    <main className="page">
      <NavBar active="/inventory" />

      <PageHeader
        eyebrow="Kho hàng"
        title="Quản lý kho"
        subtitle="Thêm tồn kho và kiểm tra hàng đã bán."
        right={<BotStatusBadge />}
      />

      <ErrorBanner message={error} />

      <section className="split">
        <div className="panel">
          <div className="panel-head">
            <h2>Sản phẩm</h2>
            <span className="muted">{loading ? 'Đang tải...' : `${products.length} mục`}</span>
          </div>
          <div className="list">
            {products.map(p => (
              <div
                key={p.id}
                className={`list-item ${selectedId === p.id ? 'active' : ''}`}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedId(p.id)}
                onKeyDown={e => e.key === 'Enter' && setSelectedId(p.id)}
              >
                <div className="list-title">
                  <span>#{p.id} {p.name}</span>
                  <span className="pill">{p.stock_count || 0} tồn kho</span>
                </div>
                <div className="list-meta">
                  <span className="muted">{Number(p.price || 0).toFixed(2)} USDT</span>
                  <span className={p.is_active ? 'status active' : 'status'}>{p.is_active ? 'Hiển thị' : 'Ẩn'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>{selectedProduct ? selectedProduct.name : 'Kho'}</h2>
            <span className="muted">{stockLoading ? 'Đang tải...' : `${stock.length} mục`}</span>
          </div>

          {!selectedProduct && <p className="muted">Chọn sản phẩm để quản lý kho.</p>}

          {selectedProduct && (
            <>
              <form className="form" onSubmit={addStock}>
                <div className="field">
                  <label>Thêm tồn kho (mỗi dòng một item)</label>
                  <textarea
                    className="textarea"
                    rows={6}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder="email|password|note"
                  />
                </div>
                <div className="actions">
                  <button className="btn" type="submit">Thêm kho</button>
                  <button className="btn secondary" type="button" onClick={clearStock}>Xóa hàng chưa bán</button>
                </div>
              </form>

              <div className="table">
                <div className="table-row table-head stock">
                  <div>Mã</div>
                  <div>Dữ liệu</div>
                  <div>Trạng thái</div>
                  <div>Người mua</div>
                  <div>Thời gian bán</div>
                  <div></div>
                </div>
                {stock.map(item => (
                  <div className="table-row stock" key={item.id}>
                    <div>#{item.id}</div>
                    <div className="mono">{item.account_data}</div>
                    <div>{item.is_sold ? 'Đã bán' : 'Còn hàng'}</div>
                    <div>{item.buyer_id || '-'}</div>
                    <div className="muted">{item.sold_at ? new Date(item.sold_at).toLocaleString() : '-'}</div>
                    <div className="row-actions">
                      {!item.is_sold && (
                        <button className="link danger" onClick={() => deleteStock(item.id)}>Xóa</button>
                      )}
                    </div>
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
