import { useState } from 'react';
import { WatchHistoryItem, UserStats } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { PieChart as PieIcon, BarChart3, Clock, Film, Sparkles } from 'lucide-react';
import { normalizeIsoDate } from '@/lib/utils';

interface ProfileAnalyticsProps {
  watchHistory: WatchHistoryItem[];
  stats: UserStats;
}

const COLORS = ['#f97316', '#eab308', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6'];

export default function ProfileAnalytics({ watchHistory, stats }: ProfileAnalyticsProps) {
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | 'all'>('30d');
  const cutoff = timeframe === '7d' ? Date.now() - 7 * 24 * 60 * 60 * 1000 : timeframe === '30d' ? Date.now() - 30 * 24 * 60 * 60 * 1000 : 0;
  const history = watchHistory.filter((item) => {
    if (!cutoff) return true;
    const ts = new Date(normalizeIsoDate(item.watchedAt)).getTime();
    return Number.isNaN(ts) ? false : ts >= cutoff;
  });

  // Compute Genre Distribution
  const genreCounts: { [key: string]: number } = {};
  history.forEach((item) => {
    (item.genre || []).forEach((g) => {
      genreCounts[g] = (genreCounts[g] || 0) + 1;
    });
  });

  const genreData = Object.entries(genreCounts)
    .map(([name, count]) => ({ name, value: count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const displayGenreData = genreData;

  // Time of Day distribution (Morning, Afternoon, Evening, Night)
  const timeOfDayCounts = {
    'Morning (6am-12pm)': 0,
    'Afternoon (12pm-6pm)': 0,
    'Evening (6pm-12am)': 0,
    'Night (12am-6am)': 0,
  };

  history.forEach((h) => {
    const date = new Date(normalizeIsoDate(h.watchedAt));
    const hour = date.getHours();
    if (hour >= 6 && hour < 12) timeOfDayCounts['Morning (6am-12pm)']++;
    else if (hour >= 12 && hour < 18) timeOfDayCounts['Afternoon (12pm-6pm)']++;
    else if (hour >= 18 && hour < 24) timeOfDayCounts['Evening (6pm-12am)']++;
    else timeOfDayCounts['Night (12am-6am)']++;
  });

  const timeOfDayData = Object.entries(timeOfDayCounts).map(([period, count]) => ({
    period: period.split(' ')[0],
    streams: count,
  }));
  const watchedSeconds = history.reduce((sum, item) => sum + Math.max(0, item.progressSeconds || 0), 0);
  const averageMinutes = history.length ? Math.round(watchedSeconds / history.length / 60) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between pb-2 border-b border-gray-800">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-orange-400" />
            Taste & Watching Analytics
          </h2>
          <p className="text-gray-400 text-xs mt-0.5">
            Deep insights into your cinema streaming habits and genre preferences
          </p>
        </div>

        <div className="flex items-center gap-1 bg-gray-900 p-1 rounded-xl border border-gray-800">
          <button
            onClick={() => setTimeframe('7d')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold ${
              timeframe === '7d' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setTimeframe('30d')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold ${
              timeframe === '30d' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            30 Days
          </button>
          <button
            onClick={() => setTimeframe('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold ${
              timeframe === 'all' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Genre Distribution Pie Chart */}
        <Card className="bg-gray-900/70 border-gray-800 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-orange-400" />
              Genre Affinity Distribution
            </CardTitle>
            <CardDescription className="text-gray-400 text-xs">
              Breakdown of genres across watched titles
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="h-52 w-52 shrink-0">
              {displayGenreData.length ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={displayGenreData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">{displayGenreData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip contentStyle={{ backgroundColor: '#0b101d', border: '1px solid rgba(249,115,22,0.4)', borderRadius: '8px', color: '#ffffff', fontSize: '12px' }} /></PieChart></ResponsiveContainer> : <div className="grid h-full place-items-center rounded-full border border-dashed border-gray-700 p-8 text-center text-xs text-gray-500">Watch a title to unlock your genre profile.</div>}
            </div>

            <div className="flex-1 w-full space-y-2">
              {displayGenreData.map((g, idx) => (
                <div key={g.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span className="text-gray-300 font-medium">{g.name}</span>
                  </div>
                  <span className="text-gray-400 font-mono">{g.value} titles</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Time of Day Viewing Bar Chart */}
        <Card className="bg-gray-900/70 border-gray-800 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-400" />
              Peak Streaming Times
            </CardTitle>
            <CardDescription className="text-gray-400 text-xs">
              When you are most active on OrangeFlix
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeOfDayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="period" stroke="#6b7280" fontSize={11} tickLine={false} />
                  <YAxis stroke="#6b7280" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0b101d',
                      border: '1px solid rgba(249,115,22,0.4)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '12px',
                    }}
                    formatter={(val: number) => [`${val} sessions`, 'Activity']}
                  />
                  <Bar dataKey="streams" fill="#f97316" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Highlight Box */}
      <Card className="bg-gradient-to-r from-orange-950/20 via-gray-900 to-yellow-950/20 border-orange-500/30">
        <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-white font-bold text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-400" />
              Viewing Pattern Analysis
            </h4>
            <p className="text-gray-300 text-xs leading-relaxed max-w-xl">
              {history.length ? <>You prefer <strong>{stats.moviesWatched >= stats.seriesWatched ? 'Cinema Movies' : 'TV Series'}</strong>{displayGenreData[0] ? <> with a strong interest in <strong>{displayGenreData[0].name}</strong></> : ''}. Your average recorded session lasts <strong>{averageMinutes} minutes</strong>.</> : <>Start watching to unlock a personal picture of your genres, preferred format, and viewing rhythm.</>}
            </p>
          </div>

          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs px-3 py-1 font-bold shrink-0">
            {stats.streakDays > 1 ? `${stats.streakDays} Day Active Streak 🔥` : 'Active Member'}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}
