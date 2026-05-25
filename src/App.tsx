import React, { useState, useMemo } from 'react';
import {
  Layers,
  Activity,
  Zap,
  Flame,
  Weight,
  Sparkles,
  Info,
  Maximize2,
  RefreshCw,
  Cpu,
  Bookmark,
  TrendingUp,
  Sliders,
  ChevronRight,
  BookOpen,
  Github
} from 'lucide-react';
import { CoilInputs, MATERIALS } from './types';
import { calculateCoil, getFieldSweepData } from './components/CoilMath';
import WindingPreview from './components/WindingPreview';
import CoilChart from './components/CoilChart';
import TheoryPanel from './components/TheoryPanel';
import DeployGuide from './components/DeployGuide';

export default function App() {
  // 1. Core calculation state with realistic defaults
  const [inputs, setInputs] = useState<CoilInputs>({
    wireLength: 50,      // m (L)
    wireDiameter: 0.8,   // mm (d)
    frameDiameter: 25,   // mm (D)
    frameLength: 50,     // mm (l)
    current: 2.0,        // A (I)
    material: 'copper'   // copper resistivity
  });

  // Active view tab state (for Theory/Deploy Guides)
  const [activeTab, setActiveTab] = useState<'theory' | 'deploy'>('theory');

  // Multi-unit selector for magnetic induction display
  const [bUnit, setBUnit] = useState<'mT' | 'uT' | 'G'>('mT');

  // 2. Perform raw coil calculation for active parameters
  const results = useMemo(() => {
    return calculateCoil(inputs);
  }, [inputs]);

  // 3. Perform length sweep calculation for plot and optimal parameter values
  const { sweepPoints, optimalLength, maxField, l_phys_max } = useMemo(() => {
    return getFieldSweepData(inputs, 120);
  }, [inputs]);

  const optimalResults = useMemo(() => {
    return calculateCoil({ ...inputs, frameLength: optimalLength });
  }, [inputs, optimalLength]);

  // Handler to adjust single numeric values
  const handleInputChange = (field: keyof CoilInputs, val: number | string) => {
    setInputs(prev => ({
      ...prev,
      [field]: val
    }));
  };

  // Quick helper to convert tesla values into requested unit
  const formatBField = (teslaVal: number) => {
    if (bUnit === 'mT') {
      return `${(teslaVal * 1000).toFixed(3)} мТл`;
    } else if (bUnit === 'uT') {
      return `${(teslaVal * 1e6).toFixed(1)} мкТл`;
    } else {
      // 1 Tesla = 10000 Gauss
      return `${(teslaVal * 10000).toFixed(1)} Гс`;
    }
  };

  // Relative efficiency of the current winding choice versus optimal layout
  const relativeEfficiency = Math.min(
    (results.magneticFieldContinuous / maxField) * 100,
    100
  );

  // Apply the optimal length button action
  const applyOptimalLength = () => {
    setInputs(prev => ({
      ...prev,
      frameLength: Number(optimalLength.toFixed(1))
    }));
  };

  const selectedMaterial = MATERIALS.find(m => m.id === inputs.material) || MATERIALS[0];

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Premium Ambient Glow Headers */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-10 right-1/4 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Main Navigation Banner */}
      <header className="border-b border-slate-800 bg-slate-950/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-indigo-600 to-indigo-400 rounded-lg shadow-indigo-500/25 shadow-md">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-100 via-indigo-200 to-emerald-200">
                Оптимизатор намотки катушки индуктивности
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                Расчёт оптимальной длины каркаса для максимизации магнитного поля
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Единицы поля B:</span>
            <div className="inline-flex bg-slate-900 border border-slate-800 p-1 rounded-lg">
              {(['mT', 'uT', 'G'] as const).map(unit => (
                <button
                  key={unit}
                  onClick={() => setBUnit(unit)}
                  className={`px-2.5 py-1 text-xs font-mono font-semibold rounded ${
                    bUnit === unit
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {unit === 'mT' ? 'мТл' : unit === 'uT' ? 'мкТл' : 'Гс'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 md:py-8 space-y-6">
        
        {/* Core Dashboard Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* COLUMN 1: Inputs & Parameters Panel (span 4) */}
          <section className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col space-y-5" id="inputs-panel">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3 mb-1">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <h2 className="font-bold text-slate-200 text-base">Входные параметры</h2>
            </div>

            {/* Input 1: Wire Length */}
            <div className="space-y-1.5Packed font-sans">
              <div className="flex justify-between items-center text-xs">
                <label className="text-slate-300 font-medium flex items-center gap-1.5">
                  Длина провода L:
                  <span className="text-slate-500 hover:text-slate-400 cursor-help" title="Полная фиксированная длина провода для намотки">
                    <Info className="w-3.5 h-3.5" />
                  </span>
                </label>
                <span className="font-mono text-emerald-400 font-bold">{inputs.wireLength} м</span>
              </div>
              <input
                type="range"
                min="5"
                max="250"
                step="5"
                value={inputs.wireLength}
                onChange={(e) => handleInputChange('wireLength', Number(e.target.value))}
                className="w-full accent-indigo-500 h-1.5 bg-slate-850 rounded"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>5 м</span>
                <span>125 м</span>
                <span>250 м</span>
              </div>
            </div>

            {/* Input 2: Wire Diameter */}
            <div className="space-y-1.5 font-sans">
              <div className="flex justify-between items-center text-xs">
                <label className="text-slate-300 font-medium flex items-center gap-1.5">
                  Диаметр провода d (с изол.):
                  <span className="text-slate-500 hover:text-slate-400 cursor-help" title="Диаметр поперечного сечения провода вместе с лаковой изоляцией в мм">
                    <Info className="w-3.5 h-3.5" />
                  </span>
                </label>
                <span className="font-mono text-emerald-400 font-bold">{inputs.wireDiameter} мм</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="3.0"
                step="0.05"
                value={inputs.wireDiameter}
                onChange={(e) => handleInputChange('wireDiameter', Number(e.target.value))}
                className="w-full accent-indigo-500 h-1.5 bg-slate-850 rounded"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0.1 мм</span>
                <span>1.5 мм</span>
                <span>3.0 мм</span>
              </div>
            </div>

            {/* Input 3: Cylinder inner diameter */}
            <div className="space-y-1.5 font-sans">
              <div className="flex justify-between items-center text-xs">
                <label className="text-slate-300 font-medium flex items-center gap-1.5">
                  Диаметр каркаса D (внутр):
                  <span className="text-slate-500 hover:text-slate-400 cursor-help" title="Внешний диаметр полого цилиндра, на который наматывается катушка">
                    <Info className="w-3.5 h-3.5" />
                  </span>
                </label>
                <span className="font-mono text-emerald-400 font-bold">{inputs.frameDiameter} мм</span>
              </div>
              <input
                type="range"
                min="5"
                max="120"
                step="1"
                value={inputs.frameDiameter}
                onChange={(e) => handleInputChange('frameDiameter', Number(e.target.value))}
                className="w-full accent-indigo-500 h-1.5 bg-slate-850 rounded"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>5 мм</span>
                <span>60 мм</span>
                <span>120 мм</span>
              </div>
            </div>

            {/* Input 4: Target current frameLength l */}
            <div className="space-y-1.5 p-3 rounded-lg bg-indigo-950/20 border border-indigo-500/10 font-sans">
              <div className="flex justify-between items-center text-xs">
                <label className="text-slate-200 font-semibold flex items-center gap-1.5">
                  Текущая длина намотки l:
                  <span className="text-slate-500 hover:text-slate-400 cursor-help" title="Задайте текущую длину намотки каркаса, чтобы проанализировать её параметры">
                    <Info className="w-3.5 h-3.5" />
                  </span>
                </label>
                <span className="font-mono text-indigo-300 font-bold">{inputs.frameLength} мм</span>
              </div>
              <input
                type="range"
                min="5"
                max="250"
                step="0.5"
                value={inputs.frameLength}
                onChange={(e) => handleInputChange('frameLength', Number(e.target.value))}
                className="w-full accent-emerald-400 h-1.5 bg-slate-850 rounded"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>5 мм</span>
                <span>125 мм</span>
                <span>250 мм</span>
              </div>
            </div>

            {/* Input 5: Current (Amperes) */}
            <div className="space-y-1.5 font-sans">
              <div className="flex justify-between items-center text-xs">
                <label className="text-slate-300 font-medium flex items-center gap-1.5">
                  Электрический ток I:
                  <span className="text-slate-500 hover:text-slate-400 cursor-help" title="Постоянный ток, протекающий через обмотку катушки в Амперах">
                    <Info className="w-3.5 h-3.5" />
                  </span>
                </label>
                <span className="font-mono text-emerald-400 font-bold">{inputs.current} А</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="10.0"
                step="0.1"
                value={inputs.current}
                onChange={(e) => handleInputChange('current', Number(e.target.value))}
                className="w-full accent-indigo-500 h-1.5 bg-slate-850 rounded"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0.1 А</span>
                <span>5.0 А</span>
                <span>10.0 А</span>
              </div>
            </div>

            {/* Input 6: Material pick */}
            <div className="space-y-1.5 font-sans">
              <label className="text-xs text-slate-300 font-medium block">Материал провода обмотки:</label>
              <div className="grid grid-cols-2 gap-2">
                {MATERIALS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => handleInputChange('material', m.id)}
                    className={`px-3 py-1.5 text-xs rounded-lg border font-medium cursor-pointer transition flex flex-col items-center ${
                      inputs.material === m.id
                        ? 'bg-gradient-to-tr from-indigo-600/20 to-indigo-500/20 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-500/5'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-850'
                    }`}
                  >
                    <span>{m.nameRu}</span>
                    <span className="text-[10px] font-mono text-slate-500 mt-0.5">
                      {(m.resistivity * 1e8).toFixed(2)} [10⁻⁸ Ом·м]
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Material Quick Stats */}
            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-2">
              <div className="flex justify-between">
                <span>Плотность материала:</span>
                <span className="font-mono font-medium text-slate-200">{selectedMaterial.density} кг/м³</span>
              </div>
              <div className="flex justify-between">
                <span>Предел плотной обмотки l_max:</span>
                <span className="font-mono font-bold text-indigo-400">{l_phys_max.toFixed(1)} мм</span>
              </div>
              <p className="text-[10px] leading-relaxed text-slate-500 pt-1 border-t border-slate-850">
                {inputs.frameLength > l_phys_max ? (
                  <span className="text-amber-400/90 font-medium">
                    ⚠️ Внимание: Длина намотки больше предела плотного заполнения. Обмотка витки распределит редко в 1 слой.
                  </span>
                ) : (
                  <span>✔️ Провод укладывается плотно в несколько слоёв ({results.layers.toFixed(2)} шт).</span>
                )}
              </p>
            </div>
          </section>

          {/* COLUMN 2 & 3 (span 8) - Primary visual output & results */}
          <div className="lg:col-span-8 space-y-6">

            {/* Row 1: Core Metrics Overview Side-by-Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Card 1: Active Winding Specs */}
              <div className="bg-gradient-to-br from-indigo-950/30 to-slate-900 border border-indigo-500/10 rounded-xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      ТЕКУЩАЯ КОНФИГУРАЦИЯ
                    </span>
                    <span className="text-[11px] font-mono font-bold text-slate-400">l = {inputs.frameLength} мм</span>
                  </div>
                  
                  <div className="mt-2">
                    <p className="text-slate-400 text-xs">Магнитная индукция на оси в центре:</p>
                    <div className="text-3xl font-extrabold text-white tracking-tight mt-1" id="current-induction-value">
                      {formatBField(results.magneticFieldContinuous)}
                    </div>
                  </div>

                  {/* Relative Efficiency progress bar */}
                  <div className="mt-4 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Отношение к максимуму:</span>
                      <span className="font-mono font-semibold text-emerald-400">{relativeEfficiency.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded overflow-hidden p-0.5 border border-slate-800">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded transition-all duration-300"
                        style={{ width: `${relativeEfficiency}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-5 pt-3 border-t border-slate-800/80 text-xs">
                  <div>
                    <span className="text-slate-500 block">Индуктивность:</span>
                    <span className="font-mono font-bold text-indigo-300 text-sm">
                      {results.inductanceH >= 1e-3 
                        ? `${(results.inductanceH * 1000).toFixed(4)} мГн` 
                        : `${(results.inductanceH * 1e6).toFixed(1)} мкГн`}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Всего витков:</span>
                    <span className="font-mono font-bold text-indigo-300 text-sm">{Math.round(results.totalTurns)}</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Optimal Search Specs */}
              <div className="bg-gradient-to-br from-emerald-950/25 to-slate-900 border border-emerald-500/10 rounded-xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1 animate-pulse">
                      <Sparkles className="w-3 h-3" /> ОПТИМАЛЬНАЯ РАСКЛАДКА
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400">B_max в центре</span>
                  </div>

                  <div className="mt-2">
                    <p className="text-slate-400 text-xs">Максимально достижимое поле B_max:</p>
                    <div className="text-2xl font-extrabold text-emerald-400 tracking-tight mt-1">
                      {formatBField(maxField)}
                    </div>
                  </div>

                  <div className="mt-3 text-xs leading-relaxed text-slate-300">
                    При оптимальной длине каркаса 
                    <strong className="text-emerald-400 font-mono mx-1 font-bold">{optimalLength.toFixed(1)} мм</strong> 
                     провод уложится в <strong className="text-indigo-300 font-mono">{optimalResults.layers.toFixed(2)}</strong> слоёв.
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={applyOptimalLength}
                    className={`flex-grow flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold py-2 px-4 rounded-lg shadow-lg cursor-pointer transform hover:-translate-y-0.5 transition duration-150 text-xs ${
                      Math.abs(inputs.frameLength - optimalLength) < 1.0 ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    Выставить оптимальную длину {optimalLength.toFixed(1)} мм
                  </button>
                </div>
              </div>

            </div>

            {/* Row 2: Schematic Winding & Electromagnetic Plot */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left module: Cross sectional visualization */}
              <div className="flex flex-col h-full justify-between">
                <WindingPreview results={results} inputs={inputs} />
                
                {/* Visual warning on parameters */}
                <div className="mt-3 bg-slate-900 border border-slate-800 p-3 rounded-lg text-[11px] leading-relaxed text-slate-400 flex items-start gap-2.5">
                  <span className="p-1 bg-indigo-500/10 text-indigo-400 rounded">
                    <Bookmark className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    Изменение диаметра провода <code className="text-slate-300">d</code> сильно влияет на число слоев и плотность, а увеличение тока <code className="text-slate-300">I</code> линейно увеличивает индукцию, но требует учёта нагрева.
                  </div>
                </div>
              </div>

              {/* Right module: Electro-Technical bento grid details */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-xs text-slate-200 tracking-wider uppercase mb-3 text-slate-300 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-indigo-400" />
                    Электрические & Весовые параметры
                  </h3>

                  <div className="space-y-3">
                    {/* Weight */}
                    <div className="flex items-center justify-between p-2.5 bg-slate-950/80 rounded border border-slate-850">
                      <div className="flex items-center gap-2">
                        <Weight className="w-4 h-4 text-amber-500 shrink-0" />
                        <span className="text-xs text-slate-400">Масса используемого провода:</span>
                      </div>
                      <span className="font-mono font-bold text-sm text-slate-200">
                        {results.mass >= 1.0 ? `${results.mass.toFixed(2)} кг` : `${(results.mass * 1000).toFixed(1)} г`}
                      </span>
                    </div>

                    {/* Resistance */}
                    <div className="flex items-center justify-between p-2.5 bg-slate-950/80 rounded border border-slate-850">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="text-xs text-slate-400">Электрическое сопротивление (DC):</span>
                      </div>
                      <span className="font-mono font-bold text-sm text-slate-200">
                        {results.resistance.toFixed(2)} Ом
                      </span>
                    </div>

                    {/* Power heating */}
                    <div className="flex items-center justify-between p-2.5 bg-slate-950/80 rounded border border-slate-850">
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-rose-500 shrink-0" />
                        <span className="text-xs text-slate-400">Мощность тепловых потерь (тепловыделение):</span>
                      </div>
                      <span className="font-mono font-bold text-sm text-rose-400">
                        {results.power.toFixed(1)} Вт
                      </span>
                    </div>

                    {/* Voltage needed */}
                    <div className="flex items-center justify-between p-2.5 bg-slate-950/80 rounded border border-slate-850">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-sky-500 shrink-0" />
                        <span className="text-xs text-slate-400">Необходимое напряжение питания:</span>
                      </div>
                      <span className="font-mono font-bold text-sm text-slate-200">
                        {results.voltage.toFixed(1)} В
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 leading-relaxed mt-4 pt-3 border-t border-slate-850">
                  * Расчёты приведены для постоянного тока при комнатной температуре (20°C). Тепловыделение свыше 15Вт требует активного охлаждения катушки во избежание обгорания лаковой изоляции.
                </div>
              </div>

            </div>

            {/* Row 3: Full Width Interactive Chart */}
            <CoilChart
              data={sweepPoints}
              currentL={inputs.frameLength}
              optimalL={optimalLength}
              onLChange={(l) => handleInputChange('frameLength', l)}
            />

          </div>

        </div>

        {/* Tabbed Interactive Info & Guides Section */}
        <section className="bg-slate-950 border border-slate-900 rounded-xl overflow-hidden mt-8 shadow-2xl">
          {/* Tab Selector bar */}
          <div className="flex border-b border-slate-900 bg-slate-900/60 p-1 gap-1">
            <button
              onClick={() => setActiveTab('theory')}
              className={`flex-grow sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold rounded-lg cursor-pointer transition ${
                activeTab === 'theory'
                  ? 'bg-gradient-to-r from-indigo-900/60 to-slate-900 border border-indigo-500/20 text-white shadow-lg shadow-indigo-500/5'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <BookOpen className="w-4 h-4 text-emerald-400" />
              Физическая Теория и Физика расчёта
            </button>
            
            <button
              onClick={() => setActiveTab('deploy')}
              className={`flex-grow sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold rounded-lg cursor-pointer transition ${
                activeTab === 'deploy'
                  ? 'bg-gradient-to-r from-indigo-900/60 to-slate-900 border border-indigo-500/20 text-white shadow-lg shadow-indigo-500/5'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <Github className="w-4 h-4 text-indigo-400" />
              Как задеплоить на GitHub Pages
            </button>
          </div>

          {/* Active Tab Viewport */}
          <div className="p-1 md:p-2 bg-slate-950">
            {activeTab === 'theory' && <TheoryPanel />}
            {activeTab === 'deploy' && <DeployGuide />}
          </div>
        </section>

      </main>

      <footer className="border-t border-slate-900 mt-12 py-6 bg-slate-950/60 text-slate-500 text-center text-xs">
        <p>© 2026 Моделирование магнитных полей • Оптимизатор намотки • Все расчёты производятся в реальном времени в СИ</p>
      </footer>
    </div>
  );
}
