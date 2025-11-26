'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { haptic } from 'ios-haptics';

interface RatingPopupProps {
  onClose: () => void;
  onSubmitRating: (rating: number, review?: string) => void;
}

type PopupState = 'rating' | 'thanks' | 'review' | 'submitted';

// Animated checkmark component
function AnimatedCheckmark() {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Small delay before starting animation
    const timer = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-[70px] h-[70px]">
      {/* Circle background with scale animation */}
      <div
        className={`absolute inset-0 rounded-full transition-all duration-500 ease-out ${
          animate ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
        }`}
        style={{
          background: 'linear-gradient(135deg, #34C759 0%, #30B350 100%)',
          boxShadow: '0 4px 20px rgba(52, 199, 89, 0.4)',
        }}
      />

      {/* SVG Checkmark with draw animation */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 70 70"
        fill="none"
      >
        <path
          d="M20 37 L30 47 L50 25"
          stroke="white"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: 60,
            strokeDashoffset: animate ? 0 : 60,
            transition: 'stroke-dashoffset 0.4s ease-out 0.3s',
          }}
        />
      </svg>

      {/* Ripple effect */}
      <div
        className={`absolute inset-0 rounded-full border-2 border-[#34C759] transition-all duration-700 ease-out ${
          animate ? 'scale-150 opacity-0' : 'scale-100 opacity-60'
        }`}
      />
    </div>
  );
}

