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
