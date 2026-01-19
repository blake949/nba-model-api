// api/health.js - Health check endpoint

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  res.status(200).json({
    status: 'ok',
    hasSportradarKey: !!process.env.SPORTRADAR_KEY,
    hasOddsApiKey: !!process.env.ODDS_API_KEY,
    timestamp: new Date().toISOString()
  });
}
