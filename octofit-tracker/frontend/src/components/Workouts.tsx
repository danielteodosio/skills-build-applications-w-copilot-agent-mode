import { useApiData } from '../api/useApiData.js';

type Workout = { _id?: string; title: string; focus: string; minutes: number; difficulty: string; reason: string };
type WorkoutsResponse = { suggestions: Workout[] };

export default function Workouts() {
  const { data, error, loading } = useApiData<WorkoutsResponse>('/api/workouts/suggestions/mona%40example.com');
  const suggestions = data?.suggestions ?? [];

  return <section className="card h-100"><div className="card-body">
    <h2 className="h4">Workout suggestions</h2>
    <p>Recommend workouts from activity patterns.</p>
    {loading ? <p role="status">Loading workout suggestions...</p> : error ? <p role="alert">{error}</p> : suggestions.length === 0 ? <p role="status">No workout suggestions available.</p> : <ul className="list-group list-group-flush">
      {suggestions.map((workout, index) => <li className="list-group-item px-0" key={workout._id ?? `${workout.title}-${index}`}>
        <strong>{workout.title}</strong> · {workout.focus} · {workout.minutes} minutes · {workout.difficulty}
        <p className="mb-0">{workout.reason}</p>
      </li>)}
    </ul>}
  </div></section>;
}
