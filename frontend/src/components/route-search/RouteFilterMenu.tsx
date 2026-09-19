'use client';

import React, { useState, useRef, useEffect } from 'react';

interface RouteFilterMenuProps {
  sortBy: 'tercepat' | 'termurah' | 'minim_transit' | null;
  onSortChange: (sortBy: 'tercepat' | 'termurah' | 'minim_transit' | null) => void;
}

export function RouteFilterMenu({ sortBy, onSortChange }: RouteFilterMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSortSelect = (value: 'tercepat' | 'termurah' | 'minim_transit' | null) => {
    onSortChange(value);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
        aria-label="Filter"
      >
        <svg
          className="w-5 h-5 text-neutral-600"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 z-10">
          <div className="p-2">
            <button
              onClick={() => handleSortSelect(null)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${sortBy === null ? 'bg-primary-50 text-primary-600' : 'hover:bg-neutral-50 text-neutral-700'
                }`}
            >
              Default
            </button>
            <button
              onClick={() => handleSortSelect('tercepat')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${sortBy === 'tercepat' ? 'bg-primary-50 text-primary-600' : 'hover:bg-neutral-50 text-neutral-700'
                }`}
            >
              Tercepat
            </button>
            <button
              onClick={() => handleSortSelect('termurah')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${sortBy === 'termurah' ? 'bg-primary-50 text-primary-600' : 'hover:bg-neutral-50 text-neutral-700'
                }`}
            >
              Termurah
            </button>
            <button
              onClick={() => handleSortSelect('minim_transit')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${sortBy === 'minim_transit' ? 'bg-primary-50 text-primary-600' : 'hover:bg-neutral-50 text-neutral-700'
                }`}
            >
              Minim Transit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
