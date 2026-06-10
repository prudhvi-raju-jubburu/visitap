const AnalyticsEvent = require('../models/AnalyticsEvent');
const Place = require('../models/Place');
const District = require('../models/District');

// Helper to calculate 12-month expiration date
const get12MonthsExpiration = () => {
  return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
};

/**
 * Core event tracking method
 */
async function trackEvent(eventType, { userId, districtId, placeId, category, metadata, expiresAt }) {
  try {
    const event = new AnalyticsEvent({
      eventType,
      userId,
      districtId,
      placeId,
      category,
      metadata,
      expiresAt,
      createdAt: new Date()
    });
    await event.save();
    return event;
  } catch (error) {
    console.error(`[analyticsService] Error tracking event ${eventType}:`, error.message);
  }
}

/**
 * Log place details page view (expires in 12 months)
 */
async function trackPlaceView(placeId, userId = null, metadata = {}) {
  try {
    const place = await Place.findById(placeId);
    if (!place) return;
    return trackEvent('PLACE_VIEW', {
      placeId,
      districtId: place.districtId,
      category: place.category,
      userId,
      metadata,
      expiresAt: get12MonthsExpiration()
    });
  } catch (error) {
    console.error('[analyticsService] Place view tracking error:', error.message);
  }
}

/**
 * Log district details page view (expires in 12 months)
 */
async function trackDistrictView(districtId, userId = null, metadata = {}) {
  return trackEvent('DISTRICT_VIEW', {
    districtId,
    userId,
    metadata,
    expiresAt: get12MonthsExpiration()
  });
}

/**
 * Log search event (expires in 12 months)
 */
async function trackSearch(searchQuery, userId = null, metadata = {}) {
  return trackEvent('SEARCH', {
    userId,
    metadata: { ...metadata, searchQuery },
    expiresAt: get12MonthsExpiration()
  });
}

/**
 * Log voice search event (expires in 12 months)
 */
async function trackVoiceSearch(searchQuery, userId = null, metadata = {}) {
  return trackEvent('VOICE_SEARCH', {
    userId,
    metadata: { ...metadata, searchQuery },
    expiresAt: get12MonthsExpiration()
  });
}

/**
 * Log search result click conversion (expires in 12 months)
 */
async function trackSearchResultClick(searchQuery, targetId, targetType, userId = null, metadata = {}) {
  const data = {
    userId,
    metadata: { ...metadata, searchQuery, destinationId: targetId, destinationType: targetType },
    expiresAt: get12MonthsExpiration()
  };
  if (targetType === 'Place') {
    data.placeId = targetId;
  } else if (targetType === 'District') {
    data.districtId = targetId;
  }
  return trackEvent('SEARCH_RESULT_CLICK', data);
}

/**
 * Log search query yielding no results (expires in 12 months)
 */
async function trackSearchNoResult(searchQuery, userId = null, metadata = {}) {
  return trackEvent('SEARCH_NO_RESULT', {
    userId,
    metadata: { ...metadata, searchQuery },
    expiresAt: get12MonthsExpiration()
  });
}

/**
 * Log bookmarking of a place (kept indefinitely)
 */
async function trackSavePlace(placeId, userId) {
  try {
    const place = await Place.findById(placeId);
    return trackEvent('SAVE_PLACE', {
      placeId,
      districtId: place?.districtId,
      category: place?.category,
      userId
    });
  } catch (err) {
    console.error('[analyticsService] Save place tracking error:', err.message);
  }
}

/**
 * Log bookmarking of a district (kept indefinitely)
 */
async function trackSaveDistrict(districtId, userId) {
  return trackEvent('SAVE_DISTRICT', {
    districtId,
    userId
  });
}

/**
 * Log trip plan generation (kept indefinitely)
 */
async function trackTripCreation(tripId, userId, travelMode) {
  return trackEvent('CREATE_TRIP', {
    userId,
    metadata: { tripId, travelMode }
  });
}

/**
 * Log trip plan share link copy/usage (kept indefinitely)
 */
async function trackTripShare(tripId, userId = null) {
  return trackEvent('SHARE_TRIP', {
    userId,
    metadata: { tripId }
  });
}

/**
 * Log review submission (kept indefinitely)
 */
async function trackReview(placeId, reviewId, userId, rating) {
  try {
    const place = await Place.findById(placeId);
    return trackEvent('REVIEW_SUBMITTED', {
      placeId,
      districtId: place?.districtId,
      category: place?.category,
      userId,
      metadata: { reviewId, rating }
    });
  } catch (err) {
    console.error('[analyticsService] Review tracking error:', err.message);
  }
}

/**
 * Log new user registration (kept indefinitely)
 */
async function trackRegistration(userId) {
  return trackEvent('USER_REGISTERED', { userId });
}

/**
 * Log user login (kept indefinitely)
 */
async function trackLogin(userId, metadata = {}) {
  return trackEvent('USER_LOGIN', { userId, metadata });
}

/**
 * Log feedback submission (kept indefinitely)
 */
async function trackFeedback(feedbackId) {
  return trackEvent('FEEDBACK_SUBMITTED', {
    metadata: { feedbackId }
  });
}

module.exports = {
  trackEvent,
  trackPlaceView,
  trackDistrictView,
  trackSearch,
  trackVoiceSearch,
  trackSearchResultClick,
  trackSearchNoResult,
  trackSavePlace,
  trackSaveDistrict,
  trackTripCreation,
  trackTripShare,
  trackReview,
  trackRegistration,
  trackLogin,
  trackFeedback
};
