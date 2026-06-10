import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Common / Navigation
      home: 'Home',
      districts: 'Districts',
      savedPlaces: 'Saved Places',
      myTrips: 'My Trips',
      login: 'Login',
      register: 'Register',
      profile: 'Profile',
      logout: 'Logout',
      simpleMode: 'Simple Mode',
      normalMode: 'Normal Mode',
      language: 'Language',
      english: 'English',
      backToExploration: 'Back to Exploration',
      detectDistance: 'Detect distance',
      away: 'away',
      kmAway: 'km away',

      // Home Screen
      welcomeHeader: 'Where do you want to go?',
      speakToSearch: 'Speak to Search',
      tapToSpeak: 'Tap to Speak',
      listening: 'Listening...',
      searchPlaceholder: 'Search districts, beaches, temples...',
      searchExampleTitle: 'Try saying:',
      exampleBeach: 'Show beaches',
      exampleTirupati: 'Show Tirupati',
      exampleNearMe: 'Show temples near me',
      exampleWaterfalls: 'Show waterfalls',
      noInternetBanner: 'No Internet Connection. Showing saved data.',

      // 4 Main Actions
      actionNearby: 'Nearby Places',
      actionSpeak: 'Speak & Search',
      actionDistricts: 'Districts',
      actionSaved: 'Saved Places',

      // Categories
      catBeaches: 'Beaches',
      catTemples: 'Temples',
      catWaterfalls: 'Waterfalls',
      catNature: 'Nature',
      catWildlife: 'Wildlife',
      catHistorical: 'Historical',

      // Emergency Tourist Services
      emergencyTitle: 'Emergency Help Near Me',
      emergencyDesc: 'Find essential services near your location',
      helpPolice: 'Police',
      helpHospital: 'Hospital',
      helpPetrol: 'Petrol Pump',
      helpBus: 'Bus Stand',
      helpToilet: 'Public Toilet',

      // Sections
      popularPlaces: 'Popular Places',
      popularDistricts: 'Popular Districts',
      visitorLogs: 'Tourist Experiences',
      verifiedTourist: 'Verified Tourist',
      viewAllPlaces: 'Browse All Places',
      viewAllDistricts: 'View All Districts',
      storiesShared: 'Stories shared by travelers exploring Andhra Pradesh',

      // Place Details Actions
      btnSavePlace: 'Save Place',
      btnSavedPlace: 'Saved Place',
      btnOpenMaps: 'Open in Maps',
      btnGiveReview: 'Give Review',
      btnNearbyPlaces: 'Nearby Places',

      // Place Details Labels
      bestTimeToVisit: 'Best Time to Visit',
      entryFee: 'Entry Fee',
      timings: 'Timings',
      averageRating: 'Average Rating',
      ratingDistribution: 'Rating Distribution',
      touristReviews: 'Tourist Reviews',
      discoverNearby: 'Discover Nearby',
      smartTip: 'Smart Tip',
      shareExperience: 'Share Your Experience',
      editExperience: 'Edit Your Experience',
      yourRating: 'Your Rating',
      reviewComment: 'Review Comment',
      placeholderReview: 'What did you like or dislike? Describe your adventure...',
      submitReview: 'Submit Review',
      deleteReview: 'Delete',
      previous: 'Previous',
      next: 'Next',
      pageOf: 'Page {{page}} of {{totalPages}}',

      // Maps
      myLocation: 'My Location',
      nearbyAttractions: 'Nearby Attractions',
      getDirections: 'Get Directions',
      loadingMap: 'Loading map data...',
      legendDistricts: 'Districts',
      legendPlaces: 'Tourist Places',
      legendCurrentLoc: 'My Current Location'
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
