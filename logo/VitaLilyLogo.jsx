/**
 * VitaLilyLogo — React component
 *
 * Props:
 *   size      "large" | "medium" | "small"   default: "medium"
 *   context   "dark" | "light" | "white" | "mono-white"   default: "dark"
 *   subtitle  string | false   custom subtitle text, pass false to hide
 *   href      string | undefined   wraps logo in <a> when provided
 *   className string   extra classes
 *
 * Usage:
 *   <VitaLilyLogo size="large" context="dark" subtitle="Healthcare Dashboard" />
 *   <VitaLilyLogo size="medium" context="light" />
 *   <VitaLilyLogo size="small" />
 *
 * CSS file must be imported separately:
 *   import './vitalily-logo.css';
 *
 * Google Font must be loaded in index.html or _document.jsx:
 *   <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&display=swap" rel="stylesheet">
 */

import React from 'react';

/* ── Inline SVG icon mark ──────────────────────────────────────
   40×40 viewBox · stroke-width 1.5 · currentColor
   6 ellipse petals at 60° increments + stamen + ring
   ─────────────────────────────────────────────────────────── */
function LilyIcon({ className = '', style = {} }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 40 40"
      width="100%"
      height="100%"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={style}
    >
      {/* 6 petals — ellipses rotated 60° apart around center (20,20) */}
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <ellipse
          key={deg}
          cx="20"
          cy="13.2"
          rx="2.0"
          ry="6.8"
          fill="currentColor"
          fillOpacity="0.10"
          transform={`rotate(${deg} 20 20)`}
        />
      ))}

      {/* Stamen — filled center dot */}
      <circle cx="20" cy="20" r="2.2" fill="currentColor" fillOpacity="0.55" stroke="none" />

      {/* Inner ring — subtle separation between stamen and petals */}
      <circle cx="20" cy="20" r="3.6" fill="none" stroke="currentColor" strokeOpacity="0.35" strokeWidth="0.9" />
    </svg>
  );
}

/* ── Logo component ─────────────────────────────────────────── */
export default function VitaLilyLogo({
  size = 'medium',
  context = 'dark',
  subtitle,
  href,
  className = '',
  ...rest
}) {
  // Resolve subtitle text
  const defaultSubtitles = {
    large: 'Healthcare Dashboard',
    medium: 'Healthcare',
    small: false,
  };
  const subtitleText = subtitle === undefined ? defaultSubtitles[size] : subtitle;

  // Build CSS class list
  const contextClass = {
    dark:       '',
    light:      'logo--on-light',
    white:      'logo--on-white',
    'mono-white': 'logo--mono-white',
  }[context] ?? '';

  const classes = [
    'logo',
    `logo-${size}`,
    contextClass,
    className,
  ].filter(Boolean).join(' ');

  const inner = (
    <>
      <div className="logo__icon">
        <LilyIcon />
      </div>
      {size !== 'small' && (
        <div className="logo__text">
          <span className="logo__wordmark">VitaLily</span>
          {subtitleText && (
            <span className="logo__subtitle">{subtitleText}</span>
          )}
        </div>
      )}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className={classes}
        aria-label="VitaLily — 機構健康資料看板"
        {...rest}
      >
        {inner}
      </a>
    );
  }

  return (
    <div
      className={classes}
      aria-label="VitaLily"
      role="img"
      {...rest}
    >
      {inner}
    </div>
  );
}
