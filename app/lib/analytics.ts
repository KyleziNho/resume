'use client';

// Send analytics event to API (for chat messages and ratings only)
const sendEvent = async (event: Record<string, unknown>) => {
  try {
    await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...event,
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

  // Check if user has already rated or dismissed
  const hasRated = localStorage.getItem('has_rated');
  const dismissedAt = localStorage.getItem('rating_dismissed_at');

  if (hasRated) return false;

  // If dismissed, wait 7 days before showing again
  if (dismissedAt) {
    const dismissedTime = parseInt(dismissedAt, 10);
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - dismissedTime < sevenDays) return false;
  }

  return true;
};

// Mark rating as completed
export const markRatingCompleted = () => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('has_rated', 'true');
};

// Mark rating popup as dismissed
export const markRatingDismissed = () => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('rating_dismissed_at', Date.now().toString());
};
