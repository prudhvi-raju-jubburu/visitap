const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });

const Place = require('../backend/models/Place');
const connectDB = require('../backend/config/db');

const check = async () => {
    await connectDB();

    const lng = 83.3218;
    const lat = 17.7144;
    const radiusInMeters = 5000;

    console.log(`Checking places near [${lng}, ${lat}] within ${radiusInMeters}m...`);

    const filter = {
        isActive: true,
        location: {
            $near: {
                $geometry: { type: 'Point', coordinates: [lng, lat] },
                $maxDistance: radiusInMeters,
            },
        },
    };

    try {
        const places = await Place.find(filter).select('name location');
        console.log(`Found ${places.length} places:`);
        places.forEach(p => console.log(`- ${p.name} at ${p.location.coordinates}`));
    } catch (err) {
        console.error('Query error:', err.message);
    }

    process.exit(0);
};

check();
