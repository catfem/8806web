// Site content that changes season to season lives here.
// Every text field is { en, zh } so the language toggle can swap it.
// Figures come from the team's 2025 sponsorship proposal.

export const SITE = {
  team: 8806,
  // Contact channels. Leave `email` empty to hide the e-mail button.
  instagram: 'frc_team_8806',
  facebook: 'https://www.facebook.com/search/top?q=FRC%20TEAM%208806',
  email: '',
  tba: 'https://www.thebluealliance.com/team/8806',
  frcEvents: 'https://frc-events.firstinspires.org/2025/team/8806',
  // Shows a one-line notice in the footer while this is a concept build.
  conceptNotice: true,
  // Drop an optimized GLB here (see README) to replace the procedural robot.
  robotModelUrl: '',
  // Link to the sponsorship proposal PDF; empty hides the button.
  proposalUrl: '',
};

// ---------------------------------------------------------------------------
// Budget (NT$). Totals are computed from these line items.
// group: 'build' = robot, registration, shipping & outreach; 'travel' = team travel.
export const BUDGET = [
  { id: 'parts', group: 'build', amount: 1_270_000,
    label: { en: 'Motors, electronics & drivetrain', zh: '電路耗材與零件' },
    detail: { en: 'Kraken X60 ×20, Kraken X44 ×12, swerve modules ×4, gears, belts, sensors, cameras, roboRIO, radio, wiring', zh: '海妖 X60 ×20、X44 ×12、Swerve 傳動 ×4、齒輪、皮帶、感測器、鏡頭、roboRIO、Radio、線材' } },
  { id: 'reg-frc', group: 'build', amount: 800_000,
    label: { en: 'FRC registration (3–4 regionals)', zh: 'FRC 註冊費（3–4 場國際賽事）' },
    detail: { en: 'Entry fees for 3–4 international FRC regionals per year', zh: '每年 3~4 個國際賽事註冊費' } },
  { id: 'structure', group: 'build', amount: 750_000,
    label: { en: 'Structural materials', zh: '機器人結構耗材' },
    detail: { en: 'Aluminium plate & tube, carbon fibre, field elements, bumpers, cutters, drill bits, fasteners, 3D-printing filament', zh: '鋁板、鋁管、碳纖維、場地道具、防撞桿、銑刀、鑽頭、螺絲、3D 列印線材' } },
  { id: 'reg-ftc', group: 'build', amount: 360_000,
    label: { en: 'FTC registration (1–2 events)', zh: 'FTC 註冊費（1–2 場賽事）' },
    detail: { en: 'Entry fees for 1–2 international FTC events per year', zh: '每年 1~2 個國際賽事註冊費' } },
  { id: 'freight', group: 'build', amount: 240_000,
    label: { en: 'Robot air freight', zh: '機器人運費' },
    detail: { en: 'Crating and shipping the robot overseas, NT$60,000 × 4 trips', zh: '出國打包之機器人托運費 6 萬 × 4' } },
  { id: 'marketing', group: 'build', amount: 180_000,
    label: { en: 'Outreach & sponsor materials', zh: '行銷品製作' },
    detail: { en: 'Pins, keychains, business plan, engineering notebooks — 100 sets', zh: '胸章、鑰匙圈、商業計劃書、工程筆記本 — 100 套' } },
  { id: 'misc', group: 'build', amount: 50_000,
    label: { en: 'Miscellaneous', zh: '雜支' },
    detail: { en: 'Everything else that keeps a season running', zh: '其他雜項支出' } },
  { id: 'travel-frc', group: 'travel', amount: 6_400_000,
    label: { en: 'FRC team travel', zh: 'FRC 比賽團費' },
    detail: { en: 'NT$100,000 per student × 16 students × 4 regionals', zh: '每人 10 萬 × 16 人 × 4 場' } },
  { id: 'travel-ftc', group: 'travel', amount: 1_600_000,
    label: { en: 'FTC team travel', zh: 'FTC 比賽團費' },
    detail: { en: 'NT$80,000 per student × 10 students × 2 events', zh: '每人 8 萬 × 10 人 × 2 場' } },
];

