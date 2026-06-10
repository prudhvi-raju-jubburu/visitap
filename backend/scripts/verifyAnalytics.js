const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load Env
dotenv.config({ path: path.join(__dirname, '../.env') });

const AnalyticsEvent = require('../models/AnalyticsEvent');
const Place = require('../models/Place');
const District = require('../models/District');
const User = require('../models/User');

const ALLOWED_EVENTS = [
  "PLACE_VIEW", "DISTRICT_VIEW", "SEARCH", "VOICE_SEARCH",
  "SEARCH_RESULT_CLICK", "SEARCH_NO_RESULT",
  "SAVE_PLACE", "SAVE_DISTRICT", "CREATE_TRIP", "SHARE_TRIP",
  "REVIEW_SUBMITTED", "USER_REGISTERED", "USER_LOGIN", "FEEDBACK_SUBMITTED"
];

async function runAudit() {
  console.log('🏁 Starting Analytics Event Data Integrity Audit...');
  
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('📡 Connected to MongoDB Atlas.');

    const events = await AnalyticsEvent.find({});
    console.log(`📊 Found ${events.length} total analytics events to audit.`);

    const report = {
      auditTimestamp: new Date(),
      totalEventsAudited: events.length,
      invalidEvents: [],
      eventCounts: {},
      summary: {
        valid: 0,
        invalid: 0
      }
    };

    // Initialize counts
    ALLOWED_EVENTS.forEach(e => {
      report.eventCounts[e] = 0;
    });

    for (const event of events) {
      let isValid = true;
      const issues = [];

      // 1. Verify Event Type
      if (!ALLOWED_EVENTS.includes(event.eventType)) {
        isValid = false;
        issues.push(`Invalid eventType: "${event.eventType}"`);
      } else {
        report.eventCounts[event.eventType]++;
      }

      // 2. Verify Place Reference
      if (event.placeId) {
        if (!mongoose.Types.ObjectId.isValid(event.placeId)) {
          isValid = false;
          issues.push(`Invalid placeId ObjectId format: ${event.placeId}`);
        } else {
          const placeExists = await Place.findById(event.placeId);
          if (!placeExists) {
            isValid = false;
            issues.push(`placeId reference not found in database: ${event.placeId}`);
          }
        }
      }

      // 3. Verify District Reference
      if (event.districtId) {
        if (!mongoose.Types.ObjectId.isValid(event.districtId)) {
          isValid = false;
          issues.push(`Invalid districtId ObjectId format: ${event.districtId}`);
        } else {
          const districtExists = await District.findById(event.districtId);
          if (!districtExists) {
            isValid = false;
            issues.push(`districtId reference not found in database: ${event.districtId}`);
          }
        }
      }

      // 4. Verify User Reference
      if (event.userId) {
        if (!mongoose.Types.ObjectId.isValid(event.userId)) {
          isValid = false;
          issues.push(`Invalid userId ObjectId format: ${event.userId}`);
        } else {
          const userExists = await User.findById(event.userId);
          if (!userExists) {
            isValid = false;
            issues.push(`userId reference not found in database: ${event.userId}`);
          }
        }
      }

      if (isValid) {
        report.summary.valid++;
      } else {
        report.summary.invalid++;
        report.invalidEvents.push({
          eventId: event._id,
          eventType: event.eventType,
          issues
        });
      }
    }

    // Write report
    const reportsDir = path.join(__dirname, '../reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir);
    }
    const reportPath = path.join(reportsDir, 'analytics-audit.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`\n✅ Audit complete!`);
    console.log(`   - Valid events: ${report.summary.valid}`);
    console.log(`   - Invalid events: ${report.summary.invalid}`);
    console.log(`📋 Detailed report written to: ${reportPath}`);

  } catch (error) {
    console.error('❌ Audit encountered an error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database.');
  }
}

runAudit();
