"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface SharedNote {
  title: string;
  content: string;
  tags: string[];
  updatedAt: string;
  viewCount: number;
}

interface Props {
  note: SharedNote | null;
  shareId: string;
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 30) return `${diffDays} days ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

export default function SharedNoteClient({ note }: Props) {
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  if (!note) {
    return (
      <>
        <style>{styles}</style>
        <div className="sp-notfound">
          <div className="sp-notfound-box">
            <div className="sp-notfound-glyph">∅</div>
            <h1 className="sp-notfound-h">Note not found</h1>
            <p className="sp-notfound-p">
              This note doesn&apos;t exist or is no longer public.
            </p>
            <Link href="/" className="sp-notfound-cta">
              Go to Peblo Notes →
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className={`sp-root${visible ? " sp-visible" : ""}`}>

        {/* ── Sticky header ── */}
        <header className="sp-header">
          <div className="sp-header-inner">
            <span className="sp-header-eyebrow">Shared note</span>
            <div className="sp-header-actions">
              <button
                id="sp-copy-btn"
                className={`sp-copy-btn${copied ? " sp-copy-btn--done" : ""}`}
                onClick={handleCopy}
                title="Copy link"
              >
                <span className="sp-copy-icon">{copied ? "✓" : "⎘"}</span>
                <span>{copied ? "Copied!" : "Copy link"}</span>
              </button>
              <Link href="/" className="sp-badge">
                <span className="sp-badge-pulse" />
                Peblo Notes
              </Link>
            </div>
          </div>
        </header>

        {/* ── Article ── */}
        <main className="sp-main">
          <article className="sp-article">

            {/* Tags */}
            {note.tags && note.tags.length > 0 && (
              <div className="sp-tags">
                {note.tags.map((tag) => (
                  <span key={tag} className="sp-tag">{tag}</span>
                ))}
              </div>
            )}

            {/* Title */}
            <h1 className="sp-title">{note.title || "Untitled Note"}</h1>

            {/* Meta row */}
            <div className="sp-meta">
              {note.updatedAt && (
                <>
                  <span className="sp-meta-item">
                    Last updated {timeAgo(note.updatedAt)}
                  </span>
                  <span className="sp-meta-dot">·</span>
                </>
              )}
              <span className="sp-meta-item sp-views">
                <span className="sp-views-pip" />
                {note.viewCount.toLocaleString()} view{note.viewCount !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Rule */}
            <div className="sp-rule" />

            {/* Body */}
            <div
              className="sp-body"
              dangerouslySetInnerHTML={{ __html: note.content }}
            />
          </article>
        </main>

        {/* ── Footer ── */}
        <footer className="sp-footer">
          <div className="sp-footer-inner">
            <p className="sp-footer-copy">
              Written with{" "}
              <Link href="/" className="sp-footer-brand">Peblo Notes</Link>
              {" "}— your intelligent note-taking workspace.
            </p>
            <Link href="/register" className="sp-footer-cta">
              Start writing for free →
            </Link>
          </div>
        </footer>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@400;500;600&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

/* Paper-texture background */
.sp-root {
  min-height: 100vh;
  font-family: 'Inter', -apple-system, sans-serif;
  color: #1a1a1a;
  background-color: #f9f8f5;
  background-image:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.032'/%3E%3C/svg%3E");
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.55s ease, transform 0.55s ease;
}
.sp-visible { opacity: 1; transform: translateY(0); }

/* Header */
.sp-header {
  position: sticky; top: 0; z-index: 50;
  background: rgba(249,248,245,0.88);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid rgba(0,0,0,0.07);
}
.sp-header-inner {
  max-width: 48rem; margin: 0 auto;
  padding: 0.8rem 1.5rem;
  display: flex; align-items: center; justify-content: space-between; gap: 1rem;
}
.sp-header-eyebrow {
  font-size: 0.7rem; font-weight: 600;
  letter-spacing: 0.1em; text-transform: uppercase; color: #aaa;
}
.sp-header-actions { display: flex; align-items: center; gap: 0.65rem; }

/* Copy button */
.sp-copy-btn {
  display: flex; align-items: center; gap: 0.35rem;
  font-family: 'Inter', sans-serif; font-size: 0.78rem; font-weight: 500;
  color: #555; background: transparent;
  border: 1px solid rgba(0,0,0,0.13); border-radius: 9999px;
  padding: 0.32rem 0.8rem; cursor: pointer;
  transition: background 0.18s, border-color 0.18s, color 0.18s;
}
.sp-copy-btn:hover { background: rgba(0,0,0,0.04); border-color: rgba(0,0,0,0.22); }
.sp-copy-btn--done { color: #15803d; border-color: #86efac; background: #f0fdf4; }
.sp-copy-icon { font-size: 0.9rem; }

/* Badge */
.sp-badge {
  display: flex; align-items: center; gap: 0.4rem;
  font-size: 0.75rem; font-weight: 700; letter-spacing: 0.02em;
  text-decoration: none; color: #fff;
  background: linear-gradient(135deg, #18181b 0%, #3f3f46 100%);
  padding: 0.32rem 0.85rem; border-radius: 9999px;
  transition: opacity 0.18s;
}
.sp-badge:hover { opacity: 0.82; }
.sp-badge-pulse {
  width: 6px; height: 6px; border-radius: 50%;
  background: #4ade80; box-shadow: 0 0 6px #4ade80;
  animation: sp-pulse 2.4s infinite;
}
@keyframes sp-pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }

/* Main */
.sp-main {
  max-width: 48rem; margin: 0 auto;
  padding: 3.5rem 1.5rem 6rem;
}

/* Tags */
.sp-tags { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 1.4rem; }
.sp-tag {
  font-size: 0.68rem; font-weight: 700;
  letter-spacing: 0.09em; text-transform: uppercase;
  color: #666; background: rgba(0,0,0,0.065);
  border-radius: 4px; padding: 0.18rem 0.55rem;
}

/* Title */
.sp-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: clamp(2rem, 5vw, 3.1rem);
  font-weight: 700; line-height: 1.18; letter-spacing: -0.025em;
  color: #0f0f0f; margin-bottom: 1rem;
}

/* Meta */
.sp-meta { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 2.25rem; }
.sp-meta-item { font-size: 0.8rem; color: #999; }
.sp-meta-dot { color: #d4d4d4; }
.sp-views { display: flex; align-items: center; gap: 0.35rem; }
.sp-views-pip {
  width: 5px; height: 5px; border-radius: 50%;
  background: #c4b5a5; display: inline-block;
}

/* Decorative rule */
.sp-rule {
  height: 1px; margin-bottom: 2.75rem;
  background: linear-gradient(to right, transparent, rgba(0,0,0,0.12) 25%, rgba(0,0,0,0.12) 75%, transparent);
}

/* Prose body */
.sp-body {
  font-family: 'Inter', Georgia, serif;
  font-size: 1.07rem; line-height: 1.88; color: #2c2c2c;
}
.sp-body h1,.sp-body h2,.sp-body h3,.sp-body h4 {
  font-family: 'Playfair Display', Georgia, serif;
  font-weight: 700; color: #111;
  margin-top: 2.2em; margin-bottom: 0.55em; line-height: 1.22;
}
.sp-body h1 { font-size: 1.75rem; }
.sp-body h2 { font-size: 1.42rem; }
.sp-body h3 { font-size: 1.18rem; }
.sp-body p { margin-bottom: 1.3em; }
.sp-body ul,.sp-body ol { padding-left: 1.6rem; margin-bottom: 1.3em; }
.sp-body li { margin-bottom: 0.45em; }
.sp-body blockquote {
  border-left: 3px solid #d1c9be;
  padding-left: 1.3rem; margin: 1.6em 0;
  color: #666; font-style: italic;
}
.sp-body code {
  font-family: 'Fira Code', 'Courier New', monospace;
  font-size: 0.875em;
  background: rgba(0,0,0,0.055); padding: 0.15em 0.42em;
  border-radius: 4px; color: #c7254e;
}
.sp-body pre {
  background: #1c1c2b; color: #d4d4f4;
  border-radius: 10px; padding: 1.2rem 1.5rem;
  overflow-x: auto; margin-bottom: 1.6em;
  font-size: 0.875rem; line-height: 1.65;
}
.sp-body pre code { background: none; color: inherit; padding: 0; }
.sp-body a { color: #18181b; text-decoration: underline; text-underline-offset: 3px; }
.sp-body a:hover { color: #52525b; }
.sp-body img { max-width: 100%; border-radius: 8px; margin: 1.6em 0; }
.sp-body strong { font-weight: 600; color: #111; }
.sp-body hr { border: none; border-top: 1px solid rgba(0,0,0,0.1); margin: 2.2em 0; }

/* Footer */
.sp-footer { border-top: 1px solid rgba(0,0,0,0.07); background: rgba(0,0,0,0.018); }
.sp-footer-inner {
  max-width: 48rem; margin: 0 auto; padding: 2.5rem 1.5rem;
  display: flex; flex-direction: column; align-items: center; gap: 1.1rem; text-align: center;
}
.sp-footer-copy { font-size: 0.86rem; color: #999; }
.sp-footer-brand { color: #555; font-weight: 500; text-decoration: underline; text-underline-offset: 2px; }
.sp-footer-cta {
  display: inline-block; font-size: 0.8rem; font-weight: 600; letter-spacing: 0.04em;
  color: #fff; background: #18181b;
  padding: 0.5rem 1.3rem; border-radius: 9999px; text-decoration: none;
  transition: opacity 0.18s;
}
.sp-footer-cta:hover { opacity: 0.78; }

/* Not-found */
.sp-notfound {
  min-height: 100vh; background: #f9f8f5;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Inter', sans-serif;
}
.sp-notfound-box { text-align: center; padding: 2.5rem 1.5rem; }
.sp-notfound-glyph { font-size: 3.5rem; color: #ccc; margin-bottom: 1rem; }
.sp-notfound-h {
  font-family: 'Playfair Display', serif; font-size: 2rem; color: #111; margin-bottom: 0.5rem;
}
.sp-notfound-p { font-size: 0.9rem; color: #888; margin-bottom: 1.5rem; }
.sp-notfound-cta {
  font-size: 0.88rem; font-weight: 600; color: #18181b;
  text-decoration: underline; text-underline-offset: 3px;
}

/* Print */
@media print {
  .sp-header,.sp-footer { display: none; }
  .sp-root { background: #fff; }
  .sp-main { padding: 0; }
  .sp-body pre { background: #f5f5f5; color: #333; }
}

/* Mobile */
@media (max-width: 640px) {
  .sp-header-inner { padding: 0.6rem 1rem; }
  .sp-main { padding: 2rem 1rem 4rem; }
  .sp-copy-btn span:last-child { display: none; }
  .sp-footer-inner { padding: 2rem 1rem; }
}
`;