// ---------------------------------------------------------------------------
// "Sponsor a part": tangible line items a donor can put their name on.
export const PARTS = [
  { id: 'x60', price: 9_500, need: 20, icon: 'motor',
    name: { en: 'Kraken X60 motor', zh: '海妖 Kraken X60 馬達' },
    blurb: { en: 'The brushless motor that drives and steers our swerve modules.', zh: '驅動與轉向 swerve 模組的無刷馬達。' } },
  { id: 'x44', price: 5_500, need: 12, icon: 'motor-sm',
    name: { en: 'Kraken X44 motor', zh: '海妖 Kraken X44 馬達' },
    blurb: { en: 'Compact power for the elevator, intake and scoring mechanisms.', zh: '為升降機構、夾取與得分機構提供動力。' } },
  { id: 'notebook', price: 1_000, need: 100, icon: 'book',
    name: { en: 'Engineering notebook set', zh: '工程筆記本組' },
    blurb: { en: 'Where every design decision gets sketched, argued and recorded.', zh: '記錄每一次設計、討論與決策。' } },
  { id: 'freight', price: 60_000, need: 4, icon: 'plane',
    name: { en: 'Fly the robot to a regional', zh: '機器人出國托運一趟' },
    blurb: { en: 'Crate, insure and air-freight the robot to an overseas event.', zh: '打包並空運機器人至海外賽場。' } },
  { id: 'student', price: 100_000, need: 64, icon: 'student',
    name: { en: 'Send a student overseas', zh: '支持一位學生出國比賽' },
    blurb: { en: 'One student, one international regional — the trip that changes careers.', zh: '一位學生、一場國際賽事 — 改變人生方向的旅程。' } },
];

// ---------------------------------------------------------------------------
// Each season's awards. `result: true` marks a placing that is not an award; `star` highlights the
// biggest results; `at` names the regional when a season had more than one.
// `regionals` and `places` feed the "N regionals in …" lines.
// The headline counts ("7 awards in 4 seasons") and place lists are computed from this list.
// `draft: true` keeps a season off the page (and out of every count) until its results are confirmed.
const NEW_TAIPEI = { en: 'New Taipei City', zh: '新北市' };
const HAWAII = { en: 'Hawaii', zh: '夏威夷' };
const ISTANBUL = { en: 'Istanbul', zh: '伊斯坦堡' };
const ARIZONA = { en: 'Arizona', zh: '亞利桑那' };
const SHANGHAI = { en: 'Shanghai', zh: '上海' };
export const SEASONS = [
  { year: 2022, img: 'award-2022.webp', regionals: 1, places: [NEW_TAIPEI],
    event: { en: 'New Taipei City Regional', zh: '新北市區域賽' },
    note: { en: 'Rookie season', zh: '新秀球季' },
    awards: [
      { en: 'Regional Winner', zh: '聯盟冠軍獎', star: true },
      { en: 'Rookie Inspiration Award', zh: '新秀啟發獎' },
    ] },
  { year: 2023, img: 'award-2023.webp', regionals: 1, places: [HAWAII],
    event: { en: 'Hawaii Regional', zh: '夏威夷區域賽' },
    note: { en: 'Across the Pacific', zh: '橫越太平洋' },
    awards: [
      { en: 'Top 8 alliance', zh: '挺進前八強', result: true },
      { en: 'Team Spirit Award', zh: '團隊精神獎' },
    ] },
  { year: 2024, img: 'award-2024.webp', regionals: 2, places: [ISTANBUL],
    event: { en: 'Istanbul & Bosphorus Regionals', zh: '伊斯坦堡 & 博斯普魯斯區域賽' },
    note: { en: '8–1 in Istanbul qualifications', zh: '伊斯坦堡資格賽 8 勝 1 敗' },
    awards: [
      { en: 'Regional Finalist', zh: '聯盟亞軍獎', star: true, at: ISTANBUL },
      { en: 'Innovation in Control Award', zh: '創新控制獎', at: ISTANBUL },
      { en: 'Creativity Award', zh: '創造力獎', at: { en: 'Bosphorus', zh: '博斯普魯斯' } },
    ] },
  { year: 2025, img: 'g-arizona-team.webp', regionals: 2, places: [NEW_TAIPEI, ARIZONA],
    event: { en: 'New Taipei City & Arizona East Regionals', zh: '新北市 & 亞利桑那東區域賽' },
    note: { en: 'Two regionals, two continents', zh: '兩場區域賽、橫跨兩大洲' },
    awards: [
      { en: 'Top 8 alliance', zh: '挺進前八強', result: true, at: NEW_TAIPEI },
      { en: 'Imagery Award', zh: '榮譽意象獎', at: NEW_TAIPEI },
    ] },
  // 2026 — DRAFT. The team confirmed it competed in Shanghai, so Shanghai already counts in the
  // "regionals in …" lines (attendance is read from every season, drafts included). The card and the
  // award counts wait for the team's confirmed results: add the awards (and any other 2026 regional),
  // a 2026 photo, then delete `draft: true`.
  { year: 2026, draft: true, img: '', regionals: 1, places: [SHANGHAI],
    event: { en: 'Shanghai Regional', zh: '上海區域賽' },
    awards: [] },
];

