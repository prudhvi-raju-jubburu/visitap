const fs = require('fs');
const path = require('path');
const REPORT_FILE = path.join(__dirname, '..', 'reports', 'image-audit.json');

const issues = JSON.parse(fs.readFileSync(REPORT_FILE, 'utf-8'));
const counts = {};
issues.forEach(issue => {
  counts[issue.issue] = (counts[issue.issue] || 0) + 1;
});
console.log('Issue counts:', JSON.stringify(counts, null, 2));
