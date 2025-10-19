import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label } from 'recharts';
import { TestStatus, TestResult } from '../types';

interface TestPanelProps {
  status: TestStatus;
  results: { stageA: TestResult[], stageB: TestResult[] };
  onStart: () => void;
  progress: { current: number; total: number } | null;
  stats: {
    stageA: { correct: number; total: number };
    stageB: { correct: number; total: number };
  };
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 p-2 border border-gray-600 rounded">
        <p className="label text-cyan-400">{`Frequency: ${label} Hz`}</p>
        <p className="intro text-gray-200">{`Accuracy: ${(payload[0].value * 100).toFixed(1)}%`}</p>
      </div>
    );
  }
  return null;
};

const ResultsChart: React.FC<{data: TestResult[], title: string}> = ({ data, title }) => (
    <div className="mb-6">
        <h3 className="text-lg font-semibold text-center text-gray-300 mb-2">{title}</h3>
        <div className="h-60 bg-gray-900 p-2 rounded-md">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="frequency" stroke="#9ca3af" tick={{ fontSize: 12 }} unit=" Hz">
                    <Label value="Frequency" offset={-15} position="insideBottom" fill="#9ca3af" />
                </XAxis>
                <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} domain={[0, 1]} tickFormatter={(val) => `${Math.round(val * 100)}%`}>
                    <Label value="Accuracy" angle={-90} offset={10} position="insideLeft" style={{ textAnchor: 'middle', fill: '#9ca3af' }} />
                </YAxis>
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(34, 211, 238, 0.1)' }}/>
                <Bar dataKey="accuracy" name="Accuracy" fill="#22d3ee" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    </div>
);

const TestPanel: React.FC<TestPanelProps> = ({ status, results, onStart, progress, stats }) => {
  if (status === TestStatus.Idle) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold text-cyan-400 mb-4">Find Your Peak Visual Rhythm</h2>
        <p className="text-gray-300 mb-6">This automated test will find the frequency where your visual processing is sharpest.</p>
        <button
          onClick={onStart}
          className="px-8 py-4 text-xl font-bold text-white bg-cyan-600 rounded-md hover:bg-cyan-700 transition duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-800"
        >
          Start Test
        </button>
      </div>
    );
  }

  if (status === TestStatus.StageA || status === TestStatus.StageB) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold text-cyan-400 mb-4 animate-pulse">Test in Progress...</h2>
        <p className="text-lg text-gray-300 mb-2">
            {status === TestStatus.StageA ? 'Stage A: Finding your difficulty level' : 'Stage B: Measuring accuracy'}
        </p>
        {progress && (
            <p className="text-2xl font-mono text-white">Trial: {progress.current} / {progress.total}</p>
        )}
        <p className="mt-4 text-gray-400">Focus on the center of the screen.</p>
      </div>
    );
  }

  if (status === TestStatus.Complete) {
    const stageAResults = [...results.stageA].sort((a, b) => a.frequency - b.frequency);
    const stageBResults = [...results.stageB].sort((a, b) => a.frequency - b.frequency);
    const peak = stageBResults.length > 0 ? stageBResults.reduce((max, current) => current.accuracy > max.accuracy ? current : max, stageBResults[0]) : null;
    const stageAAccuracy = stats.stageA.total > 0 ? (stats.stageA.correct / stats.stageA.total * 100).toFixed(1) : 0;
    const stageBAccuracy = stats.stageB.total > 0 ? (stats.stageB.correct / stats.stageB.total * 100).toFixed(1) : 0;

    return (
      <div>
        <h2 className="text-2xl font-bold text-cyan-400 mb-2 text-center">Test Complete!</h2>
        {peak && <p className="text-center text-gray-300 mb-4">Your peak performance was at <strong>{peak.frequency} Hz</strong> with { (peak.accuracy * 100).toFixed(0) }% accuracy.</p>}
        
        <div className="text-center text-sm text-gray-400 mb-6 grid grid-cols-2 gap-2">
            <div>Stage A Accuracy: <strong className="text-white">{stageAAccuracy}%</strong></div>
            <div>Stage B Accuracy: <strong className="text-white">{stageBAccuracy}%</strong></div>
        </div>

        <ResultsChart data={stageAResults} title="Stage A: Coarse Tuning" />
        <ResultsChart data={stageBResults} title="Stage B: Fine Tuning" />
      </div>
    );
  }
  
  return null;
};

export default TestPanel;