export const GOALS = [
  { en: 'Regional Winner', zh: '聯盟冠軍獎' },
  { en: 'Impact Award', zh: '影響力獎' },
  { en: 'Engineering Inspiration Award', zh: '工程啟發獎' },
];

// ---------------------------------------------------------------------------
// Season calendar (month index 1–12). The page highlights the current month.
export const CALENDAR = [
  { m: 8,  t: { en: 'Recruiting', zh: '新生招募' }, d: { en: 'Interviews and onboarding for new members.', zh: '新生面試與招募。' } },
  { m: 9,  t: { en: 'Rookie training', zh: '新生培訓' }, d: { en: 'Mechanism design drills, laser-cutter training, rookie cup build.', zh: '機構設計練習、雷切機教學、新生盃設計與製作。' } },
  { m: 10, t: { en: 'R&D & parts check', zh: '技術鑽研・零件確認' }, d: { en: 'Prototype research, inventory, fundraising plan, rookie-cup code.', zh: '技術研究、零件設備盤點、規劃募資計畫、新生盃程式撰寫。' } },
  { m: 11, t: { en: 'Regional sign-ups', zh: '區域賽報名' }, d: { en: 'Event registration; electronics and materials purchasing; Onshape & CNC workshops.', zh: '區域賽報名、電子零件與工程材料採購、Onshape 研習及 CNC 教學。' } },
  { m: 12, t: { en: 'Mechanism workshops', zh: '機構設計研習' }, d: { en: 'Command-based Java workshops, intake & shooter design practice.', zh: 'JAVA command-based 程式研習、Intake／Shooter 機構設計練習。' } },
  { m: 1,  t: { en: 'Kickoff', zh: 'Kickoff 開季' }, d: { en: 'The new game is revealed. The build begins.', zh: '新賽季題目公布，正式開始打造機器人。' } },
  { m: 2,  t: { en: 'Scrimmages', zh: '模擬賽' }, d: { en: 'Drive practice, tuning and mock matches.', zh: '操控練習、調校與模擬賽。' } },
  { m: 3,  t: { en: 'Competition', zh: '正式比賽' }, d: { en: 'Regionals in Taiwan and abroad.', zh: '國內外區域賽正式登場。' } },
];

// ---------------------------------------------------------------------------
// Places the team has competed or exchanged with (lat, lon).
export const PLACES = [
  { id: 'home', lat: 25.0, lon: 121.47, home: true, name: { en: 'New Taipei City', zh: '新北市' }, what: { en: 'Home', zh: '我們的主場' } },
  { id: 'shanghai', lat: 31.23, lon: 121.47, name: { en: 'Shanghai', zh: '上海' }, what: { en: '2026 Regional · exchange with #6941', zh: '2026 區域賽 · 與 #6941 交流' } },
  { id: 'hawaii', lat: 21.31, lon: -157.86, name: { en: 'Hawaii', zh: '夏威夷' }, what: { en: '2023 Regional · #4270', zh: '2023 區域賽 · #4270' } },
  { id: 'arizona', lat: 33.42, lon: -111.83, name: { en: 'Arizona', zh: '亞利桑那' }, what: { en: '2025 Regional · #6413 #6479', zh: '2025 區域賽 · #6413 #6479' } },
  { id: 'istanbul', lat: 41.01, lon: 28.98, name: { en: 'Istanbul', zh: '伊斯坦堡' }, what: { en: '2024 Regionals · #6232 #6436', zh: '2024 區域賽 · #6232 #6436' } },
  { id: 'poland', lat: 51.25, lon: 22.57, name: { en: 'Poland', zh: '波蘭' }, what: { en: 'Online with #5883', zh: '與 #5883 線上交流' } },
];

