import { Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function requestError(message: string, status = 400) {
  return Object.assign(new Error(message), { status });
}

function recordInput(input: unknown): Record<string, unknown> {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw requestError('Request body must be an object');
  }
  return input as Record<string, unknown>;
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  const { userId, teamId, type, minutes } = recordInput(input);
  if (typeof userId !== 'string' || !Types.ObjectId.isValid(userId)) {
    throw requestError('A valid userId is required');
  }
  if (typeof teamId !== 'string' || !Types.ObjectId.isValid(teamId)) {
    throw requestError('A valid teamId is required');
  }
  if (typeof type !== 'string' || !type.trim()) {
    throw requestError('An activity type is required');
  }
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    throw requestError('Minutes must be a positive number');
  }

  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user || !team) throw requestError('The specified user or team does not exist');

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  const { name, mascot, members = [] } = recordInput(input);
  if (typeof name !== 'string' || !name.trim()) throw requestError('A team name is required');
  if (typeof mascot !== 'string' || !mascot.trim()) throw requestError('A team mascot is required');
  if (!Array.isArray(members) || members.some((member) => typeof member !== 'string' || !Types.ObjectId.isValid(member))) {
    throw requestError('Members must be an array of valid user IDs');
  }
  if (members.length > 0) {
    const memberCount = await User.countDocuments({ _id: { $in: members } });
    if (memberCount !== members.length) throw requestError('One or more team members do not exist');
  }

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members });
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate<{ _id: Types.ObjectId; totalPoints: number }>([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1, _id: 1 } },
  ]);
  const teams = await Team.find({ _id: { $in: totals.map(({ _id }) => _id) } }).lean();
  const teamNames = new Map(teams.map((team) => [team._id.toString(), team.name]));

  return totals
    .filter(({ _id }) => teamNames.has(_id.toString()))
    .map(({ _id, totalPoints }, index) => ({
      teamName: teamNames.get(_id.toString()),
      totalPoints,
      rank: index + 1,
    }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) throw requestError('User not found', 404);

  const recentActivity = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const preferredFocus = user.fitnessGoal || recentActivity?.type;
  const workouts = await Workout.find().lean();
  return workouts
    .sort((first, second) => Number(second.focus === preferredFocus) - Number(first.focus === preferredFocus))
    .map((workout) => ({
      ...workout,
      reason: workout.focus === user.fitnessGoal
        ? `Matches your ${user.fitnessGoal} fitness goal.`
        : workout.focus === recentActivity?.type
          ? `Builds on your recent ${recentActivity.type} activity.`
          : 'A good way to vary your training.',
    }));
}

export { User };
