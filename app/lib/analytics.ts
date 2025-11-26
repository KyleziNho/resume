'use client';

// Generate or retrieve a unique visitor ID
const getVisitorId = (): string => {
  if (typeof window === 'undefined') return 'unknown';

  let visitorId = localStorage.getItem('kyleos_visitor_id');
  if (!visitorId) {
    // Generate a unique ID based on timestamp and random string
    visitorId = `v_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem('kyleos_visitor_id', visitorId);
  }
  return visitorId;
};

// Collect device and browser information
const getDeviceInfo = () => {
  if (typeof window === 'undefined') {
    return {};
  }

  const ua = navigator.userAgent;

  // Parse OS
  let os = 'Unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('Linux')) os = 'Linux';

  // Parse Browser
  let browser = 'Unknown';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';

  // Parse Device Type
  let deviceType = 'Desktop';
  if (/Mobi|Android/i.test(ua)) deviceType = 'Mobile';
  else if (/Tablet|iPad/i.test(ua)) deviceType = 'Tablet';

  // Get device model hints if available
  let deviceModel = '';
  if (ua.includes('iPhone')) deviceModel = 'iPhone';
  else if (ua.includes('iPad')) deviceModel = 'iPad';
  else if (ua.includes('Macintosh')) deviceModel = 'Mac';
  else if (ua.match(/Android.*?;\s*([^)]+)/)) {
    const match = ua.match(/Android.*?;\s*([^)]+)/);
    if (match) deviceModel = match[1].split(' Build')[0].trim();
  }

  return {
    visitorId: getVisitorId(),
    userAgent: ua,
    os,
    browser,
    deviceType,
    deviceModel: deviceModel || undefined,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    referrer: document.referrer || undefined,
  };
};

// Send analytics event to API (for chat messages and ratings only)
const sendEvent = async (event: Record<string, unknown>) => {
  try {
    const deviceInfo = getDeviceInfo();

    await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...event,
        ...deviceInfo,
        timestamp: Date.now(),
      }),
    });
  } catch (error) {
    console.error('Analytics error:', error);
  }
};

// Track chat message
export const trackChatMessage = (message: string, response: string) => {
  sendEvent({
    type: 'chat_message',
    message,
    response,
  });
};

// Track rating
export const trackRating = (rating: number, review?: string) => {
  sendEvent({
    type: 'rating',
    rating,
    review,
  });
};

// Check if rating popup should be shown
export const shouldShowRatingPopup = (): boolean => {
  if (typeof window === 'undefined') return false;

  // Check if user has already rated - never show again
  const hasRated = localStorage.getItem('has_rated');
  if (hasRated) return false;

  // If cancelled, show again next time they load the site (no delay)
  return true;
};

// Mark rating as completed - user won't be asked again
export const markRatingCompleted = () => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('has_rated', 'true');
};
