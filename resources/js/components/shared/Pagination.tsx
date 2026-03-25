import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  perPage: number;
  onPageChange: (p: number) => void;
  infoText?: string;
}

export default function Pagination({ currentPage, totalItems, perPage, onPageChange, infoText }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(totalItems / perPage));
  const start = totalItems === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const end = Math.min(currentPage * perPage, totalItems);
  const info = infoText ?? (totalItems === 0 ? 'No results' : `Showing ${start}–${end} of ${totalItems}`);

  const btns: React.ReactNode[] = [];
  btns.push(
    <button key="prev" className="pag-btn" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
      <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M7 2L3 6l4 4"/></svg>
    </button>
  );
  for (let p = 1; p <= pages; p++) {
    if (pages > 7 && p > 2 && p < pages - 1 && Math.abs(p - currentPage) > 1) {
      if (p === 3 || p === pages - 2) btns.push(<button key={`ellipsis-${p}`} className="pag-btn" disabled style={{ opacity: 0.4 }}>…</button>);
      continue;
    }
    btns.push(
      <button key={p} className={`pag-btn${p === currentPage ? ' active' : ''}`} onClick={() => onPageChange(p)}>{p}</button>
    );
  }
  btns.push(
    <button key="next" className="pag-btn" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === pages}>
      <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M5 2l4 4-4 4"/></svg>
    </button>
  );

  return (
    <div className="sh-pagination">
      <span>{info}</span>
      <div className="pag-btns">{btns}</div>
    </div>
  );
}