// Exchange log, newest first.
export const EXCHANGES = [
  { date: '2025-03-19', teams: '#6479', where: { en: 'Arizona, USA', zh: '美國亞利桑那' } },
  { date: '2025-03-18', teams: '#6413', where: { en: 'Arizona, USA', zh: '美國亞利桑那' } },
  { date: '2025-02-03', teams: '#6413', where: { en: 'Online', zh: '線上' } },
  { date: '2025-02-02', teams: '#5883', where: { en: 'Poland · online', zh: '波蘭 · 線上' } },
  { date: '2024-10-27', teams: '#8569', where: { en: 'Taiwan', zh: '台灣' } },
  { date: '2024-07-04', teams: '#6941', where: { en: 'Shanghai', zh: '上海' } },
  { date: '2024-06-15', teams: { en: '14 Taiwanese teams', zh: '14 支台灣隊伍' }, where: { en: 'Taiwan', zh: '台灣' } },
  { date: '2024-03-04', teams: '#6232 #6436', where: { en: 'Istanbul', zh: '伊斯坦堡' } },
  { date: '2024-01-23', teams: '#6436', where: { en: 'Online', zh: '線上' } },
  { date: '2024-01-12', teams: '#6232', where: { en: 'Online', zh: '線上' } },
  { date: '2023-12-10', teams: '#8569', where: { en: 'Taiwan', zh: '台灣' } },
  { date: '2023-12-07', teams: '#4253', where: { en: 'Taiwan', zh: '台灣' } },
  { date: '2023-07-13', teams: '#6998', where: { en: 'Taiwan', zh: '台灣' } },
  { date: '2023-03-02', teams: '#4270', where: { en: 'Hawaii, USA', zh: '美國夏威夷' } },
  { date: '2022-07-09', teams: '#6998', where: { en: 'Taiwan', zh: '台灣' } },
  { date: '2022-07-08', teams: '#8121 #8169', where: { en: 'Taiwan', zh: '台灣' } },
];

// ---------------------------------------------------------------------------
export const OUTREACH = [
  { date: '2026-06-06', t: { en: 'Outreach booth in Kaohsiung', zh: '高雄擺攤推廣' } },
  { date: '2026-05-16',
    t: { en: 'Thank-you & awards ceremony', zh: '感謝會暨頒獎典禮' },
    note: { en: 'Season results presented to parents, sponsors and the public in the school auditorium; Zhongzheng Elementary students and their parents came too.', zh: '在崇光禮堂向家長、贊助夥伴與公眾報告本季成果；活動對外開放，中正國小的學生與家長也到場參與。' } },
  { date: '2026-03-21', t: { en: 'micro:bit class for elementary students at OLP', zh: '邀請國小生到崇光學習 micro:bit' } },
  { date: '2025-05-24', t: { en: 'Emerging-tech program booth, Songshan Cultural Park', zh: '新興科技計畫 松菸擺攤' } },
  { date: '2025-04-28', t: { en: 'FRC experience day — Zhuole & Zhongzheng Elementary', zh: 'FRC 體驗 — 卓樂國小 & 中正國小' } },
  { date: '2025-01-23', t: { en: 'OLP winter robotics camp', zh: '崇光冬令營' } },
  { date: '2025-01-14', t: { en: 'STEAM flea market — Qingtan Elementary', zh: '跳蚤市場 — 青潭國小' } },
  { date: '2024-12-20', t: { en: 'Introducing FRC — Taoyuan Senior High', zh: '推廣 FRC — 桃園高中' } },
  { date: '2024-11-30', t: { en: 'FRC & STEAM — Shuangfeng Elementary', zh: 'FRC & STEAM — 雙峰國小' } },
  { date: '2024-01-25', t: { en: 'OLP winter robotics camp', zh: '崇光冬令營' } },
  { date: '2024-01-12', t: { en: 'FRC & STEAM — Zhitan Elementary', zh: 'FRC & STEAM — 直潭國小' } },
  { date: '2023-12-28', t: { en: 'Pitching-robot workshop — Zhitan Elementary', zh: '投球機器人 — 直潭國小' } },
];

export const MEDIA = [
  { date: '2025-01-11', img: 'media-pts-2025.webp', t: { en: 'Featured by Public Television Service (PTS)', zh: '公共電視採訪' } },
  // hosted: an event the team ran, told in the "Partnership in action" callout rather than the press list
  { date: '2024-08', img: 'media-offseason-2024.webp', hosted: true, t: { en: 'Hosted the 2024 national FRC off-season event', zh: '舉辦 2024 全國高級中等學校 FRC 季後賽' } },
  { date: '2024-05-22', img: 'media-ner-2024.webp', t: { en: 'On air at National Education Radio', zh: '國立教育廣播電台專訪' } },
  { date: '2023-06-07', img: 'media-ner-2023.webp', t: { en: 'On air at National Education Radio', zh: '國立教育廣播電台專訪' } },
];

export const SPONSORS = [
  { en: 'Zebra Technologies', zh: 'Zebra' },
  { en: 'Pan-International', zh: 'Pan-International' },
  { en: 'New Taipei City Education Bureau', zh: '新北市政府教育局' },
  { en: 'Lions Clubs International', zh: '國際獅子會' },
  { en: 'Our Lady of Providence High School', zh: '天主教崇光高級中學' },
];
