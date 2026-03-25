import React, { useState, useRef, useEffect } from 'react';

interface Option {
  label: string;
  value: string;
  code?: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  placeholder?: string;
  searchPlaceholder?: string;
  onChange: (value: string, label: string) => void;
  onFreeType?: (text: string) => void;
}

export default function SearchableSelect({
  options,
  value,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  onChange,
  onFreeType,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);

  const selectedLabel = options.find(o => o.value === value)?.label ?? (value || '');

  const filtered = query
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()) || (o.code && o.code.toLowerCase().includes(query.toLowerCase())))
    : options;

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const handleOpen = () => {
    setOpen(o => !o);
    setQuery('');
  };

  const handleSelect = (opt: Option) => {
    onChange(opt.value, opt.label);
    setOpen(false);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    onFreeType?.(e.target.value);
  };

  return (
    <div className="searchable-select" ref={wrapRef}>
      <div className={`ss-display${open ? ' open' : ''}`} onClick={handleOpen}>
        <span className={`ss-value${!selectedLabel ? ' placeholder' : ''}`}>
          {selectedLabel || placeholder}
        </span>
        <svg viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ width: 10, flexShrink: 0 }}>
          <path d="M1 1l4 4 4-4"/>
        </svg>
      </div>
      {open && (
        <div className="ss-dropdown">
          <input
            className="ss-search"
            placeholder={searchPlaceholder}
            value={query}
            onChange={handleSearch}
            onClick={e => e.stopPropagation()}
            autoFocus
          />
          <div className="ss-list">
            {filtered.length === 0 ? (
              <div className="ss-empty">No results</div>
            ) : (
              filtered.map(opt => (
                <div
                  key={opt.value}
                  className={`ss-item${opt.value === value ? ' selected' : ''}`}
                  onClick={() => handleSelect(opt)}
                >
                  {opt.label}
                  {opt.code && <span className="ss-item-code">{opt.code}</span>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
