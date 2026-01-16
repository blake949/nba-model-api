const https = require('https');

function fetchData(url, apiKey) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: { 'x-api-key': apiKey }
    };
    
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ ok: res.statusCode === 200, status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ ok: false, status: res.statusCode, data: null });
        }
      });
    }).on('error', (e) => {
      reject(e);
    });
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const API_KEY = process.env.SPORTRADAR_KEY;
  
  if (!API_KEY) {
    return res.status(200).json({ 
      error: 'SPORTRADAR_KEY not configured',
      data: {},
      errors: { config: 'Add SPORTRADAR_KEY in Vercel Settings' }
    });
  }

  const today = new Date();
  const dateStr = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;
  const year = today.getMonth() >= 9 ? today.getFullYear() + 1 : today.getFullYear();
  
  const endpoints = {
    schedule: `https://api.sportradar.com/nba/trial/v8/en/games/${dateStr}/schedule.json`,
    season: `https://api.sportradar.com/nba/trial/v8/en/games/${year}/REG/schedule.json`,
    standings: `https://api.sportradar.com/nba/trial/v8/en/seasons/${year}/REG/standings.json`,
    injuries: `https://api.sportradar.com/nba/trial/v8/en/league/injuries.json`
  };

  const results = {};
  const errors = {};

  for (const [key, url] of Object.entries(endpoints)) {
    try {
      const response = await fetchData(url, API_KEY);
      
      if (response.ok) {
        results[key] = response.data;
      } else {
        errors[key] = `HTTP ${response.status}`;
      }
    } catch (error) {
      errors[key] = error.message;
    }
    
    // Wait 1.1 seconds between requests (rate limit)
    if (key !== 'injuries') {
      await sleep(1100);
    }
  }

  return res.status(200).json({ 
    data: results, 
    errors: Object.keys(errors).length > 0 ? errors : null,
    timestamp: new Date().toISOString()
  });
}
