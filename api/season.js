export default async function handler(req, res) {
  const API_KEY = process.env.SPORTRADAR_KEY;
  
  if (!API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  // Determine current season year (NBA season spans two calendar years)
  const now = new Date();
  const year = now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear();
  
  try {
    const response = await fetch(
      `https://api.sportradar.com/nba/trial/v8/en/games/${year}/REG/schedule.json`,
      { headers: { 'x-api-key': API_KEY } }
    );
    
    if (!response.ok) {
      throw new Error(`Sportradar API error: ${response.status}`);
    }
    
    const data = await response.json();
    res.setHeader('Cache-Control', 's-maxage=3600');
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
