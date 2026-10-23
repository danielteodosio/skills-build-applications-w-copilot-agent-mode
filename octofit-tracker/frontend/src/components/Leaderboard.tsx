import { useApiData } from '../api/useApiData.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };
type LeaderboardResponse = { leaderboard: LeaderboardEntry[] };

export default function Leaderboard() {
  const { data, error, loading } = useApiData<LeaderboardResponse>('/api/leaderboard');
  const entries = data?.leaderboard ?? [];

  return <section className="card h-100"><div className="card-body">
    <h2 className="h4">Leaderboard</h2>
    <p>Compare team point totals.</p>
    {loading ? <p role="status">Loading leaderboard...</p> : error ? <p role="alert">{error}</p> : entries.length === 0 ? <p role="status">No leaderboard scores yet.</p> : <ol className="list-group list-group-numbered list-group-flush">
      {entries.map((entry) => <li className="list-group-item d-flex justify-content-between px-0" key={entry.rank}>
        <span>{entry.teamName}</span><strong>{entry.totalPoints} points</strong>
      </li>)}
    </ol>}
  </div></section>;
}
