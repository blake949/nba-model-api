export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const API_KEY = process.env.SPORTRADAR_KEY;
  
  if (!API_KEY) {
    return res.status(500).json({ 
      error: 'SPORTRADAR_KEY not configured',
      help: 'Add SPORTRADAR_KEY in Vercel Settings'
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
      const response = await fetch(url, { 
        headers: { 'x-api-key': API_KEY }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      results[key] = await response.json();
    } catch (error) {
      errors[key] = error.message;
    }
    
    if (key !== 'injuries') {
      await new Promise(resolve => setTimeout(resolve, 1100));
    }
  }

  return res.status(200).json({ 
    data: results, 
    errors: Object.keys(errors).length > 0 ? errors : null,
    timestamp: new Date().toISOString()
  });
}

