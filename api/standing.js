export default async function handler(req, res) {
  const API_KEY = process.env.SPORTRADAR_KEY;
  
  if (!API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const now = new Date();
  const year = now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear();
  
  try {
    const response = await fetch(
      `https://api.sportradar.com/nba/trial/v8/en/seasons/${year}/REG/standings.json`,
      { headers: { 'x-api-key': API_KEY } }
    );
    
    if (!response.ok) {
      throw new Error(`Sportradar API error: ${response.status}`);
    }
    
    const data = await response.json();
    res.setHeader('Cache-Control', 's-maxage=1800');
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
