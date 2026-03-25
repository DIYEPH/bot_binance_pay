import { useState } from 'react';
import NavBar from '../components/NavBar';
import PageHeader from '../components/PageHeader';
import ErrorBanner from '../components/ErrorBanner';
import BotStatusBadge from '../components/BotStatusBadge';

export default function Broadcast() {
  const [message, setMessage] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function sendBroadcast(e) {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch('/api/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gửi thông báo thất bại');
      setResult(data);
      setMessage('');
    } catch (err) {
      setError(err.message || 'Lỗi');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <NavBar active="/broadcast" />

      <PageHeader
        eyebrow="Thông báo"
        title="Gửi thông báo"
        subtitle="Gửi tin nhắn đến tất cả người dùng."
        right={<BotStatusBadge />}
      />

      <ErrorBanner message={error} />

      <section className="panel">
        <h2>Tạo thông báo</h2>
        <form className="form" onSubmit={sendBroadcast}>
          <div className="field">
            <label>Nội dung</label>
            <textarea
              className="textarea"
              rows={6}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Nhập nội dung thông báo..."
              required
            />
          </div>
          <div className="actions">
            <button className="btn" type="submit" disabled={loading}>{loading ? 'Đang gửi...' : 'Gửi ngay'}</button>
          </div>
        </form>
        {result && (
          <div className="notice">
            Đã gửi: {result.sent} / {result.total} | Lỗi: {result.failed}
          </div>
        )}
      </section>
    </main>
  );
}
