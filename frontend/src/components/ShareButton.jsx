import React, { useState, useEffect, useRef } from 'react';
import { Share2, Copy, Check } from 'lucide-react';
import SocialShare from './SocialShare';
import { getShareUrl, getShareText } from '../utils/shareUtils';
import './ShareButton.css';

const API_BASE = import.meta.env?.VITE_API_BASE || (import.meta.env?.VITE_API_URL || 'http://localhost:3000').replace(/\/api\/?$/, '');

/**
 * Compact Share button with dropdown or native share.
 * Use for inline placement (stall header, dish card, centre card).
 *
 * @param {string} type - 'centre' | 'stall' | 'dish'
 * @param {number} id - Entity ID
 * @param {object} meta - { name, description?, image?, rating?, stall_name? (dish), spice_level? (dish) }
 * @param {string} variant - 'button' | 'icon' | 'full'
 */
const ShareButton = ({ type, id, meta = {}, variant = 'button' }) => {
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [copied, setCopied] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!showSharePanel) return;
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSharePanel(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showSharePanel]);

  const url = getShareUrl[type](id);
  const text = type === 'centre'
    ? getShareText.centre(meta.name, meta.rating)
    : type === 'stall'
    ? getShareText.stall(meta.name, meta.rating)
    : getShareText.dish(meta.name, meta.stall_name || 'this stall', meta.spice_emoji);

  const recordShare = async (platform) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/api/share-events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ share_type: type, reference_id: id, platform }),
      });
    } catch (e) {
      // Ignore - analytics optional
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: meta.name,
          text,
          url,
        });
        recordShare('native');
        setShowSharePanel(false);
      } catch (err) {
        if (err.name !== 'AbortError') console.warn('Share failed:', err);
      }
    } else {
      setShowSharePanel(true);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      recordShare('copy');
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Copy failed:', e);
    }
  };

  const openSharePanel = () => {
    if (navigator.share && /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent)) {
      handleNativeShare();
    } else {
      setShowSharePanel((v) => !v);
    }
  };

  return (
    <div className="share-button-wrapper" ref={wrapperRef}>
      <button
        type="button"
        className={`share-button share-button--${variant}`}
        onClick={openSharePanel}
        aria-label="Share"
      >
        <Share2 size={variant === 'icon' ? 18 : 16} />
        {variant !== 'icon' && <span>Share</span>}
      </button>

      {variant === 'button' && (
        <button
          type="button"
          className="share-button share-button--copy"
          onClick={handleCopyLink}
          aria-label="Copy link"
          title="Copy link"
        >
          {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
          <span>{copied ? 'Copied!' : 'Copy link'}</span>
        </button>
      )}

      {showSharePanel && (
        <div className={`share-button-panel share-button-panel--${variant}`}>
          <SocialShare
            url={url}
            title={meta.name}
            description={meta.description}
            shareText={text}
            imageUrl={meta.image}
            onShare={(platform) => {
              recordShare(platform);
              setShowSharePanel(false);
            }}
            compact
          />
        </div>
      )}
    </div>
  );
};

export default ShareButton;
