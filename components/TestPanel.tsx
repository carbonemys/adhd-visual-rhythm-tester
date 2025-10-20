import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label, ComposedChart, Area, Line, ReferenceLine } from 'recharts';
// FIX: Swapped TooltipProps for the correct type for a custom tooltip content component.
import { NameType, ValueType, Props as TooltipContentProps } from 'recharts/types/component/DefaultTooltipContent';
import { TestStatus, TestResult, StageAResult } from '../types';
import { TEST_CONFIG } from '../constants';

interface TestPanelProps {
  status: TestStatus;
  results: { stageA: StageAResult[], stageB: TestResult[] };
  onStart: (isStageBOnly?: boolean, customConfig?: {noise: number, frequencies: number[]}) => void;
  progress: { current: number; total: number } | null;
  stats: {
    stageA: { correct: number; total: number };
    stageB: { correct: number; total: number };
  };
  stageBSelection: number[];
  setStageBSelection: (selection: number[]) => void;
  onStartStageB: () => void;
  stageBNoiseLevel: number | null;
  onDownload: (format: 'csv' | 'json') => void;
}

// FIX: Corrected the type for the custom tooltip's props. `TooltipProps` from `recharts` is for the `<Tooltip />`
// component itself. The props passed to a custom `content` component are defined in `TooltipContentProps` (aliased
// from `Props` from `recharts/types/component/DefaultTooltipContent`), which resolves the type error.
const CustomTooltip = ({ active, payload, label }: TooltipContentProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const accuracy = data.accuracy !== undefined ? `${(data.accuracy * 100).toFixed(1)}%` : null;
    const threshold = data.threshold !== undefined ? `${(data.threshold * 100).toFixed(1)}%` : null;

    return (
      <div className="bg-gray-800 p-2 border border-gray-600 rounded text-sm">
        <p className="label text-cyan-400">{`Frequency: ${label} Hz`}</p>
        {accuracy && <p className="intro text-gray-200">{`Accuracy: ${accuracy}`}</p>}
        {threshold && <p className="intro text-gray-200">{`Threshold: ${threshold}`}</p>}
        {data.wasPinned && <p className='text-yellow-400'>Staircase Pinned</p>}
      </div>
    );
  }
  return null;
};