export default function RatingPopup({ onClose, onSubmitRating }: RatingPopupProps) {
  const [state, setState] = useState<PopupState>('rating');
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleStarClick = (star: number) => {
    haptic();
    setRating(star);
  };

  const handleSubmit = () => {
    if (rating === 0) return;
    haptic();
    onSubmitRating(rating);
    setState('thanks');
  };

  const handleWriteReview = () => {
    haptic();
    setState('review');
  };

  const handleSubmitReview = () => {
    // Trigger satisfying haptic feedback sequence
    haptic();
    setTimeout(() => haptic(), 100);
    setTimeout(() => haptic(), 200);

    onSubmitRating(rating, review);
    setState('submitted');

    // Auto close after animation
    setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 200);
    }, 1800);
  };

  const handleCancel = () => {
    haptic();
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  const handleOk = () => {
    haptic();
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  const displayRating = hoveredRating || rating;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-200 ${
        isVisible ? 'bg-black/40 backdrop-blur-sm' : 'bg-transparent'
      }`}
      onClick={handleCancel}
    >
      <div
        className={`bg-[#f2f2f7] rounded-[14px] w-full max-w-[270px] overflow-hidden shadow-2xl transition-all duration-200 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={e => e.stopPropagation()}
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 0.5px rgba(0, 0, 0, 0.1)',
        }}
      >
        {state === 'rating' && (
          <>
            {/* Header with icon */}
            <div className="pt-5 pb-4 px-4 flex flex-col items-center">
              {/* App Icon */}
              <div
                className="w-[60px] h-[60px] rounded-[13px] mb-4 overflow-hidden"
                style={{
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}
              >
                <Image
                  src="/icon.png"
                  alt="Kyle's Portfolio"
                  width={60}
                  height={60}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Title */}
              <h2 className="text-[17px] font-semibold text-black text-center leading-tight">
                Enjoying Kyle's Portfolio?
              </h2>

              {/* Subtitle */}
              <p className="text-[13px] text-[#8e8e93] text-center mt-1">
                Tap a star to rate it on the App Store.
              </p>
            </div>

            {/* Divider */}
            <div className="h-[0.5px] bg-[#c6c6c8]" />

            {/* Stars */}
            <div className="py-4 px-6 flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleStarClick(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-transform active:scale-90"
                >
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill={star <= displayRating ? '#007AFF' : 'none'}
                    stroke="#007AFF"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="h-[0.5px] bg-[#c6c6c8]" />

            {/* Buttons */}
            <div className="flex">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 py-[11px] text-[17px] font-normal text-[#007AFF] active:bg-[#e5e5ea] transition-colors border-r border-[#c6c6c8]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className={`flex-1 py-[11px] text-[17px] font-semibold transition-colors ${
                  rating > 0
                    ? 'text-[#007AFF] active:bg-[#e5e5ea]'
                    : 'text-[#c7c7cc]'
                }`}
                disabled={rating === 0}
              >
                Submit
              </button>
            </div>
          </>
        )}

        {state === 'thanks' && (
          <>
            {/* Header with icon */}
            <div className="pt-5 pb-4 px-4 flex flex-col items-center">
              {/* Checkmark Icon */}
              <div
                className="w-[60px] h-[60px] rounded-full mb-4 flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #34C759 0%, #30B350 100%)',
                  boxShadow: '0 4px 12px rgba(52, 199, 89, 0.3)',
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>

              {/* Title */}
              <h2 className="text-[17px] font-semibold text-black text-center leading-tight">
                Thanks for your feedback.
              </h2>

              {/* Subtitle with stars */}
              <p className="text-[13px] text-[#8e8e93] text-center mt-1">
                You can also write a review.
              </p>

              {/* Display stars */}
              <div className="flex justify-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill={star <= rating ? '#FFB800' : 'none'}
                    stroke="#FFB800"
                    strokeWidth="1.5"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="h-[0.5px] bg-[#c6c6c8]" />

            {/* Buttons */}
            <div className="flex flex-col">
              <button
                type="button"
                onClick={handleWriteReview}
                className="py-[11px] text-[17px] font-normal text-[#007AFF] active:bg-[#e5e5ea] transition-colors border-b border-[#c6c6c8]"
              >
                Write a Review
              </button>
              <button
                type="button"
                onClick={handleOk}
                className="py-[11px] text-[17px] font-semibold text-[#007AFF] active:bg-[#e5e5ea] transition-colors"
              >
                OK
              </button>
            </div>
          </>
        )}

        {state === 'review' && (
          <>
            {/* Header */}
            <div className="pt-5 pb-3 px-4 flex flex-col items-center">
              <h2 className="text-[17px] font-semibold text-black text-center leading-tight">
                Write a Review
              </h2>
              <p className="text-[13px] text-[#8e8e93] text-center mt-1">
                Your feedback helps Kyle improve!
              </p>
            </div>

            {/* Text Area */}
            <div className="px-4 pb-4">
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="What do you think about this portfolio?"
                className="w-full h-24 p-3 bg-white rounded-lg border border-[#c6c6c8] text-[15px] text-black placeholder:text-[#8e8e93] resize-none focus:outline-none focus:border-[#007AFF]"
                autoFocus
              />
            </div>

            {/* Divider */}
            <div className="h-[0.5px] bg-[#c6c6c8]" />

            {/* Buttons */}
            <div className="flex">
              <button
                type="button"
                onClick={handleOk}
                className="flex-1 py-[11px] text-[17px] font-normal text-[#007AFF] active:bg-[#e5e5ea] transition-colors border-r border-[#c6c6c8]"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={handleSubmitReview}
                className="flex-1 py-[11px] text-[17px] font-semibold text-[#007AFF] active:bg-[#e5e5ea] transition-colors"
              >
                Submit
              </button>
            </div>
          </>
        )}

        {state === 'submitted' && (
          <div className="py-8 px-4 flex flex-col items-center">
            {/* Animated Checkmark */}
            <div className="mb-4">
              <AnimatedCheckmark />
            </div>

            {/* Title with fade in */}
            <h2
              className="text-[17px] font-semibold text-black text-center leading-tight opacity-0 animate-fadeInUp"
              style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}
            >
              Review Submitted!
            </h2>

            {/* Subtitle */}
            <p
              className="text-[13px] text-[#8e8e93] text-center mt-1 opacity-0 animate-fadeInUp"
              style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}
            >
              Thank you for your feedback.
            </p>
          </div>
        )}
      </div>

      {/* Animation keyframes */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
