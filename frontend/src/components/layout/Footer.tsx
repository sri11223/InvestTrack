import React from 'react';

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] mt-8">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[var(--text-muted)]">
            InvestTrack &copy; {new Date().getFullYear()} &mdash; Portfolio Dashboard
          </p>
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-[var(--text-muted)]">
              Data sources: Yahoo Finance (CMP) &bull; Google Finance (P/E, Earnings)
            </span>
          </div>
          <p className="text-[10px] text-[var(--text-muted)]">
            Disclaimer: Data may be delayed or inaccurate. Not financial advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
