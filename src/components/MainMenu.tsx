import React from 'react';
import { Level } from '../types';
import { Play, HelpCircle, Edit, Zap, Award, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

interface MainMenuProps {
  levels: Level[];
  onSelectLevel: (idx: number) => void;
  onOpenEditor: () => void;
  bestTimes: { [id: number]: number };
  onResetProgress: () => void;
}

export default function MainMenu({ levels, onSelectLevel, onOpenEditor, bestTimes, onResetProgress }: MainMenuProps) {

  const formatTime = (ms?: number) => {
    if (!ms) return null;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'Easy': return 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50';
      case 'Medium': return 'bg-amber-950/40 text-amber-400 border-amber-900/50';
      case 'Hard': return 'bg-rose-950/40 text-rose-400 border-rose-950/80';
      case 'Expert': return 'bg-fuchsia-950/40 text-fuchsia-400 border-fuchsia-950';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="max-w-4xl w-full mx-auto p-2 md:p-6 text-slate-100 flex flex-col gap-8 animate-fade-in">
      {/* Title Hero Banner */}
      <div className="relative overflow-hidden bg-slate-900/30 border border-slate-800 p-8 rounded-3xl text-center flex flex-col items-center justify-center shadow-indigo-950/10 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(45,212,191,0.06),transparent_65%)]" />
        
        <div className="relative">
          {/* Neon micro particles decoration */}
          <div className="absolute -top-6 -left-6 w-12 h-12 bg-teal-500/10 rounded-full blur-xl animate-pulse" />
          <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-purple-500/10 rounded-full blur-xl animate-pulse" />

          {/* Subtitle */}
          <span className="text-[10px] tracking-[0.35em] text-teal-400 font-extrabold uppercase bg-teal-950/40 border border-teal-900 px-3 py-1 rounded-full px-4 mb-3 inline-block">
            CHRONO PHYSICAL ACTION PUZZLE
          </span>

          {/* Title */}
          <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-white font-sans drop-shadow-lg mb-1 uppercase">
            TIME <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">STITCH</span>
          </h1>
          <p className="text-xs sm:text-sm font-bold text-slate-400 font-mono tracking-wide mb-6">
            時間の縫い目 / タイム・ステッチ
          </p>
        </div>

        <p className="max-w-xl text-xs sm:text-sm leading-relaxed text-slate-300 border-t border-slate-800/60 pt-4 mb-2">
          「3秒前の過去の自分」は敵ですか？ それとも、大ジャンプの架け架け橋ですか？<br/>
          自分の歩んだ運動軌跡と、今この瞬間に『光の物理ロープ（時間の縫い目）』を張り巡らせる時空パズルアクション。
        </p>
      </div>

      {/* Instructions & Core Concepts Block */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/50 p-6 rounded-2xl border border-slate-800/80">
        <div>
          <h3 className="text-sm font-extrabold text-teal-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" /> コントロール
          </h3>
          <ul className="text-xs space-y-2.5 text-slate-300 font-sans">
            <li className="flex items-start gap-2">
              <span className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded font-mono text-[10px] text-white">A / D / Arrow Keys</span>
              <span><strong>左右移動</strong>: キャラクターの移動・方向転換を行います。</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded font-mono text-[10px] text-white">W / UpArrow / K / Z</span>
              <span><strong>ジャンプ</strong>: 足場から跳躍。落下中も糸にふれれば再跳躍可能。</span>
            </li>
            <li className="flex items-start gap-2 font-semibold">
              <span className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded font-mono text-[10px] text-teal-300">SPACE (長押し)</span>
              <span><strong>光の縫合 (Time Stitch)</strong>: 3秒前のゴースト（緑色）と実体ロープで接続！</span>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-extrabold text-pink-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-pink-400" /> ゲームプレイ極意
          </h3>
          <p className="text-xs leading-relaxed text-slate-300 mb-2">
            <strong>🚀 タイムカタパルト（大ジャンプ）の手順：</strong><br/>
            ① 崖や高台から飛び降りる。<br/>
            ② 落下中のタイミングで <span className="text-teal-400 font-bold">SPACEキー</span> を押し、高台にいるゴーストへとロープを紡ぐ。<br/>
            ③ ロープの上に衝突した瞬間、強烈な弾性エネルギーを逆噴射し、通常の約2倍もの上空へと吹っ飛びます！
          </p>
          <div className="p-2.5 rounded-lg bg-pink-950/20 border border-pink-900/20 text-[11px] text-pink-300 flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-pink-400" />
            <span>空中を自由に飛び回る感覚と、3秒前の自分の行動が次の謎を解く鍵を握るという、スリリングな噛み合わせを体験しましょう。</span>
          </div>
        </div>
      </div>

      {/* Stages Section */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-4 bg-teal-400 rounded-sm" />
            <h3 className="text-base font-black text-white">時空ステージを選択 (SELECT STAGE)</h3>
          </div>

          <button
            id="btn-reset-data"
            onClick={() => {
              if (confirm("全てのクリア履歴・ベストタイムをリセットしますか？")) {
                onResetProgress();
              }
            }}
            className="text-[10px] text-slate-500 hover:text-rose-400 font-semibold font-mono flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> RESET PROGRESS
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {levels.map((level, idx) => {
            const bestTime = bestTimes[level.id];
            return (
              <div
                key={level.id}
                id={`stage-card-${level.id}`}
                className="group relative overflow-hidden bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 p-5 rounded-2xl flex flex-col justify-between gap-4 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
                onClick={() => onSelectLevel(idx)}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-slate-400 font-mono text-xs font-bold">STAGE {level.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getDifficultyColor(level.difficulty)}`}>
                      {level.difficulty}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-100 group-hover:text-teal-400 transition-colors">
                    {level.name}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">
                    {level.description}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-slate-800/50 pt-3 text-xs font-mono">
                  <div>
                    {bestTime ? (
                      <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" /> Record: {formatTime(bestTime)}
                      </span>
                    ) : (
                      <span className="text-slate-500 italic">Not Cleared</span>
                    )}
                  </div>

                  <button
                    id={`btn-play-stage-${level.id}`}
                    className="py-1 px-3 bg-teal-500/15 text-teal-400 font-bold rounded-lg border border-teal-500/20 group-hover:bg-teal-500 group-hover:text-slate-950 transition-all flex items-center gap-1 text-[11px]"
                  >
                    ENTRY <Play className="w-3 h-3 fill-current" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Sandbox Level Editor Option card */}
          <div
            id="editor-launch-card"
            onClick={onOpenEditor}
            className="group relative overflow-hidden bg-gradient-to-br from-indigo-950/10 to-purple-950/15 hover:from-indigo-950/20 hover:to-purple-950/30 border border-dashed border-indigo-800/40 hover:border-indigo-500 p-5 rounded-2xl flex flex-col justify-between gap-4 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer text-slate-100"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-indigo-400 font-mono text-xs font-bold">SANDBOX BUILDER</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-indigo-950/50 text-indigo-400 border-indigo-900">
                  CREATIVE
                </span>
              </div>

              <h4 className="text-base font-black text-indigo-200 group-hover:text-fuchsia-400 transition-colors flex items-center gap-1.5">
                🧪 時空ステージビルダー
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed mt-1">
                障害物や魔力コアをグリッド上に思い通りにドラッグ＆ドロップで配置！ 自分が設計したループで、いつでも「時間の縫い目」のテスト飛行が可能。
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-indigo-950/50 pt-3 text-xs font-mono">
              <span className="text-indigo-400 flex items-center gap-1">
                <Edit className="w-3.5 h-3.5" /> Create Custom Level
              </span>

              <button
                id="btn-launch-editor-under"
                className="py-1 px-3 bg-indigo-500/20 text-indigo-300 font-bold rounded-lg border border-indigo-500/30 group-hover:bg-indigo-500 group-hover:text-slate-950 transition-all flex items-center gap-1 text-[11px]"
              >
                OPEN EDITOR <Edit className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
