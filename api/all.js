export default async function handler(req, res) {
  const API_KEY = process.env.SPORTRADAR_KEY;
  
  if (!API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
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

  // Fetch with 1 second delay between each to respect rate limits
  for (const [key, url] of Object.entries(endpoints)) {
    try {
      const response = await fetch(url, { headers: { 'x-api-key': API_KEY } });
      if (!response.ok) throw new Error(`${response.status}`);
      results[key] = await response.json();
    } catch (error) {
      errors[key] = error.message;
    }
    // Wait 1.1 seconds between requests (Sportradar trial = 1 req/sec)
    await new Promise(resolve => setTimeout(resolve, 1100));
  }

  res.setHeader('Cache-Control', 's-maxage=300');
  return res.status(200).json({ data: results, errors, timestamp: new Date().toISOString() });
}
