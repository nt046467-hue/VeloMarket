const fs = require('fs');
const path = require('path');
const https = require('https');

const seedFile = path.join(__dirname, '..', 'prisma', 'seed.ts');
const content = fs.readFileSync(seedFile, 'utf8');

// Match img('photo-xxx') patterns
const imgRegex = /img\(['"](photo-[a-zA-Z0-9\-]+)['"]\)/g;
const photos = [];
let match;
while ((match = imgRegex.exec(content)) !== null) {
  photos.push(match[1]);
}

const uniquePhotos = Array.from(new Set(photos));

function checkPhoto(id) {
  return new Promise((resolve) => {
    const url = `https://images.unsplash.com/${id}?auto=format&fit=crop&w=100&q=80`;
    https.get(url, (res) => {
      resolve({ id, ok: res.statusCode === 200, status: res.statusCode });
    }).on('error', (e) => {
      resolve({ id, ok: false, error: e.message });
    });
  });
}

async function run() {
  console.log(`Checking ${uniquePhotos.length} photos...`);
  const results = [];
  for (let i = 0; i < uniquePhotos.length; i++) {
    const id = uniquePhotos[i];
    const res = await checkPhoto(id);
    results.push(res);
  }
  
  const failed = results.filter(r => !r.ok);
  const summary = {
    totalChecked: results.length,
    okCount: results.length - failed.length,
    failedCount: failed.length,
    failedList: failed
  };

  fs.writeFileSync(path.join(__dirname, 'audit-results.json'), JSON.stringify(summary, null, 2));
  console.log('Done! Results written to scratch/audit-results.json');
}

run();