const StageBChart: React.FC<{data: TestResult[], title: string}> = ({ data, title }) => (
    <div className="mb-6">
        <h3 className="text-lg font-semibold text-center text-gray-300 mb-2">{title}</h3>
        <div className="h-60 bg-gray-900 p-2 rounded-md">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[...data].sort((a,b) => a.frequency - b.frequency)} margin={{ top: 5, right: 5, left: -25, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="frequency" stroke="#9ca3af" tick={{ fontSize: 12 }} unit=" Hz">
                    <Label value="Frequency (Hz)" offset={-15} position="insideBottom" fill="#9ca3af" />
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

const StageAChart: React.FC<{ data: StageAResult[] }> = ({ data }) => {
    const chartData = [...data].sort((a, b) => a.frequency - b.frequency);
    return (
        <div className="mb-6">
            <h3 className="text-lg font-semibold text-center text-gray-300 mb-2">Stage A: Noise Threshold</h3>
             <div className="h-60 bg-gray-900 p-2 rounded-md">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="frequency" stroke="#9ca3af" tick={{ fontSize: 12 }} unit=" Hz">
                             <Label value="Frequency (Hz)" offset={-15} position="insideBottom" fill="#9ca3af" />
                        </XAxis>
                        <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} domain={[TEST_CONFIG.noiseMin, TEST_CONFIG.noiseMax]} tickFormatter={(val) => `${(val * 100).toFixed(0)}%`} yAxisId="left">
                            <Label value="Noise Level" angle={-90} offset={10} position="insideLeft" style={{ textAnchor: 'middle', fill: '#9ca3af' }} />
                        </YAxis>
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(249, 115, 22, 0.1)' }}/>
                        <Area dataKey="range" fill="rgba(34, 211, 238, 0.2)" stroke="rgba(34, 211, 238, 0.4)" activeDot={false} yAxisId="left" />
                        <Line type="monotone" dataKey="threshold" stroke="#f97316" strokeWidth={2} dot={(props) => {
                            const { payload } = props;
                            if (payload.wasPinned) {
                                return <svg x={props.cx-5} y={props.cy-5} width="10" height="10" fill="#facc15" viewBox="0 0 1024 1024"><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm-32 232c0-4.4 3.6-8 8-8h48c4.4 0 8 3.6 8 8v272c0 4.4-3.6 8-8 8h-48c-4.4 0-8-3.6-8-8V296zm32 440a48 48 0 100-96 48 48 0 100 96z"></path></svg>;
                            }
                            return <circle cx={props.cx} cy={props.cy} r={4} stroke="#f97316" fill="#f97316" />;
                        }} activeDot={{ r: 6 }} yAxisId="left" />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};


const FrequencySelector: React.FC<{
    selected: number[];
    onToggle: (freq: number) => void;
    limit: number;
}> = ({ selected, onToggle, limit }) => {
    const allFrequencies = Array.from({ length: 30 }, (_, i) => i + 1);

    return (
        <div className="grid grid-cols-6 gap-2 mt-4">
            {allFrequencies.map(freq => {
                const isSelected = selected.includes(freq);
                const isDisabled = !isSelected && selected.length >= limit;
                return (
                    <button
                        key={freq}
                        onClick={() => onToggle(freq)}
                        disabled={isDisabled}
                        className={`py-1 text-sm font-mono rounded transition duration-150 border-2 ${
                            isSelected 
                                ? 'bg-cyan-500 border-cyan-400 text-white' 
                                : isDisabled 
                                ? 'bg-gray-700 border-gray-600 text-gray-500 cursor-not-allowed'
                                : 'bg-gray-600 border-gray-500 text-gray-200 hover:bg-gray-500 hover:border-gray-400'
                        }`}
                    >
                        {freq}
                    </button>
                );
            })}
        </div>
    );
}

const TestPanel: React.FC<TestPanelProps> = ({ status, results, onStart, progress, stats, stageBSelection, setStageBSelection, onStartStageB, stageBNoiseLevel, onDownload }) => {
  
  const [isCustomSetup, setIsCustomSetup] = useState(false);
  const [customNoise, setCustomNoise] = useState(TEST_CONFIG.initialNoise);
  const [customFrequencies, setCustomFrequencies] = useState<number[]>([]);

  const handleCustomFrequencyToggle = (freq: number) => {
    const isSelected = customFrequencies.includes(freq);
    if (isSelected) {
        setCustomFrequencies(customFrequencies.filter(f => f !== freq));
    } else if (customFrequencies.length < 5) {
        setCustomFrequencies([...customFrequencies, freq].sort((a, b) => a - b));
    }
  };

  if (status === TestStatus.Idle) {
    return (
      <div>
        <div className="text-center">
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">Find Your Peak Visual Rhythm</h2>
            <p className="text-gray-300 mb-6">This automated test guides you through two stages to find your peak performance.</p>
            <button
                onClick={() => onStart(false)}
                className="w-full px-8 py-4 text-xl font-bold text-white bg-cyan-600 rounded-md hover:bg-cyan-700 transition duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-800"
            >
                Start Full Test
            </button>
        </div>

        <div className="mt-6 border-t border-gray-700 pt-4 text-center">
            <button onClick={() => setIsCustomSetup(!isCustomSetup)} className="text-sm text-cyan-400 hover:text-cyan-300">
                {isCustomSetup ? '▼ Hide' : '▶ Show'} Advanced Setup (Skip to Stage B)
            </button>

            {isCustomSetup && (
                <div className="mt-4 p-4 bg-gray-900 rounded-lg text-left">
                    <p className="text-gray-300 mb-4 text-sm text-center">Manually configure and run only the fine-tuning stage.</p>
                    
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-300 mb-1">Fixed Noise Level</label>
                        <div className="flex items-center space-x-3">
                        <input
                            type="range" min={TEST_CONFIG.noiseMin} max={TEST_CONFIG.noiseMax} step="0.001"
                            value={customNoise}
                            onChange={(e) => setCustomNoise(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-cyan-400 font-mono w-24 text-right">{(customNoise * 100).toFixed(2)}%</span>
                        </div>
                    </div>
                    
                    <label className="block text-sm font-medium text-gray-300">Select 5 Frequencies ({customFrequencies.length}/5)</label>
                    <FrequencySelector selected={customFrequencies} onToggle={handleCustomFrequencyToggle} limit={5} />
                    
                    <button
                        onClick={() => onStart(true, { noise: customNoise, frequencies: customFrequencies })}
                        disabled={customFrequencies.length !== 5}
                        className="w-full mt-6 px-8 py-3 text-lg font-bold text-white bg-cyan-600 rounded-md hover:bg-cyan-700 transition duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                    >
                        Start Stage B Only
                    </button>
                </div>
            )}
        </div>
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

  if (status === TestStatus.Intermission) {
    const handleSelectionToggle = (freq: number) => {
        const isSelected = stageBSelection.includes(freq);
        if (isSelected) {
            setStageBSelection(stageBSelection.filter(f => f !== freq));
        } else if (stageBSelection.length < 5) {
            setStageBSelection([...stageBSelection, freq].sort((a, b) => a - b));
        }
    };
    return (
        <div>
            <h2 className="text-2xl font-bold text-cyan-400 mb-2 text-center">Stage A Complete</h2>
             {stageBNoiseLevel && (
                <div className="bg-gray-900 rounded-lg p-3 my-4 text-center">
                    <p className="text-sm text-gray-400">Stage B Fixed Noise Level (based on non-pinned results)</p>
                    <p className="text-3xl font-mono font-bold text-cyan-400">{(stageBNoiseLevel * 100).toFixed(1)}%</p>
                </div>
            )}
            <p className="text-center text-gray-300 mb-4">Select 5 frequencies for the fine-tuning stage. We've suggested a starting set based on your results.</p>
            <StageAChart data={results.stageA} />
            <FrequencySelector selected={stageBSelection} onToggle={handleSelectionToggle} limit={5} />
            <button
                onClick={onStartStageB}
                disabled={stageBSelection.length !== 5}
                className="w-full mt-6 px-8 py-3 text-lg font-bold text-white bg-cyan-600 rounded-md hover:bg-cyan-700 transition duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-800"
            >
                {`Start Stage B (${stageBSelection.length}/5)`}
            </button>
        </div>
    );
  }

  if (status === TestStatus.Complete) {
    const stageAResults = results.stageA;
    const stageBResults = results.stageB;
    const peak = stageBResults.length > 0 ? stageBResults.reduce((max, current) => current.accuracy > max.accuracy ? current : max, stageBResults[0]) : null;
    const stageAAccuracy = stats.stageA.total > 0 ? (stats.stageA.correct / stats.stageA.total * 100).toFixed(1) : 0;
    const stageBAccuracy = stats.stageB.total > 0 ? (stats.stageB.correct / stats.stageB.total * 100).toFixed(1) : 0;
    const ranStageA = stageAResults.length > 0;

    return (
      <div>
        <h2 className="text-2xl font-bold text-cyan-400 mb-2 text-center">Test Complete!</h2>
        {peak && <p className="text-center text-gray-300 mb-4">Your peak performance was at <strong>{peak.frequency} Hz</strong> with { (peak.accuracy * 100).toFixed(0) }% accuracy.</p>}
        
        <div className="text-center text-sm text-gray-400 mb-6 grid grid-cols-1 gap-2">
            {ranStageA && <div>Stage A Accuracy: <strong className="text-white">{stageAAccuracy}%</strong></div>}
            <div>{ranStageA ? 'Stage B' : 'Overall'} Accuracy: <strong className="text-white">{stageBAccuracy}%</strong></div>
        </div>

        {ranStageA && <StageAChart data={stageAResults} />}
        <StageBChart data={stageBResults} title={ranStageA ? "Stage B: Fine Tuning Accuracy" : "Custom Test Results"} />
        
        <div className='mt-6 text-center'>
            <p className='text-gray-300 mb-2 font-semibold'>Download Raw Data</p>
            <div className='flex justify-center space-x-4'>
                <button onClick={() => onDownload('csv')} className='px-4 py-2 text-sm bg-gray-600 hover:bg-gray-500 rounded'>CSV</button>
                <button onClick={() => onDownload('json')} className='px-4 py-2 text-sm bg-gray-600 hover:bg-gray-500 rounded'>JSON</button>
            </div>
        </div>

        <button
          onClick={() => onStart(false)}
          className="w-full mt-6 px-8 py-3 text-lg font-bold text-white bg-cyan-600 rounded-md hover:bg-cyan-700 transition duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-800"
        >
          Run Full Test Again
        </button>
      </div>
    );
  }
  
  return null;
};

export default TestPanel;
