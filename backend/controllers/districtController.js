const District = require('../models/District');
const Place = require('../models/Place');

// @desc   Get all districts
// @route  GET /api/districts
// @access Public
const getAllDistricts = async (req, res) => {
  try {
    const districts = await District.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, count: districts.length, data: districts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get single district by slug or name
// @route  GET /api/districts/:identifier
// @access Public
const getDistrict = async (req, res) => {
  try {
    const { identifier } = req.params;
    const district = await District.findOne({
      $or: [{ slug: identifier.toLowerCase() }, { name: new RegExp(`^${identifier}$`, 'i') }],
    });

    if (!district) {
      return res.status(404).json({ success: false, message: 'District not found.' });
    }

    res.json({ success: true, data: district });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Create district (admin)
// @route  POST /api/districts
// @access Private
const createDistrict = async (req, res) => {
  try {
    const district = await District.create(req.body);
    res.status(201).json({ success: true, data: district });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc   Update district (admin)
// @route  PUT /api/districts/:id
// @access Private
const updateDistrict = async (req, res) => {
  try {
    const district = await District.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!district) return res.status(404).json({ success: false, message: 'District not found.' });
    res.json({ success: true, data: district });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc   Delete district (admin)
// @route  DELETE /api/districts/:id
// @access Private
const deleteDistrict = async (req, res) => {
  try {
    const district = await District.findByIdAndDelete(req.params.id);
    if (!district) return res.status(404).json({ success: false, message: 'District not found.' });
    await Place.deleteMany({ districtId: req.params.id });
    res.json({ success: true, message: 'District and its places deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Search districts and places
// @route  GET /api/districts/search?q=query
// @access Public
const search = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ success: true, data: { districts: [], places: [] } });

    const words = q.split(/\s+/).filter(w => w.length > 2); // ignore small words like "in", "of"
    
    const makeRegex = (w) => {
      let base = w;
      const lower = w.toLowerCase();
      if (lower.endsWith('ies')) base = w.slice(0, -3) + 'y';
      else if (lower.endsWith('hes') || lower.endsWith('ses')) base = w.slice(0, -2);
      else if (lower.endsWith('es') && !lower.endsWith('les')) base = w.slice(0, -2);
      else if (lower.endsWith('s')) base = w.slice(0, -1);
      return new RegExp(`(${base}|${w})`, 'i');
    };

    const placeConditions = words.length > 0 ? {
      $and: words.map(w => ({
        $or: [
          { name: makeRegex(w) },
          { districtName: makeRegex(w) },
          { category: makeRegex(w) },
        ]
      })),
      isActive: true
    } : { name: new RegExp(q, 'i'), isActive: true };

    const districtConditions = words.length > 0 ? {
      $and: words.map(w => ({
        $or: [
          { name: makeRegex(w) },
          { highlights: { $elemMatch: { $regex: makeRegex(w) } } },
          { shortDescription: makeRegex(w) }
        ]
      })),
      isActive: true
    } : { name: new RegExp(q, 'i'), isActive: true };

    const [districts, places] = await Promise.all([
      District.find(districtConditions).limit(5).select('name slug image'),
      Place.find(placeConditions).limit(8).select('name slug districtName coverImage'),
    ]);

    res.json({ success: true, data: { districts, places } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAllDistricts, getDistrict, createDistrict, updateDistrict, deleteDistrict, search };
