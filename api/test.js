// api/test.js - Simple test endpoint

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  res.status(200).json({
    message: 'API is working!',
    sportradarKey: process.env.SPORTRADAR_KEY ? 'configured' : 'MISSING',
    oddsApiKey: process.env.ODDS_API_KEY ? 'configured' : 'MISSING',
    timestamp: new Date().toISOString()
  });
}
