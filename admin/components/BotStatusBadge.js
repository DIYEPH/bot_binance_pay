import { memo, useEffect, useState } from 'react';

function BotStatusBadge() {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    let active = true;
    let socket;
    let reconnectTimer;

    function connect() {
      if (!active) return;
      const fallbackUrl = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.hostname}:3001`;
      const wsUrl = process.env.NEXT_PUBLIC_BOT_WS_URL || fallbackUrl;

      socket = new WebSocket(wsUrl);

      socket.addEventListener('open', () => {
        if (active) setStatus('online');
      });

      socket.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          if (active && data?.type === 'status') {
            setStatus(data.status || 'online');
          }
        } catch (err) {
          if (active) setStatus('online');
        }
      });

      socket.addEventListener('close', () => {
        if (active) setStatus('offline');
        reconnectTimer = setTimeout(connect, 3000);
      });

      socket.addEventListener('error', () => {
        if (active) setStatus('offline');
      });
    }

    connect();

    return () => {
      active = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (socket && socket.readyState <= 1) socket.close();
    };
  }, []);

  return (
    <div className={`badge status ${status}`}>
      {status === 'online' ? 'Bot đang chạy' : status === 'checking' ? 'Đang kiểm tra' : 'Bot không hoạt động'}
    </div>
  );
}

export default memo(BotStatusBadge);
