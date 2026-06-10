const http = require('http');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectDB = require('../config/db');
const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/places', require('../routes/placeRoutes'));
app.use('/api/districts', require('../routes/districtRoutes'));

let server;

function startServer() {
  return new Promise((resolve) => {
    server = app.listen(5005, () => {
      console.log('Test server running on port 5005');
      resolve();
    });
  });
}

function stopServer() {
  return new Promise((resolve) => {
    server.close(() => {
      console.log('Test server stopped.');
      resolve();
    });
  });
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function runTest() {
  await connectDB();
  await startServer();

  console.log('\n=== TESTING ENDPOINT: /api/places?district=annakapalli ===');
  try {
    const res1 = await getJson('http://localhost:5005/api/places?district=annakapalli');
    console.log(`Success: ${res1.success}`);
    console.log(`Count: ${res1.count} (Expected: 10)`);
    console.log('Places:');
    res1.data.forEach(p => console.log(`  - ${p.name} (District: ${p.districtName}, ID: ${p.districtId})`));
  } catch (err) {
    console.error('Annakapalli API failed:', err.message);
  }

  console.log('\n=== TESTING ENDPOINT: /api/places?district=dr-br-ambedkar-konaseema ===');
  try {
    const res2 = await getJson('http://localhost:5005/api/places?district=dr-br-ambedkar-konaseema');
    console.log(`Success: ${res2.success}`);
    console.log(`Count: ${res2.count} (Expected: 10)`);
    console.log('Places:');
    res2.data.forEach(p => console.log(`  - ${p.name} (District: ${p.districtName}, ID: ${p.districtId})`));
  } catch (err) {
    console.error('Konaseema API failed:', err.message);
  }

  await stopServer();
  await mongoose.disconnect();
}

runTest().catch(console.error);
