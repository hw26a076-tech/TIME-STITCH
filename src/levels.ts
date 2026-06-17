import { Level } from './types';

export const INITIAL_LEVELS: Level[] = [
  {
    id: 1,
    name: "1. 縫合の基本 (Stitch Basics)",
    description: "3秒前の過去の自分（緑のゴースト）と光のロープ（足場）を繋ぎ、高所のコアを獲得せよ。",
    difficulty: "Easy",
    startX: 100,
    startY: 420,
    parTime: 20,
    hint: "矢印キー/WASDで移動、W/UP/N/Jでジャンプ。SPACEを長押しすると、現在のあなたと過去の残像の間に『光のロープ』を張ります。ロープの上は安全に歩くことができます！",
    platforms: [
      // Floor
      { id: "p1", x: 0, y: 480, width: 350, height: 70, type: "normal" },
      { id: "p2", x: 450, y: 480, width: 350, height: 70, type: "normal" },
      // Hazards between floors
      { id: "h1", x: 350, y: 520, width: 100, height: 30, type: "hazard" },
      // High Ledge
      { id: "p3", x: 600, y: 320, width: 200, height: 20, type: "normal" }
    ],
    cores: [
      { id: "c1", x: 700, y: 220, radius: 10, collected: false }
    ]
  },
  {
    id: 2,
    name: "2. 時空の反発力 (Time Catapult)",
    description: "落下運動の勢いをロープで受け止め、超高推力のトランポリンジャンプを爆発させろ！",
    difficulty: "Medium",
    startX: 80,
    startY: 300,
    parTime: 30,
    hint: "意図的に高所から落下し、落下途中にSPACEキーで元の高台の残像に向けてロープをピンと張ります。そのロープに叩きつけられると、弾性エネルギーで超大ジャンプが可能です！",
    platforms: [
      // Left high platform
      { id: "p2_1", x: 0, y: 350, width: 180, height: 200, type: "normal" },
      // Middle void with hazards
      { id: "p2_2", x: 180, y: 500, width: 440, height: 50, type: "hazard" },
      // Right destination high wall
      { id: "p2_3", x: 620, y: 160, width: 180, height: 390, type: "normal" },
      // Floating middle block (decorative or buffer)
      { id: "p2_4", x: 350, y: 350, width: 80, height: 20, type: "normal" }
    ],
    cores: [
      // Highly positioned Magic Core
      { id: "c2_1", x: 710, y: 80, radius: 10, collected: false }
    ]
  },
  {
    id: 3,
    name: "3. 時間の飛び石 (Temporal Steps)",
    description: "時間経過で消滅する不安定な足場と、空中を舞う魔コア。",
    difficulty: "Medium",
    startX: 80,
    startY: 420,
    parTime: 45,
    hint: "オレンジ色のプラットフォームは、一度触れると1.2秒後に消滅します（時間とともに再出現します）。空中をスムーズに渡るために、時間差でロープを張って安全圏を確保しましょう。",
    platforms: [
      { id: "p3_1", x: 0, y: 480, width: 150, height: 70, type: "normal" },
      // Disappearing block 1
      { id: "p3_dis1", x: 220, y: 380, width: 80, height: 20, type: "disappear" },
      // Disappearing block 2
      { id: "p3_dis2", x: 360, y: 280, width: 80, height: 20, type: "disappear" },
      // Disappearing block 3
      { id: "p3_dis3", x: 500, y: 380, width: 80, height: 20, type: "disappear" },
      // Safe Right floor
      { id: "p3_2", x: 650, y: 450, width: 150, height: 100, type: "normal" },
      // Lava at bottom
      { id: "p3_lava", x: 150, y: 520, width: 500, height: 30, type: "hazard" }
    ],
    cores: [
      { id: "c3_1", x: 260, y: 180, radius: 10, collected: false },
      { id: "c3_2", x: 540, y: 180, radius: 10, collected: false }
    ]
  },
  {
    id: 4,
    name: "4. 時空回廊とチェックポイント (Time checkpoint)",
    description: "チェックポイントに触れることで、ミスした際の位置を固定できる。難所へ挑め。",
    difficulty: "Hard",
    startX: 50,
    startY: 400,
    parTime: 60,
    hint: "青い光を放つチェックポイントに一度触れれば、奈落に落ちてもそこから復活できます。過去の残像はチェックポイントを通過してからも『実時間3秒前』の運動軌跡を保ち続けます。",
    platforms: [
      { id: "p4_root", x: 0, y: 450, width: 120, height: 100, type: "normal" },
      { id: "p4_cp1", x: 220, y: 390, width: 40, height: 10, type: "checkpoint", label: "SAVE" },
      { id: "p4_plat1", x: 180, y: 400, width: 120, height: 150, type: "normal" },
      // Giant hazard pit
      { id: "p4_pit", x: 300, y: 510, width: 400, height: 40, type: "hazard" },
      // Fragile micro steps
      { id: "p4_step1", x: 360, y: 300, width: 40, height: 15, type: "normal" },
      { id: "p4_step2", x: 440, y: 220, width: 40, height: 15, type: "normal" },
      { id: "p4_step3", x: 520, y: 300, width: 40, height: 15, type: "normal" },
      // Bouncy block
      { id: "p4_bounce", x: 600, y: 410, width: 50, height: 15, type: "bounce" },
      // Goal floor
      { id: "p4_end", x: 700, y: 350, width: 100, height: 200, type: "normal" }
    ],
    cores: [
      { id: "c4_1", x: 460, y: 100, radius: 11, collected: false },
      { id: "c4_2", x: 750, y: 250, radius: 11, collected: false }
    ]
  },
  {
    id: 5,
    name: "5. クノッヘン・ステッチ (The Stitch Master)",
    description: "極限の時間物理パズル。5つのコア全てを空中を駆け巡り回収せよ。",
    difficulty: "Expert",
    startX: 100,
    startY: 350,
    parTime: 90,
    hint: "過去の自分の軌跡（落下経路、跳躍経路）を念頭に、複数の飛び石とカタパルトを組み合わせる必要があります。空中ステッチを張ったまま再度ジャンプする等、自由な攻略を組み立ててみましょう！",
    platforms: [
      // High left floor
      { id: "p5_left", x: 0, y: 420, width: 150, height: 130, type: "normal" },
      // Central floating complex
      { id: "p5_mid_low", x: 320, y: 450, width: 160, height: 20, type: "normal" },
      { id: "p5_mid_high", x: 350, y: 240, width: 100, height: 20, type: "normal" },
      // Disappearing hazard wings
      { id: "p5_dis1", x: 200, y: 330, width: 60, height: 15, type: "disappear" },
      { id: "p5_dis2", x: 540, y: 330, width: 60, height: 15, type: "disappear" },
      // High right corner
      { id: "p5_right", x: 680, y: 380, width: 120, height: 170, type: "normal" },
      // Giant spike bed below
      { id: "p5_spikes", x: 150, y: 530, width: 530, height: 20, type: "hazard" }
    ],
    cores: [
      { id: "c5_1", x: 100, y: 200, radius: 10, collected: false },
      { id: "c5_2", x: 230, y: 120, radius: 10, collected: false },
      { id: "c5_3", x: 400, y: 130, radius: 10, collected: false },
      { id: "c5_4", x: 570, y: 120, radius: 10, collected: false },
      { id: "c5_5", x: 740, y: 180, radius: 10, collected: false }
    ]
  },
  {
    id: 6,
    name: "6. クロノスの断崖 (Cliffs of Chronos)",
    description: "斜めバウンドと消滅足場を完璧に同期させる、過酷な高精度ジャンプアクション。",
    difficulty: "Expert",
    startX: 80,
    startY: 380,
    parTime: 80,
    hint: "斜めの光のロープを利用して、横や斜め上への鋭いカタパルトバウンドを狙ってください。バウンド後、素早くW/Spaceなどを駆使し、タイミングよく消える足場に着地しましょう。",
    platforms: [
      // Starting floor
      { id: "p6_1", x: 0, y: 480, width: 140, height: 70, type: "normal" },
      // First gap hazard
      { id: "p6_h1", x: 140, y: 530, width: 200, height: 20, type: "hazard" },
      // A small platform with checkpoint
      { id: "p6_cp1", x: 300, y: 400, width: 40, height: 10, type: "checkpoint", label: "SAVE" },
      { id: "p6_plat1", x: 280, y: 410, width: 80, height: 140, type: "normal" },
      // Giant spike bed in the second half
      { id: "p6_h2", x: 360, y: 530, width: 340, height: 20, type: "hazard" },
      // Floating bounce platform pointing to the goal
      { id: "p6_b1", x: 500, y: 350, width: 50, height: 15, type: "bounce" },
      // Dangerous floating disappearing blocks high up
      { id: "p6_dis1", x: 220, y: 220, width: 60, height: 15, type: "disappear" },
      { id: "p6_dis2", x: 380, y: 150, width: 60, height: 15, type: "disappear" },
      { id: "p6_dis3", x: 540, y: 200, width: 60, height: 15, type: "disappear" },
      // High right safe landing
      { id: "p6_right", x: 680, y: 300, width: 120, height: 250, type: "normal" }
    ],
    cores: [
      { id: "c6_1", x: 250, y: 140, radius: 10, collected: false },
      { id: "c6_2", x: 410, y: 70, radius: 10, collected: false },
      { id: "c6_3", x: 570, y: 120, radius: 10, collected: false },
      { id: "c6_4", x: 740, y: 220, radius: 10, collected: false }
    ]
  },
  {
    id: 7,
    name: "7. 無重力の糸紡ぎ (Weaver of Fate)",
    description: "極限の空中制御。壁とトゲに囲まれた狭い隙間を、斜めロープの射出力だけで突き進め。",
    difficulty: "Master",
    startX: 100,
    startY: 250,
    parTime: 100,
    hint: "足場が極端に少ないため、空中から空中へ斜めロープバウンドを連続で行う必要があります。ロープの角度が非常に重要です。耐久回数は3回に制限されているため、冷静な判断を！",
    platforms: [
      // Starting ledge high up
      { id: "p7_start", x: 0, y: 300, width: 120, height: 250, type: "normal" },
      // Hazard lines at bottom
      { id: "p7_bottom_lava", x: 120, y: 530, width: 680, height: 20, type: "hazard" },
      // Floating vertical walls creating small shafts
      { id: "p7_wall1", x: 280, y: 120, width: 30, height: 300, type: "normal" },
      { id: "p7_wall2", x: 520, y: 120, width: 30, height: 300, type: "normal" },
      // Hazards attached to walls
      { id: "p7_wh1", x: 250, y: 220, width: 30, height: 15, type: "hazard" },
      { id: "p7_wh2", x: 310, y: 320, width: 30, height: 15, type: "hazard" },
      { id: "p7_wh3", x: 490, y: 280, width: 30, height: 15, type: "hazard" },
      // Disappearing block under the deep core
      { id: "p7_dis1", x: 400, y: 380, width: 60, height: 15, type: "disappear" },
      // Normal platform right side
      { id: "p7_end", x: 680, y: 400, width: 120, height: 150, type: "normal" },
      // Checkpoint at the middle of the trial
      { id: "p7_cp1", x: 410, y: 200, width: 40, height: 10, type: "checkpoint", label: "SAVE" },
      { id: "p7_cpplat", x: 390, y: 210, width: 80, height: 20, type: "normal" }
    ],
    cores: [
      { id: "c7_1", x: 200, y: 150, radius: 10, collected: false },
      { id: "c7_2", x: 430, y: 90, radius: 10, collected: false },
      { id: "c7_3", x: 430, y: 320, radius: 10, collected: false },
      { id: "c7_4", x: 620, y: 200, radius: 10, collected: false },
      { id: "c7_5", x: 740, y: 320, radius: 10, collected: false }
    ]
  }
];
