/**
 * Share URL and text templates for HawkerHub
 * Deep links: /centres/:id, /stalls/:id, /dishes/:id
 */

const getBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return import.meta.env?.VITE_APP_URL || 'https://hawkerhub.com';
};

/**
 * Build shareable deep link URLs
 */
export const getShareUrl = {
  centre: (id) => `${getBaseUrl()}/centres/${id}`,
  stall: (id) => `${getBaseUrl()}/stalls/${id}`,
  dish: (id) => `${getBaseUrl()}/dishes/${id}`,
};

/**
 * Catchy share text templates (short, for WhatsApp/Telegram/X)
 */
export const getShareText = {
  centre: (name, rating) => {
    const ratingPart = rating ? ` ⭐ ${rating}` : '';
    return `Discover ${name} — authentic hawker food${ratingPart} | HawkerHub`;
  },
  stall: (name, rating) => {
    const ratingPart = rating ? ` ⭐ ${rating}` : '';
    return `Try ${name}${ratingPart} — HawkerHub`;
  },
  dish: (dishName, stallName, emoji = '🍜') => {
    return `${emoji} Try the ${dishName} at ${stallName} — HawkerHub`;
  },
};

/**
 * Spice/heat emoji for dishes
 */
export const getDishEmoji = (spiceLevel) => {
  if (!spiceLevel) return '🍜';
  const map = {
    None: '🥗',
    Mild: '😊',
    Medium: '🌶️',
    Hot: '🔥',
    'Extra Hot': '🌶️🔥',
  };
  return map[spiceLevel] || '🍜';
};
