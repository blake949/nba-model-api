export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const API_KEY = process.env.SPORTRADAR_KEY;
  
  return res.status(200).json({
    status: 'API is working!',
    apiKeyConfigured: API_KEY ? 'Yes' : 'NO - Add SPORTRADAR_KEY to Environment Variables!',
    timestamp: new Date().toISOString()
  });
}
```
