const crypto = require('crypto');
const https = require('https');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const TripPlan = require('../models/TripPlan');
const Place = require('../models/Place');
const { calculateTotalPathDistance, optimizeRoute } = require('../utils/routeOptimizer');
const { estimateTravelTime } = require('../utils/geospatial');
const { trackTripCreation, trackTripShare } = require('../services/analyticsService');

// Helper to fetch QR code bytes
function fetchQRCode(dataUrl) {
  return new Promise((resolve) => {
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(dataUrl)}&format=png`;
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        resolve(null);
        return;
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', () => {
      resolve(null);
    });
  });
}

// Recalculates total distance and duration for a trip based on travel mode
async function computeTripMetrics(days, travelMode) {
  let totalDistance = 0;
  let totalPlacesCount = 0;

  for (const day of days) {
    if (day.places && day.places.length > 0) {
      totalPlacesCount += day.places.length;
      
      // Fetch places with coordinates to calculate path distance
      const placesData = await Place.find({ _id: { $in: day.places } });
      // Maintain user's day order
      const orderedPlaces = day.places.map(id => placesData.find(p => p._id.toString() === id.toString())).filter(Boolean);
      
      const dayDistance = calculateTotalPathDistance(orderedPlaces);
      totalDistance += dayDistance;
    }
  }

  const transitionMinutes = estimateTravelTime(totalDistance, travelMode);
  // Add 60 minutes of stay/sightseeing time per attraction
  const stayMinutes = totalPlacesCount * 60;
  const estimatedDuration = transitionMinutes + stayMinutes;

  return {
    totalDistance: parseFloat(totalDistance.toFixed(2)),
    estimatedDuration
  };
}

// @desc    Create a new trip plan
// @route   POST /api/trips
// @access  Private
const createTrip = async (req, res) => {
  try {
    const { title, description, districts, days, travelMode = 'ROAD' } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Trip title is required.' });
    }

    const { totalDistance, estimatedDuration } = await computeTripMetrics(days || [], travelMode);
    
    // Generate secure unique shareId
    const shareId = crypto.randomBytes(6).toString('hex');

    const newTrip = new TripPlan({
      userId: req.user._id,
      title,
      description,
      districts,
      days: days || [],
      travelMode,
      totalDistance,
      estimatedDuration,
      shareId,
      isPublic: false
    });

    const savedTrip = await newTrip.save();
    
    // Log trip creation event
    await trackTripCreation(savedTrip._id, req.user._id, travelMode);

    res.status(201).json({ success: true, data: savedTrip });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all saved trips for the logged-in user
// @route   GET /api/trips
// @access  Private
const getTrips = async (req, res) => {
  try {
    // Populate places to retrieve cover images dynamically
    const trips = await TripPlan.find({ userId: req.user._id })
      .populate('days.places')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: trips.length, data: trips });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get a single trip plan by ID
// @route   GET /api/trips/:id
// @access  Private
const getTrip = async (req, res) => {
  try {
    const trip = await TripPlan.findOne({ _id: req.params.id, userId: req.user._id })
      .populate('days.places');

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found or unauthorized.' });
    }

    res.json({ success: true, data: trip });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a trip plan
// @route   PUT /api/trips/:id
// @access  Private
const updateTrip = async (req, res) => {
  try {
    const { title, description, districts, days, travelMode, isPublic, optimizeDays } = req.body;
    
    const trip = await TripPlan.findOne({ _id: req.params.id, userId: req.user._id });
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found or unauthorized.' });
    }

    if (title !== undefined) trip.title = title;
    if (description !== undefined) trip.description = description;
    if (districts !== undefined) trip.districts = districts;
    if (travelMode !== undefined) trip.travelMode = travelMode;
    if (isPublic !== undefined) trip.isPublic = isPublic;

    if (days !== undefined) {
      let finalDays = days;
      
      // Run optimization on selected days if requested
      if (optimizeDays && Array.isArray(optimizeDays)) {
        finalDays = await Promise.all(days.map(async (day) => {
          if (optimizeDays.includes(day.dayNumber) && day.places && day.places.length > 1) {
            const placesData = await Place.find({ _id: { $in: day.places } });
            // Preserve user references, fetch detail coords
            const orderedPlaces = day.places.map(id => placesData.find(p => p._id.toString() === id.toString())).filter(Boolean);
            const optimized = optimizeRoute(orderedPlaces);
            return {
              dayNumber: day.dayNumber,
              places: optimized.map(p => p._id)
            };
          }
          return day;
        }));
      }
      trip.days = finalDays;
    }

    // Recalculate stats
    const { totalDistance, estimatedDuration } = await computeTripMetrics(trip.days, trip.travelMode);
    trip.totalDistance = totalDistance;
    trip.estimatedDuration = estimatedDuration;

    const updatedTrip = await trip.save();
    // Populate for final UI update
    const populated = await TripPlan.findById(updatedTrip._id).populate('days.places');
    res.json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a trip plan
// @route   DELETE /api/trips/:id
// @access  Private
const deleteTrip = async (req, res) => {
  try {
    const trip = await TripPlan.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found or unauthorized.' });
    }

    res.json({ success: true, message: 'Trip plan deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get shared trip plan details by shareId (Public Read-Only)
// @route   GET /api/trips/shared/:shareId
// @access  Public
const getSharedTrip = async (req, res) => {
  try {
    const trip = await TripPlan.findOne({ shareId: req.params.shareId, isPublic: true })
      .populate('days.places');

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Shared trip not found or is set to private.' });
    }

    // Strip out userId and system audit details for security compliance
    const publicTrip = {
      title: trip.title,
      description: trip.description,
      districts: trip.districts,
      days: trip.days,
      travelMode: trip.travelMode,
      totalDistance: trip.totalDistance,
      estimatedDuration: trip.estimatedDuration,
      createdAt: trip.createdAt,
      shareId: trip.shareId
    };

    res.json({ success: true, data: publicTrip });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle trip sharing visibility
// @route   POST /api/trips/:id/share
// @access  Private
const shareTrip = async (req, res) => {
  try {
    const { isPublic = true } = req.body;
    const trip = await TripPlan.findOne({ _id: req.params.id, userId: req.user._id });

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found or unauthorized.' });
    }

    trip.isPublic = isPublic;
    await trip.save();

    // Log trip share event if it is set to public
    if (isPublic) {
      await trackTripShare(trip._id, req.user._id);
    }

    res.json({
      success: true,
      message: `Trip visibility set to ${isPublic ? 'Public' : 'Private'}.`,
      data: {
        shareId: trip.shareId,
        isPublic: trip.isPublic
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Export trip details as a formatted PDF with QR code
// @route   POST /api/trips/:id/export
// @access  Public (so users can download shared trips too if public)
const exportTripPDF = async (req, res) => {
  try {
    const trip = await TripPlan.findById(req.params.id).populate('days.places');
    
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }

    // Auth verification: allow if user is owner OR if the trip is public
    const isOwner = req.user && req.user._id.toString() === trip.userId.toString();
    if (!isOwner && !trip.isPublic) {
      return res.status(403).json({ success: false, message: 'Access denied to this private trip plan.' });
    }

    const pdfDoc = await PDFDocument.create();
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Initial page setup
    let page = pdfDoc.addPage([595.275, 841.89]); // A4
    let y = 780;
    const margin = 50;

    const checkPageBreak = (neededHeight) => {
      if (y - neededHeight < 50) {
        page = pdfDoc.addPage([595.275, 841.89]);
        y = 780;
      }
    };

    // Title Section
    page.drawText('Visit AP Tourism - Trip Itinerary', { x: margin, y, size: 24, font: helveticaBold, color: rgb(0.1, 0.45, 0.6) });
    y -= 35;

    page.drawText(`Trip: ${trip.title}`, { x: margin, y, size: 16, font: helveticaBold, color: rgb(0.15, 0.15, 0.15) });
    y -= 20;

    if (trip.description) {
      page.drawText(trip.description.substring(0, 80), { x: margin, y, size: 10, font: helvetica, color: rgb(0.4, 0.4, 0.4) });
      y -= 25;
    } else {
      y -= 10;
    }

    // Horizontal Rule
    page.drawLine({ start: { x: margin, y }, end: { x: 595.275 - margin, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
    y -= 25;

    // Summary Statistics
    checkPageBreak(100);
    page.drawText('Trip Summary', { x: margin, y, size: 12, font: helveticaBold, color: rgb(0.1, 0.45, 0.6) });
    y -= 20;

    page.drawText(`Districts Visited: ${trip.districts.join(', ') || 'N/A'}`, { x: margin, y, size: 10, font: helvetica });
    y -= 15;
    page.drawText(`Travel Mode: ${trip.travelMode}`, { x: margin, y, size: 10, font: helvetica });
    y -= 15;
    page.drawText(`Total Estimated Distance: ${trip.totalDistance} km`, { x: margin, y, size: 10, font: helvetica });
    y -= 15;
    
    const durationHours = Math.floor(trip.estimatedDuration / 60);
    const durationMins = trip.estimatedDuration % 60;
    page.drawText(`Total Estimated Time: ${durationHours}h ${durationMins}m (including sight-seeing)`, { x: margin, y, size: 10, font: helvetica });
    y -= 30;

    // Day-wise Details
    for (const day of trip.days) {
      checkPageBreak(80);
      page.drawText(`Day ${day.dayNumber}`, { x: margin, y, size: 12, font: helveticaBold, color: rgb(0.15, 0.6, 0.4) });
      y -= 15;

      page.drawLine({ start: { x: margin, y }, end: { x: 595.275 - margin, y }, thickness: 0.5, color: rgb(0.9, 0.9, 0.9) });
      y -= 15;

      if (!day.places || day.places.length === 0) {
        page.drawText('No attractions scheduled for this day.', { x: margin + 15, y, size: 10, font: helvetica, color: rgb(0.5, 0.5, 0.5) });
        y -= 25;
        continue;
      }

      for (let index = 0; index < day.places.length; index++) {
        const place = day.places[index];
        checkPageBreak(60);

        const bullet = `${index + 1}.`;
        page.drawText(bullet, { x: margin + 10, y, size: 10, font: helveticaBold });
        page.drawText(place.name, { x: margin + 30, y, size: 10, font: helveticaBold });
        page.drawText(`[${place.category}]`, { x: margin + 280, y, size: 9, font: helvetica, color: rgb(0.1, 0.5, 0.8) });
        y -= 15;

        // Ratings and Timings
        const ratingAvg = place.rating && place.rating.average ? place.rating.average : 'N/A';
        const ratingStr = `Rating: ${ratingAvg}★  |  Timings: ${place.timings || 'N/A'}`;
        page.drawText(ratingStr, { x: margin + 30, y, size: 9, font: helvetica, color: rgb(0.4, 0.4, 0.4) });
        y -= 15;

        // Maps redirection link
        const lat = place.location?.coordinates?.[1] || 0;
        const lng = place.location?.coordinates?.[0] || 0;
        const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        page.drawText('Open in Google Maps Directions', { x: margin + 30, y, size: 9, font: helvetica, color: rgb(0.1, 0.35, 0.75) });
        y -= 20;
      }
      y -= 10;
    }

    // Embed QR Code referencing the shared web URL
    const frontendOrigin = req.headers.referer || req.headers.origin || 'https://visitap.com';
    const sharedWebUrl = `${frontendOrigin.split('/my-trips')[0].split('/trip-planner')[0]}/shared/${trip.shareId}`;
    
    const qrBuffer = await fetchQRCode(sharedWebUrl);
    if (qrBuffer) {
      checkPageBreak(180);
      try {
        const qrImage = await pdfDoc.embedPng(qrBuffer);
        page.drawText('Scan to view online & share:', { x: margin, y, size: 10, font: helveticaBold });
        y -= 130;
        page.drawImage(qrImage, { x: margin, y, width: 120, height: 120 });
      } catch (err) {
        console.error('Failed to embed QR code:', err.message);
      }
    }

    // Save and send pdf binary stream
    const pdfBytes = await pdfDoc.save();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=VisitAP-Trip.pdf`);
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('PDF export error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createTrip,
  getTrips,
  getTrip,
  updateTrip,
  deleteTrip,
  shareTrip,
  getSharedTrip,
  exportTripPDF
};
