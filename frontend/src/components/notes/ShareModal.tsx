"use client";

import React, { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  X,
  Link2,
  Check,
  Twitter,
  MessageCircle,
  Eye,
  Trash2,
  Share2,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { useShare } from "@/hooks/useShare";

interface Props {
  noteId: string;
  noteTitle?: string;
  /** Pass null if note is not currently shared */
  initialShareUrl?: string | null;
  initialViewCount?: number;
  isOpen: boolean;
  onClose: () => void;
  /** Called with the new shareUrl (or null on revoke) */
  onShareChange?: (shareUrl: string | null) => void;
}

export function ShareModal({
  noteId,
  noteTitle = "Note",
  initialShareUrl,
  initialViewCount = 0,
  isOpen,
  onClose,
  onShareChange,
}: Props) {
  const { generateShareLink, revokeShare, isSharing } = useShare();

  const [shareUrl, setShareUrl] = useState<string | null>(
    initialShareUrl ?? null
  );
  const [viewCount, setViewCount] = useState(initialViewCount);
  const [copied, setCopied] = useState(false);
  const [showRevoke, setShowRevoke] = useState(false);
  const [mounted, setMounted] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Animate-in
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => setMounted(true), 12);
      return () => clearTimeout(t);
    }
    setMounted(false);
    setShowRevoke(false);
  }, [isOpen]);

  // Sync external prop changes
  useEffect(() => {
    setShareUrl(initialShareUrl ?? null);
    setViewCount(initialViewCount);
  }, [initialShareUrl, initialViewCount]);

  if (!isOpen) return null;

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    try {
      const res = await generateShareLink(noteId);
      setShareUrl(res.shareUrl);
      onShareChange?.(res.shareUrl);
    } catch {
      /* error surfaced by hook */
    }
  };

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleRevoke = async () => {
    try {
      await revokeShare(noteId);
      setShareUrl(null);
      setViewCount(0);
      setShowRevoke(false);
      onShareChange?.(null);
    } catch {
      /* error surfaced by hook */
    }
  };

  const openTwitter = () => {
    if (!shareUrl) return;
    const t = encodeURIComponent(`Check out: "${noteTitle}"`);
    const u = encodeURIComponent(shareUrl);
    window.open(`https://twitter.com/intent/tweet?text=${t}&url=${u}`, "_blank");
  };

  const openWhatsApp = () => {
    if (!shareUrl) return;
    const t = encodeURIComponent(`"${noteTitle}" — ${shareUrl}`);
    window.open(`https://wa.me/?text=${t}`, "_blank");
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(5px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        opacity: mounted ? 1 : 0,
        transition: "opacity 0.22s ease",
      }}
    >
      <style>{css}</style>

      <div
        className="sm-panel"
        style={{
          transform: mounted
            ? "translateY(0) scale(1)"
            : "translateY(18px) scale(0.96)",
          opacity: mounted ? 1 : 0,
          transition: "transform 0.28s ease, opacity 0.28s ease",
        }}
      >
        {/* ── Header ── */}
        <div className="sm-header">
          <div className="sm-header-left">
            <div className="sm-icon-wrap">
              <Share2 size={15} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="sm-title">Share Note</h2>
              <p className="sm-subtitle" title={noteTitle}>
                {noteTitle.length > 38
                  ? noteTitle.slice(0, 38) + "…"
                  : noteTitle}
              </p>
            </div>
          </div>
          <button
            id="sm-close-btn"
            className="sm-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="sm-body">
          {!shareUrl ? (
            /* ── NOT SHARED ── */
            <div className="sm-unshared">
              <div className="sm-lock-glyph">🔒</div>
              <h3 className="sm-unshared-h">This note is private</h3>
              <p className="sm-unshared-p">
                Create a public link — no login required for readers.
              </p>
              <button
                id="sm-generate-btn"
                className="sm-btn sm-btn-primary sm-btn-full"
                onClick={handleGenerate}
                disabled={isSharing}
              >
                {isSharing ? (
                  <>
                    <Loader2 size={15} className="sm-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Link2 size={15} />
                    Generate Share Link
                  </>
                )}
              </button>
            </div>
          ) : (
            /* ── SHARED ── */
            <div className="sm-shared">
              {/* Live badge */}
              <div className="sm-live-badge">
                <span className="sm-live-dot" />
                Live — anyone with the link can view
              </div>

              {/* URL row */}
              <div className="sm-url-row">
                <input
                  ref={inputRef}
                  id="sm-url-input"
                  className="sm-url-input"
                  value={shareUrl}
                  readOnly
                  onClick={() => inputRef.current?.select()}
                />
                <button
                  id="sm-copy-btn"
                  className={`sm-copy-btn${copied ? " sm-copy-btn--done" : ""}`}
                  onClick={handleCopy}
                >
                  {copied ? <Check size={14} /> : <Link2 size={14} />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>

              {/* QR + stats */}
              <div className="sm-qr-row">
                <div className="sm-qr-wrap">
                  <QRCodeSVG
                    value={shareUrl}
                    size={96}
                    bgColor="transparent"
                    fgColor="#18181b"
                    level="M"
                  />
                </div>
                <div className="sm-qr-info">
                  <div className="sm-stat">
                    <Eye size={13} className="sm-stat-eye" />
                    <span className="sm-stat-count">
                      {viewCount.toLocaleString()}
                    </span>
                    <span className="sm-stat-label">
                      view{viewCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <p className="sm-qr-hint">Scan to open on mobile</p>
                  <a
                    href={shareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sm-preview-link"
                  >
                    <ExternalLink size={11} />
                    Preview
                  </a>
                </div>
              </div>

              {/* Social share */}
              <div className="sm-social-section">
                <span className="sm-social-label">Share to</span>
                <div className="sm-social-row">
                  <button
                    id="sm-twitter-btn"
                    className="sm-social-btn sm-social-btn--tw"
                    onClick={openTwitter}
                    title="Share on X / Twitter"
                  >
                    <Twitter size={14} />
                    <span>Twitter / X</span>
                  </button>
                  <button
                    id="sm-whatsapp-btn"
                    className="sm-social-btn sm-social-btn--wa"
                    onClick={openWhatsApp}
                    title="Share on WhatsApp"
                  >
                    <MessageCircle size={14} />
                    <span>WhatsApp</span>
                  </button>
                  <button
                    id="sm-copy-link-btn"
                    className="sm-social-btn"
                    onClick={handleCopy}
                  >
                    {copied ? <Check size={14} /> : <Link2 size={14} />}
                    <span>{copied ? "Copied!" : "Copy link"}</span>
                  </button>
                </div>
              </div>

              <div className="sm-divider" />

              {/* Revoke */}
              {!showRevoke ? (
                <button
                  id="sm-revoke-btn"
                  className="sm-btn sm-btn-danger-ghost sm-btn-full"
                  onClick={() => setShowRevoke(true)}
                >
                  <Trash2 size={13} />
                  Revoke access
                </button>
              ) : (
                <div className="sm-revoke-box">
                  <p className="sm-revoke-warn">
                    ⚠️ This will permanently disable the share link. Existing
                    visitors will lose access immediately.
                  </p>
                  <div className="sm-revoke-actions">
                    <button
                      className="sm-btn sm-btn-ghost"
                      onClick={() => setShowRevoke(false)}
                    >
                      Cancel
                    </button>
                    <button
                      id="sm-revoke-confirm-btn"
                      className="sm-btn sm-btn-danger"
                      onClick={handleRevoke}
                      disabled={isSharing}
                    >
                      {isSharing ? (
                        <Loader2 size={13} className="sm-spin" />
                      ) : (
                        <Trash2 size={13} />
                      )}
                      Yes, revoke
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CSS ─────────────────────────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

.sm-panel {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 28px 90px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.055);
  width: 100%; max-width: 424px;
  font-family: 'Inter', -apple-system, sans-serif;
  overflow: hidden;
}

/* Header */
.sm-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1.1rem 1.2rem;
  border-bottom: 1px solid rgba(0,0,0,0.07);
}
.sm-header-left { display: flex; align-items: center; gap: 0.7rem; }
.sm-icon-wrap {
  width: 34px; height: 34px; flex-shrink: 0;
  background: #18181b; color: #fff; border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
}
.sm-title { font-size: 0.9rem; font-weight: 700; color: #111; line-height: 1.3; }
.sm-subtitle { font-size: 0.72rem; color: #999; margin-top: 1px; }
.sm-close-btn {
  width: 30px; height: 30px; border: none; background: transparent;
  border-radius: 8px; color: #aaa; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s, color 0.15s;
}
.sm-close-btn:hover { background: rgba(0,0,0,0.06); color: #333; }

/* Body */
.sm-body { padding: 1.2rem; }

/* Unshared */
.sm-unshared {
  display: flex; flex-direction: column; align-items: center;
  text-align: center; padding: 0.75rem 0 0.5rem; gap: 0.55rem;
}
.sm-lock-glyph { font-size: 2.4rem; }
.sm-unshared-h { font-size: 0.95rem; font-weight: 700; color: #111; }
.sm-unshared-p { font-size: 0.8rem; color: #999; max-width: 270px; line-height: 1.5; margin-bottom: 0.4rem; }

/* Shared */
.sm-shared { display: flex; flex-direction: column; gap: 0.95rem; }

.sm-live-badge {
  display: inline-flex; align-items: center; gap: 0.45rem;
  font-size: 0.72rem; font-weight: 600; color: #15803d;
  background: #f0fdf4; border: 1px solid #bbf7d0;
  border-radius: 9999px; padding: 0.28rem 0.75rem; width: fit-content;
}
.sm-live-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #22c55e; box-shadow: 0 0 6px #4ade80;
  animation: sm-pulse 2s infinite;
}
@keyframes sm-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

/* URL row */
.sm-url-row { display: flex; gap: 0.45rem; }
.sm-url-input {
  flex: 1; font-size: 0.76rem; font-family: 'Courier New', monospace;
  color: #555; background: #f9fafb;
  border: 1px solid rgba(0,0,0,0.1); border-radius: 8px;
  padding: 0.5rem 0.7rem; outline: none; min-width: 0;
}
.sm-url-input:focus { border-color: #18181b; }

.sm-copy-btn {
  display: flex; align-items: center; gap: 0.32rem;
  font-size: 0.78rem; font-weight: 600; font-family: 'Inter', sans-serif;
  padding: 0.48rem 0.85rem; border: none; border-radius: 8px;
  background: #18181b; color: #fff; cursor: pointer;
  white-space: nowrap; transition: background 0.15s, transform 0.1s;
}
.sm-copy-btn:hover { background: #27272a; }
.sm-copy-btn:active { transform: scale(0.96); }
.sm-copy-btn--done { background: #15803d; }

/* QR row */
.sm-qr-row {
  display: flex; align-items: center; gap: 1rem;
  background: #fafafa; border: 1px solid rgba(0,0,0,0.07);
  border-radius: 11px; padding: 0.85rem 1rem;
}
.sm-qr-wrap {
  padding: 7px; background: #fff; border-radius: 8px;
  box-shadow: 0 1px 5px rgba(0,0,0,0.08); flex-shrink: 0;
}
.sm-qr-info { display: flex; flex-direction: column; gap: 0.2rem; }
.sm-stat { display: flex; align-items: baseline; gap: 0.3rem; font-size: 0.82rem; }
.sm-stat-eye { color: #aaa; position: relative; top: 1px; }
.sm-stat-count { font-weight: 800; font-size: 1.4rem; color: #111; line-height: 1; }
.sm-stat-label { font-size: 0.75rem; color: #999; }
.sm-qr-hint { font-size: 0.68rem; color: #bbb; margin-top: 0.3rem; }
.sm-preview-link {
  display: inline-flex; align-items: center; gap: 0.25rem;
  font-size: 0.68rem; color: #888; text-decoration: underline;
  text-underline-offset: 2px; margin-top: 0.2rem;
}
.sm-preview-link:hover { color: #555; }

/* Social */
.sm-social-section {}
.sm-social-label {
  display: block; font-size: 0.67rem; font-weight: 700;
  letter-spacing: 0.08em; text-transform: uppercase; color: #bbb; margin-bottom: 0.5rem;
}
.sm-social-row { display: flex; gap: 0.45rem; flex-wrap: wrap; }
.sm-social-btn {
  display: flex; align-items: center; gap: 0.35rem;
  font-size: 0.76rem; font-weight: 500; font-family: 'Inter', sans-serif;
  padding: 0.42rem 0.8rem; border-radius: 8px;
  border: 1px solid rgba(0,0,0,0.1); background: transparent; color: #555;
  cursor: pointer; transition: background 0.15s, border-color 0.15s;
}
.sm-social-btn:hover { background: rgba(0,0,0,0.04); border-color: rgba(0,0,0,0.18); }
.sm-social-btn--tw { color: #0f0f0f; }
.sm-social-btn--tw:hover { background: #f5f5f5; }
.sm-social-btn--wa { color: #16a34a; }
.sm-social-btn--wa:hover { background: #f0fdf4; border-color: #86efac; }

.sm-divider { height: 1px; background: rgba(0,0,0,0.07); }

/* Buttons */
.sm-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 0.38rem;
  font-size: 0.84rem; font-weight: 600; font-family: 'Inter', sans-serif;
  padding: 0.58rem 1.1rem; border-radius: 9px; cursor: pointer;
  transition: background 0.15s, opacity 0.15s; border: none;
}
.sm-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.sm-btn-full { width: 100%; }
.sm-btn-primary { background: #18181b; color: #fff; }
.sm-btn-primary:hover:not(:disabled) { background: #27272a; }
.sm-btn-ghost {
  background: transparent; color: #666;
  border: 1px solid rgba(0,0,0,0.12);
}
.sm-btn-ghost:hover { background: rgba(0,0,0,0.04); }
.sm-btn-danger { background: #dc2626; color: #fff; }
.sm-btn-danger:hover:not(:disabled) { background: #b91c1c; }
.sm-btn-danger-ghost {
  background: transparent; color: #dc2626;
  border: 1px solid rgba(220,38,38,0.22);
}
.sm-btn-danger-ghost:hover { background: rgba(220,38,38,0.05); }

/* Revoke confirm */
.sm-revoke-box {
  background: #fff5f5; border: 1px solid rgba(220,38,38,0.15);
  border-radius: 10px; padding: 0.9rem;
  display: flex; flex-direction: column; gap: 0.7rem;
}
.sm-revoke-warn { font-size: 0.79rem; color: #b91c1c; line-height: 1.45; }
.sm-revoke-actions { display: flex; gap: 0.45rem; justify-content: flex-end; }

.sm-spin { animation: sm-rotate 0.75s linear infinite; }
@keyframes sm-rotate { to { transform: rotate(360deg); } }

@media (max-width: 480px) {
  .sm-panel { border-radius: 14px; }
  .sm-social-row { flex-direction: column; }
}
`;
