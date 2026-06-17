import React, { useState, useRef, useEffect } from 'react';
import { Platform, MagicCore, Level, PlatformType } from '../types';
import { Play, RotateCcw, Save, Trash2, Plus, Info, LayoutGrid } from 'lucide-react';

interface LevelEditorProps {
  onSaveAndPlay: (customLevel: Level) => void;
  onClose: () => void;
}

export default function LevelEditor({ onSaveAndPlay, onClose }: LevelEditorProps) {
  const [levelName, setLevelName] = useState('My Custom Loop');
  const [activeTool, setActiveTool] = useState<PlatformType | 'core' | 'eraser'>('normal');
  const [platforms, setPlatforms] = useState<Platform[]>([
    { id: 'start-floor', x: 0, y: 480, width: 250, height: 70, type: 'normal' },
    { id: 'end-floor', x: 550, y: 480, width: 250, height: 70, type: 'normal' }
  ]);
  const [cores, setCores] = useState<MagicCore[]>([
    { id: 'core-1', x: 400, y: 250, radius: 10, collected: false }
  ]);
  const [startX, setStartX] = useState(100);
  const [startY, setStartY] = useState(420);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [currentMousePos, setCurrentMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    // Scale according to coordinate space of 800x550
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 800);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 550);
    // Align/snap to 10px grid if Shift isn't held
    if (!e.shiftKey) {
      return {
        x: Math.round(x / 10) * 10,
        y: Math.round(y / 10) * 10
      };
    }
    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    
    if (activeTool === 'eraser') {
      // Remove platform or core at coords
      setPlatforms(prev => prev.filter(p => 
        !(coords.x >= p.x && coords.x <= p.x + p.width && coords.y >= p.y && coords.y <= p.y + p.height)
      ));
      setCores(prev => prev.filter(c => {
        const dist = Math.hypot(c.x - coords.x, c.y - coords.y);
        return dist > 25;
      }));
      return;
    }

    if (activeTool === 'core') {
      const newCore: MagicCore = {
        id: `core-${Date.now()}`,
        x: coords.x,
        y: coords.y,
        radius: 10,
        collected: false
      };
      setCores(prev => [...prev, newCore]);
      return;
    }

    // Otherwise, start drawing platform box
    setIsDrawing(true);
    setDragStart(coords);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    setCurrentMousePos(coords);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !dragStart) return;
    setIsDrawing(false);
    
    const coords = getCanvasCoords(e);
    const x = Math.min(dragStart.x, coords.x);
    const y = Math.min(dragStart.y, coords.y);
    const width = Math.max(20, Math.abs(dragStart.x - coords.x));
    const height = Math.max(10, Math.abs(dragStart.y - coords.y));

    if (activeTool !== 'core' && activeTool !== 'eraser') {
      const newPlat: Platform = {
        id: `p-${Date.now()}`,
        x,
        y,
        width,
        height,
        type: activeTool,
        label: activeTool === 'checkpoint' ? 'SAVE' : undefined
      };
      setPlatforms(prev => [...prev, newPlat]);
    }
    setDragStart(null);
  };

  // Draw the grid & items preview
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.fillStyle = '#0b0f19'; // deep space navy
    ctx.fillRect(0, 0, 800, 550);

    // Draw Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 800; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 550);
      ctx.stroke();
    }
    for (let y = 0; y < 550; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(800, y);
      ctx.stroke();
    }

    // Draw platforms
    platforms.forEach(p => {
      ctx.fillStyle = getPlatformColor(p.type);
      ctx.fillRect(p.x, p.y, p.width, p.height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = getPlatformOutline(p.type);
      ctx.strokeRect(p.x, p.y, p.width, p.height);

      // Labeling platform types
      if (p.type !== 'normal') {
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.fillText(p.type.toUpperCase(), p.x + 5, p.y + 12);
      }
    });

    // Draw player starting flag
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(startX, startY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('START', startX, startY - 12);

    // Draw Magic Cores
    cores.forEach(c => {
      // Glow
      const glowGrad = ctx.createRadialGradient(c.x, c.y, 2, c.x, c.y, 18);
      glowGrad.addColorStop(0, 'rgba(168, 85, 247, 0.7)'); // neon purple
      glowGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(c.x, c.y, 18, 0, Math.PI * 2);
      ctx.fill();

      // Core center
      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // Draw active drawing box
    if (isDrawing && dragStart) {
      const x = Math.min(dragStart.x, currentMousePos.x);
      const y = Math.min(dragStart.y, currentMousePos.y);
      const w = Math.abs(dragStart.x - currentMousePos.x);
      const h = Math.abs(dragStart.y - currentMousePos.y);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);
    }

  }, [platforms, cores, isDrawing, dragStart, currentMousePos, activeTool, startX, startY]);

  const getPlatformColor = (type: PlatformType) => {
    switch (type) {
      case 'hazard': return 'rgba(239, 68, 68, 0.4)'; // Red spikes / hazard
      case 'bounce': return 'rgba(168, 85, 247, 0.4)'; // Purple bounce block
      case 'disappear': return 'rgba(245, 158, 11, 0.3)'; // Amber fading
      case 'checkpoint': return 'rgba(14, 165, 233, 0.4)'; // Light blue
      case 'ice': return 'rgba(45, 212, 191, 0.3)'; // Teal ice
      default: return 'rgba(75, 85, 99, 0.7)'; // Grey slate normal
    }
  };

  const getPlatformOutline = (type: PlatformType) => {
    switch (type) {
      case 'hazard': return '#ef4444';
      case 'bounce': return '#a855f7';
      case 'disappear': return '#f59e0b';
      case 'checkpoint': return '#0ea5e9';
      case 'ice': return '#2dd4bf';
      default: return '#9ca3af';
    }
  };

  const handlePlayLevel = () => {
    if (cores.length === 0) {
      alert("クリア条件のために、最低でも1つ以上の『魔力コア』を配置してください！");
      return;
    }
    const custom: Level = {
      id: 999,
      name: levelName || 'Custom Loop',
      description: '自分で創造した歪んだ時間軸。縫合を極め、コアを回収しろ！',
      difficulty: 'Medium',
      startX,
      startY,
      platforms,
      cores,
      parTime: 45,
      hint: "自分で設計したカスタムレベルです！テストを行って楽しんでみましょう。"
    };
    onSaveAndPlay(custom);
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 p-6 bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl max-w-7xl mx-auto w-full my-4">
      {/* Visual Canvas Area */}
      <div className="flex-1 flex flex-col items-center">
        <div className="flex items-center justify-between w-full mb-3">
          <div className="flex items-center gap-3">
            <LayoutGrid className="text-teal-400 w-6 h-6" />
            <input
              type="text"
              className="bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-lg font-bold text-slate-100 focus:outline-none focus:border-teal-500 w-64"
              value={levelName}
              onChange={(e) => setLevelName(e.target.value)}
              placeholder="カスタムステージ名..."
              id="editor-title-input"
            />
          </div>
          <p className="text-xs text-slate-400">
            グリッド吸着ON (Shiftキーを押しっぱなしで極細フリー描画可能)
          </p>
        </div>

        <div className="relative rounded-xl border-2 border-slate-800 overflow-hidden bg-slate-950 shadow-inner cursor-crosshair">
          <canvas
            ref={canvasRef}
            width={800}
            height={550}
            className="block max-w-full aspect-[800/550]"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            id="editor-stage-canvas"
          />
        </div>

        {/* Legend / Quick Tips */}
        <div className="mt-4 flex gap-4 text-xs text-slate-400 items-center justify-center">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-slate-600 rounded"></span> 通常床</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-red-500/60 rounded border border-red-500"></span> 奈落・針</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-purple-500/60 rounded border border-purple-500"></span> 跳躍弾性床</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-500/60 rounded border border-amber-500"></span> 1.2秒消滅床</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-sky-500/60 rounded border border-sky-500"></span> セーブ地点</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-purple-400 rounded-full"></span> 魔力コア</span>
        </div>
      </div>

      {/* Editor Controls & Tool Belt */}
      <div className="w-full xl:w-80 flex flex-col justify-between bg-slate-900/60 p-5 rounded-xl border border-slate-800">
        <div>
          <h3 className="text-base font-bold text-teal-400 border-b border-slate-800 pb-2 mb-4 flex items-center gap-2">
            <Info className="w-4 h-4" /> 建築ツールボックス
          </h3>

          <div className="space-y-4 mb-6">
            <div>
              <p className="text-xs text-slate-400 font-medium mb-2">配置するオブジェクトを選択:</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="btn-tool-normal"
                  onClick={() => setActiveTool('normal')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border text-left transition no-referrer ${
                    activeTool === 'normal'
                      ? 'bg-slate-700 text-teal-400 border-teal-500'
                      : 'bg-slate-800 hover:bg-slate-755 border-slate-700 text-slate-300'
                  }`}
                >
                  🧱 通常の足場
                </button>
                <button
                  id="btn-tool-hazard"
                  onClick={() => setActiveTool('hazard')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border text-left transition ${
                    activeTool === 'hazard'
                      ? 'bg-rose-950/50 text-rose-300 border-rose-500'
                      : 'bg-slate-800 hover:bg-slate-755 border-slate-700 text-slate-300'
                  }`}
                >
                  ⚠️ 危険地帯 (針)
                </button>
                <button
                  id="btn-tool-bounce"
                  onClick={() => setActiveTool('bounce')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border text-left transition ${
                    activeTool === 'bounce'
                      ? 'bg-purple-950/30 text-purple-300 border-purple-500'
                      : 'bg-slate-800 hover:bg-slate-755 border-slate-700 text-slate-300'
                  }`}
                >
                  🚀 大跳躍バウンス
                </button>
                <button
                  id="btn-tool-disappear"
                  onClick={() => setActiveTool('disappear')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border text-left transition ${
                    activeTool === 'disappear'
                      ? 'bg-amber-950/30 text-amber-300 border-amber-500'
                      : 'bg-slate-800 hover:bg-slate-755 border-slate-700 text-slate-300'
                  }`}
                >
                  ⏳ 1.2秒消滅床
                </button>
                <button
                  id="btn-tool-checkpoint"
                  onClick={() => setActiveTool('checkpoint')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border text-left transition ${
                    activeTool === 'checkpoint'
                      ? 'bg-sky-950/40 text-sky-300 border-sky-400'
                      : 'bg-slate-800 hover:bg-slate-755 border-slate-700 text-slate-300'
                  }`}
                >
                  ❄️ セーブチェック
                </button>
                <button
                  id="btn-tool-core"
                  onClick={() => setActiveTool('core')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border text-left transition ${
                    activeTool === 'core'
                      ? 'bg-fuchsia-950/50 text-fuchsia-300 border-fuchsia-500'
                      : 'bg-slate-800 hover:bg-slate-755 border-slate-700 text-slate-300'
                  }`}
                >
                  💎 魔力コア
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-400 font-medium mb-2">初期座標の調整:</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[10px] text-slate-500">START X</label>
                  <input
                    id="input-start-x"
                    type="number"
                    className="w-full bg-slate-800 border border-slate-750 px-2 py-1 rounded"
                    value={startX}
                    onChange={(e) => setStartX(Math.min(780, Math.max(20, Number(e.target.value))))}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500">START Y</label>
                  <input
                    id="input-start-y"
                    type="number"
                    className="w-full bg-slate-800 border border-slate-750 px-2 py-1 rounded"
                    value={startY}
                    onChange={(e) => setStartY(Math.min(500, Math.max(50, Number(e.target.value))))}
                  />
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-400 font-medium mb-1">ツールアクション:</p>
              <div className="flex gap-2">
                <button
                  id="btn-eraser"
                  onClick={() => setActiveTool('eraser')}
                  className={`flex-1 py-1 px-2 rounded border text-xs text-center font-bold flex items-center justify-center gap-1 transition ${
                    activeTool === 'eraser'
                      ? 'bg-rose-600 text-white border-rose-500 shadow'
                      : 'bg-slate-800 hover:bg-slate-750 border-slate-750 text-slate-300'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" /> 部分消しゴム
                </button>
                <button
                  id="btn-clear-all"
                  onClick={() => {
                    if (confirm('すべてリセットしますか？')) {
                      setPlatforms([]);
                      setCores([]);
                    }
                  }}
                  className="py-1 px-2.5 rounded border border-rose-900/30 bg-rose-950/20 text-rose-400 hover:bg-rose-950/40 text-xs transition font-semibold"
                >
                  全消去
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-indigo-950/30 p-3 border border-indigo-900/30 text-xs text-indigo-200">
            <h4 className="font-bold flex items-center gap-1 text-indigo-300 mb-1">
              💡 自作ステージの鉄則:
            </h4>
            <p className="leading-relaxed">
              画面の一番下（Y &gt; 500）に落下した時、もし危険地帯や安全な床が無ければ奈落死となります。床を配置するか、落ちながら「過去の自分」に向けてロープを張って回避できる設計にしましょう！
            </p>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-slate-800 space-y-2">
          <button
            id="btn-test-level"
            onClick={handlePlayLevel}
            className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-teal-900/20 flex items-center justify-center gap-2 cursor-pointer transition transform active:scale-95 text-sm"
          >
            <Play className="w-4 h-4 fill-current" /> ステージを保存してテストプレイ!
          </button>
          <button
            id="btn-close-editor"
            onClick={onClose}
            className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs rounded-xl transition border border-slate-700"
          >
            元メニューに戻る
          </button>
        </div>
      </div>
    </div>
  );
}
