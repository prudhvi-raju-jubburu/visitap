const mongoose = require('mongoose');
const Place = require('../models/Place');

/**
 * Resolves a place identifier (either a valid 24-character hexadecimal MongoDB ObjectId or a slug)
 * to its corresponding Place document.
 * 
 * @param {string} identifier - The slug or ObjectId of the place.
 * @returns {Promise<Document|null>} - The resolved Place document or null if not found.
 */
const resolvePlace = async (identifier) => {
  if (!identifier) return null;

  // If it is a valid ObjectId, search by _id
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    const place = await Place.findById(identifier);
    if (place) return place;
  }

  // Otherwise, fallback to search by slug
  return await Place.findOne({ slug: identifier });
};

module.exports = { resolvePlace };
