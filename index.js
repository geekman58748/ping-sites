const http = require('http');
const https = require('https');

const URLS = (process.env.LIST_OF_URLS || '').split(',').map(s => s.trim()).filter(Boolean);
const INTERVAL_SECONDS = parseInt(process.env.INTERVAL_SECONDS || '240', 10);

console.log(`[pinger] targets: ${URLS.length ? URLS.join(', ') : '(none)'}`);
console.log(`[pinger] interval: ${INTERVAL_SECONDS}s`);

function ping(url) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const req = proto.get(url, { timeout: 15000 }, (res) => {
      resolve({ url, status: res.statusCode });
    });
    req.on('error', (err) => reject({ url, error: err.message }));
    req.on('timeout', () => { req.destroy(); reject({ url, error: 'timeout' }); });
  });
}

async function run() {
  if (!URLS.length) {
    console.log('[pinger] no URLs configured, skipping');
    return;
  }
  const results = await Promise.allSettled(URLS.map(ping));
  for (const r of results) {
    if (r.status === 'fulfilled') {
      console.log(`[pinger] OK ${r.value.status} ${r.value.url}`);
    } else {
      console.log(`[pinger] FAIL ${r.value.error} ${r.value.url}`);
    }
  }
}

run();
setInterval(run, INTERVAL_SECONDS * 1000);
