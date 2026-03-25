import { memo, useMemo } from 'react';

function Pagination({ page, total, limit, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const pages = useMemo(() => {
    const windowSize = 5;
    const half = Math.floor(windowSize / 2);
    let start = Math.max(1, page - half);
    let end = Math.min(totalPages, start + windowSize - 1);
    if (end - start < windowSize - 1) {
      start = Math.max(1, end - windowSize + 1);
    }
    const list = [];
    for (let i = start; i <= end; i += 1) list.push(i);
    return list;
  }, [page, totalPages]);

  return (
    <div className="pagination">
      <button className="page-btn" type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        Trước
      </button>
      {pages.map((p) => (
        <button
          key={p}
          className={`page-btn ${p === page ? 'active' : ''}`}
          type="button"
          onClick={() => onPageChange(p)}
        >
          {p}
        </button>
      ))}
      <button className="page-btn" type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
        Sau
      </button>
      <span className="muted">Trang {page} / {totalPages}</span>
    </div>
  );
}

export default memo(Pagination);
