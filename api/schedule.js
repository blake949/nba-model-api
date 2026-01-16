export default async function handler(req, res) {
  const API_KEY = process.env.SPORTRADAR_KEY;
  
  if (!API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const today = new Date();
  const dateStr = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;
  
  try {
    const response = await fetch(
      `https://api.sportradar.com/nba/trial/v8/en/games/${dateStr}/schedule.json`,
      { headers: { 'x-api-key': API_KEY } }
    );
    
    if (!response.ok) {
      throw new Error(`Sportradar API error: ${response.status}`);
    }
    
    const data = await response.json();
    res.setHeader('Cache-Control', 's-maxage=300');
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
