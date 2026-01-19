// api/today.js - Combined endpoint: games + odds + injuries

const SPORTRADAR_KEY = process.env.SPORTRADAR_KEY;
const ODDS_API_KEY = process.env.ODDS_API_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let games = [];
    let injuries = {};
    
    // 1. Fetch odds from The Odds API
    if (ODDS_API_KEY) {
      try {
        const oddsRes = await fetch(
          `https://api.the-odds-api.com/v4/sports/basketball_nba/odds/?apiKey=${ODDS_API_KEY}&regions=us&markets=spreads,totals&oddsFormat=american`
        );
        
        if (oddsRes.ok) {
          const oddsData = await oddsRes.json();
          
          games = oddsData.map((g, i) => {
            let spread = null;
            let total = null;
            
            for (const book of g.bookmakers || []) {
              if (!spread) {
                const spreadMarket = book.markets?.find(m => m.key === 'spreads');
                if (spreadMarket) {
                  const homeOutcome = spreadMarket.outcomes?.find(o => o.name === g.home_team);
                  if (homeOutcome) spread = homeOutcome.point;
                }
              }
              if (!total) {
                const totalMarket = book.markets?.find(m => m.key === 'totals');
                if (totalMarket) {
                  const overOutcome = totalMarket.outcomes?.find(o => o.name === 'Over');
                  if (overOutcome) total = overOutcome.point;
                }
              }
              if (spread !== null && total !== null) break;
            }
            
            const gameTime = new Date(g.commence_time);
            return {
              id: g.id || i,
              time: gameTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York' }),
              status: gameTime > new Date() ? 'scheduled' : 'live',
              home: g.home_team,
              away: g.away_team,
              spread: spread,
              total: total,
              source: 'odds-api'
            };
          });
        }
      } catch (e) {
        console.log('Odds API error:', e.message);
      }
    }
    
    // 2. Fallback to Sportradar for schedule
    if (games.length === 0 && SPORTRADAR_KEY) {
      try {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        
        const schedRes = await fetch(
          `https://api.sportradar.us/nba/trial/v8/en/games/${y}/${m}/${d}/schedule.json?api_key=${SPORTRADAR_KEY}`
        );
        
        if (schedRes.ok) {
          const schedData = await schedRes.json();
          games = (schedData.games || []).map((g, i) => ({
            id: g.id || i,
            time: new Date(g.scheduled).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York' }),
            status: g.status,
            home: g.home?.name || g.home?.alias,
            away: g.away?.name || g.away?.alias,
            spread: null,
            total: null,
            source: 'sportradar'
          }));
        }
      } catch (e) {
        console.log('Sportradar error:', e.message);
      }
    }
    
    // 3. Fetch injuries from Sportradar
    if (SPORTRADAR_KEY) {
      try {
        const injRes = await fetch(
          `https://api.sportradar.us/nba/trial/v8/en/league/injuries.json?api_key=${SPORTRADAR_KEY}`
        );
        
        if (injRes.ok) {
          const injData = await injRes.json();
          for (const team of injData.teams || []) {
            const teamName = team.name || team.alias;
            injuries[teamName] = (team.players || []).map(p => ({
              name: p.full_name,
              position: p.position,
              status: p.injury?.status || 'Unknown'
            }));
          }
        }
      } catch (e) {
        console.log('Injuries error:', e.message);
      }
    }
    
    res.status(200).json({
      date: new Date().toISOString().split('T')[0],
      gamesCount: games.length,
      hasOdds: games.some(g => g.spread !== null),
      games,
      injuries,
      sources: {
        odds: ODDS_API_KEY ? 'the-odds-api' : 'none',
        injuries: SPORTRADAR_KEY ? 'sportradar' : 'none'
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
