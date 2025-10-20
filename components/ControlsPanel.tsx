import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ExperimentSettings } from '../types';
import { generateEnvelope } from '../lib/stimulus-logic';
import { DEFAULT_STIMULUS_CONFIG } from '../constants';

interface ControlsPanelProps {
  settings: ExperimentSettings;
  onSettingsChange: (settings: ExperimentSettings) => void;
}

const Slider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
}> = ({ label, value, min, max, step, unit, onChange }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
    <div className="flex items-center space-x-3">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
      />
      <span className="text-cyan-400 font-mono w-20 text-right">{value} {unit}</span>
    </div>
  </div>
);

const ControlsPanel: React.FC<ControlsPanelProps> = ({ settings, onSettingsChange }) => {

  const chartData = useMemo(() => {
    const envelope = generateEnvelope({
      ...DEFAULT_STIMULUS_CONFIG,
      durationMs: settings.duration,
      frequency: settings.frequency,
      noiseLevel: settings.noiseLevel,
      randomizePhase: false, // Keep phase consistent for visualization
    });

    const data = envelope.values.map((noise, i) => ({
        time: Math.round((i / DEFAULT_STIMULUS_CONFIG.refreshRate) * 1000),
        noise: noise
    }));
    return data;
  }, [settings]);

  return (
    <div>
      <h2 className="text-2xl font-bold text-cyan-400 mb-3 border-b-2 border-cyan-500 pb-2">Controls</h2>
      <Slider 
        label="Flash Duration"
        value={settings.duration}
        min={100} max={500} step={10} unit="ms"
        onChange={(val) => onSettingsChange({ ...settings, duration: val })}
      />
      <Slider 
        label="Max Noise Level"
        value={settings.noiseLevel}
        min={0.9} max={1} step={0.01} unit=""
        onChange={(val) => onSettingsChange({ ...settings, noiseLevel: val })}
      />
      <Slider 
        label="Clarity Rhythm"
        value={settings.frequency}
        min={1} max={30} step={1} unit="Hz"
        onChange={(val) => onSettingsChange({ ...settings, frequency: val })}
      />

      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-300 mb-2">Noise Rhythm Visualization</h3>
        <div className="h-40 bg-gray-700 p-2 rounded-md">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                    <XAxis dataKey="time" stroke="#9ca3af" tick={{ fontSize: 10 }} unit="ms" />
                    <YAxis stroke="#9ca3af" tick={{ fontSize: 10 }} domain={[0.9, 1]} tickFormatter={(val) => `${Math.round(val*100)}%`} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} 
                        labelStyle={{ color: '#67e8f9' }}
                        formatter={(value) => `${(Number(value) * 100).toFixed(1)}%`}
                        labelFormatter={(label) => `Time: ${label}ms`}
                    />
                    <Line type="monotone" name="Noise Density" dataKey="noise" stroke="#22d3ee" strokeWidth={2} dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ControlsPanel;
