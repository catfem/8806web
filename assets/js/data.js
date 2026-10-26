// Site content that changes season to season lives here.
// Every text field is { en, zh } so the language toggle can swap it.
// Budget, parts, team size, exchanges, outreach and sponsors come from the team (its 2025 sponsorship
// proposal and later updates); competition results come from official FRC data (SEASONS).

export const SITE = {
  team: 8806,
  // Contact channels. Leave `email` empty to hide the e-mail button.
  instagram: 'frc_team_8806',
  facebook: 'https://www.facebook.com/search/top?q=FRC%20TEAM%208806',
  email: '',
  tba: 'https://www.thebluealliance.com/team/8806',
  frcEvents: 'https://frc-events.firstinspires.org/2026/team/8806',
  github: 'https://github.com/FRC8806',
  // Shows a one-line notice in the footer while this is a concept build.
  conceptNotice: true,
  // Drop an optimized GLB here (see README) to replace the procedural robot.
  robotModelUrl: '',
  // Link to the sponsorship proposal PDF; empty hides the button.
  proposalUrl: '',
  // When the results in SEASONS were last checked against FRC Events / TBA data (the results footnote).
  checked: '2026-10',
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
// Results, one entry per season, newest last. Every figure is an official one, checked in October 2026
// against copies of the FRC Events / The Blue Alliance (TBA) data (see README, "Results"):
// - `events`: the season's official FRC regionals. `code` is the FRC Events event code (it links to
//   frc-events.firstinspires.org/<year>/<code>); `teams` is the number of teams that played qualification
//   matches; `rank` is the final qualification rank (null where it isn't confirmed: the cell then shows
//   "—"); `wlt` is the qualification record; `alliance` is the playoff alliance number and 8806's role in
//   it (null role where it isn't confirmed); `result` is how the playoffs ended; `awards` use the exact
//   FRC Events names (AWARD below); `note` is a footnote shown under the event's awards.
// - `offseason`: off-season events (TBA keys). They are shown in the same table but are not FRC
//   regionals, and their results never count as FRC awards.
// - `record`: the season's official win-loss-tie record including playoffs, where it is confirmed.
// The headline counts (11 awards, 5 seasons, 9 regionals), the place lists, the newest-season scoreboard
// cell and the map labels are all computed from this list. `draft: true` keeps a season off the page
// and out of the award counts until its results are confirmed (its regionals and places still count).
const NEW_TAIPEI = { en: 'New Taipei City', zh: '新北市' };
const HAWAII = { en: 'Hawaii', zh: '夏威夷' };
const ISTANBUL = { en: 'Istanbul', zh: '伊斯坦堡' };
const ARIZONA = { en: 'Arizona', zh: '亞利桑那' };
const SHANGHAI = { en: 'Shanghai', zh: '上海' };

// Award names as FRC Events lists them; Chinese names as in the official 2026 雙北盃 plan
// (創意獎 is a translation: no official Chinese name was found). `by` is the sponsor or honouree that is
// part of the official name ("… sponsored by Littelfuse"). `star` marks the alliance results.
const AWARD = {
  winners: { en: 'Regional Winners', zh: '聯盟冠軍', star: true },
  finalists: { en: 'Regional Finalists', zh: '聯盟亞軍', star: true },
  rookie: { en: 'Rookie Inspiration Award', zh: '新秀啟發獎' },
  spirit: { en: 'Team Spirit Award', zh: '團隊精神獎' },
  control: { en: 'Innovation in Control Award', zh: '控制創新獎' },
  creativity: { en: 'Creativity Award', zh: '創意獎', by: { en: 'sponsored by Rockwell Automation', zh: 'Rockwell Automation 贊助' } },
  imagery: { en: 'Imagery Award', zh: '團隊意象獎', by: { en: 'in honor of Jack Kamen', zh: '紀念 Jack Kamen' } },
  design: { en: 'Industrial Design Award', zh: '工業設計獎' },
  engineering: { en: 'Excellence in Engineering Award', zh: '卓越工程獎', by: { en: 'sponsored by Littelfuse', zh: 'Littelfuse 贊助' } },
};

// How the playoffs ended (`sub` is the second, smaller line of the cell).
const RESULT = {
  winner: (score) => ({ en: 'Winner', zh: '冠軍', sub: { en: `won the final ${score}`, zh: `決賽 ${score} 獲勝` } }),
  finalist: (score) => ({ en: 'Finalist', zh: '亞軍', sub: { en: `lost the final ${score}`, zh: `決賽 ${score} 落敗` } }),
  out: (round) => ({ en: 'Eliminated', zh: `第${round}輪淘汰`, sub: { en: `in round ${round}`, zh: '' } }),
  third: (score) => ({ en: '3rd place', zh: '季軍', sub: { en: `lost the lower-bracket final ${score}`, zh: `敗部決賽 ${score} 落敗` } }),
};

// The two New Taipei City regionals and the two 2024 (and two 2026) Istanbul regionals shared a venue.
const NTC_HALL = { en: 'New Taipei City Exhibition Hall, Wugu', zh: '新北市工商展覽中心（五股）' };
const VW_ARENA = { en: 'Volkswagen Arena, Istanbul', zh: '伊斯坦堡 Volkswagen Arena' };
const TAF_HALL = { en: 'Athletics Federation hall, Bakırköy, Istanbul', zh: '土耳其田徑協會田徑館（伊斯坦堡 Bakırköy）' };

export const SEASONS = [
  { year: 2022, game: 'RAPID REACT', img: 'award-2022.webp',
    imgAlt: { en: 'Team 8806 with the Winner sign at the 2022 New Taipei City x Hon Hai Regional', zh: '第 8806 隊於 2022 新北市 x 鴻海區域賽，手持冠軍牌' },
    note: { en: 'Rookie season', zh: '新秀賽季' },
    events: [
      { code: 'TANT', place: NEW_TAIPEI, venue: NTC_HALL,
        name: { en: 'New Taipei City x Hon Hai Regional', zh: '新北市 x 鴻海區域賽' }, short: { en: 'New Taipei City x Hon Hai', zh: '新北市 x 鴻海' },
        dates: ['2022-03-03', '2022-03-06'], teams: 35, rank: null, wlt: '5-5-0',
        alliance: { n: 1, role: null }, result: RESULT.winner('2–0'),
        awards: [AWARD.winners, AWARD.rookie] },
    ] },
  { year: 2023, game: 'CHARGED UP', img: 'award-2023.webp',
    imgAlt: { en: 'Team 8806 with their 2023 robot', zh: '第 8806 隊與 2023 年的機器人' },
    note: { en: 'First regional abroad', zh: '首次出國參賽' },
    events: [
      { code: 'HIHO', place: HAWAII, venue: { en: 'University of Hawaii at Manoa, Honolulu', zh: '夏威夷大學馬諾阿分校（檀香山）' },
        name: { en: 'Hawaii Regional', zh: '夏威夷區域賽' }, short: { en: 'Hawaii', zh: '夏威夷' },
        dates: ['2023-03-22', '2023-03-25'], teams: 37, rank: null, wlt: '5-7-0',
        alliance: { n: 8, role: null }, result: RESULT.out(2),
        awards: [AWARD.spirit] },
    ],
    offseason: [
      { key: '2023tacy', venue: { en: 'Chiayi County Stadium', zh: '嘉義縣立體育館' },
        name: { en: 'Taiwan Playoff', zh: '台灣季後賽（Taiwan Playoff）' },
        dates: ['2023-07-29', '2023-07-30'], teams: 18, rank: null, wlt: '5-3-0',
        alliance: null, result: RESULT.winner('2–1') },
    ] },
  { year: 2024, game: 'CRESCENDO', img: 'award-2024.webp',
    imgAlt: { en: 'Team 8806 in the 2024 season', zh: '第 8806 隊 2024 賽季合照' },
    events: [
      // Rank 2 and captain: recomputed from the official match data (8806 and 7632 tied on ranking score;
      // 8806 is ahead on the next tiebreaker, average match points), so the rank-2 team captained Alliance 2.
      { code: 'TUIS', place: ISTANBUL, venue: VW_ARENA,
        name: { en: 'İstanbul Regional', zh: '伊斯坦堡區域賽' }, short: { en: 'İstanbul', zh: '伊斯坦堡' },
        dates: ['2024-03-05', '2024-03-07'], teams: 51, rank: 2, wlt: '8-1-0',
        alliance: { n: 2, role: 'captain' }, result: RESULT.finalist('0–2'),
        awards: [AWARD.finalists, AWARD.control] },
      { code: 'TUIS2', place: ISTANBUL, venue: VW_ARENA,
        name: { en: 'Bosphorus Regional', zh: '博斯普魯斯區域賽' }, short: { en: 'Bosphorus', zh: '博斯普魯斯' },
        dates: ['2024-03-08', '2024-03-10'], teams: 51, rank: null, wlt: '6-3-0',
        alliance: { n: 6, role: null }, result: RESULT.third('75–76'),
        awards: [AWARD.creativity] },
    ] },
  { year: 2025, game: 'REEFSCAPE', img: 'g-arizona-team.webp',
    imgAlt: { en: 'Team 8806 at the 2025 Arizona East Regional', zh: '第 8806 隊於 2025 亞利桑那東區區域賽' },
    events: [
      { code: 'NTWC', place: NEW_TAIPEI, venue: NTC_HALL,
        name: { en: 'New Taipei City Regional', zh: '新北市區域賽' }, short: { en: 'New Taipei City', zh: '新北市' },
        dates: ['2025-03-06', '2025-03-09'], teams: 37, rank: null, wlt: '5-6-0',
        alliance: { n: 8, role: null }, result: RESULT.out(2),
        awards: [AWARD.imagery] },
      { code: 'AZGL', place: ARIZONA, venue: { en: 'Corona del Sol High School, Tempe', zh: 'Corona del Sol 高中（坦佩）' },
        name: { en: 'Arizona East Regional', zh: '亞利桑那東區區域賽' }, short: { en: 'Arizona East', zh: '亞利桑那東區' },
        dates: ['2025-03-19', '2025-03-22'], teams: 42, rank: null, wlt: '6-5-0',
        alliance: { n: 4, role: 'pick1' }, result: RESULT.out(2),
        awards: [] },
    ],
    offseason: [
      { key: '2025tacy', venue: { en: 'Heping Basketball Gymnasium, Taipei', zh: '臺北和平籃球館' },
        name: { en: 'Taiwan Playoff (雙北盃)', zh: '雙北盃季後賽（Taiwan Playoff）' },
        dates: ['2025-08-21', '2025-08-23'], teams: 31, rank: null, wlt: '5-1-0',
        alliance: { n: 6, role: null }, result: RESULT.third('107–109') },
    ] },
  // 2026: no photo yet — the card shows a stat panel until `img` is set.
  { year: 2026, game: 'REBUILT', img: '', record: '15-14-1',
    events: [
      { code: 'CNSH', place: SHANGHAI, venue: { en: 'East China Normal University, Minhang', zh: '華東師範大學閔行校區' },
        name: { en: 'Shanghai Regional', zh: '上海區域賽' }, short: { en: 'Shanghai', zh: '上海' },
        dates: ['2026-03-12', '2026-03-15'], teams: 50, rank: 39, wlt: '2-5-0',
        alliance: { n: 2, role: 'pick2' },
        // The award is the alliance's; 8806 itself only played the first playoff match.
        result: { en: 'Finalist alliance\u00a0†', zh: '亞軍聯盟\u00a0†', sub: { en: '8806 played match 3', zh: '8806 出賽第3場' } },
        note: { en: '† 8806 played its alliance’s first playoff match (Match 3, won 463–438). Backup team 6304 played every later match, including both finals (lost 300–533 and 173–515).',
          zh: '† 8806 出賽聯盟的第一場淘汰賽（第 3 場，463–438 獲勝）；之後各場（含兩場決賽，300–533、173–515 落敗）由候補隊伍 6304 上場。' },
        awards: [AWARD.finalists, AWARD.design] },
      { code: 'TUHC', place: ISTANBUL, venue: TAF_HALL,
        name: { en: 'Haliç Regional', zh: 'Haliç 區域賽' }, short: { en: 'Haliç', zh: 'Haliç' },
        dates: ['2026-03-25', '2026-03-27'], teams: 43, rank: 11, wlt: '4-2-1',
        alliance: { n: 8, role: 'captain' }, result: RESULT.out(3),
        awards: [AWARD.engineering] },
      { code: 'TUIS3', place: ISTANBUL, venue: TAF_HALL,
        name: { en: 'Marmara Regional', zh: 'Marmara 區域賽' }, short: { en: 'Marmara', zh: 'Marmara' },
        dates: ['2026-03-28', '2026-03-30'], teams: 43, rank: 8, wlt: '6-3-0',
        alliance: { n: 5, role: 'captain' }, result: RESULT.out(3),
        awards: [AWARD.design] },
    ] },
];

export const GOALS = [
  { en: 'Regional Winners', zh: '聯盟冠軍' },
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
// Places the team has competed or exchanged with (lat, lon). A label's competition lines are computed
// from SEASONS (the official regionals held at that place, matched by `name.en`); `exch` lists the teams
// met there (EXCHANGES), `online` when that exchange was online.
export const PLACES = [
  { id: 'home', lat: 25.0, lon: 121.47, home: true, name: { en: 'New Taipei City', zh: '新北市' } },
  { id: 'shanghai', lat: 31.23, lon: 121.47, name: { en: 'Shanghai', zh: '上海' }, exch: '#6941' },
  { id: 'hawaii', lat: 21.31, lon: -157.86, name: { en: 'Hawaii', zh: '夏威夷' }, exch: '#4270' },
  { id: 'arizona', lat: 33.42, lon: -111.83, name: { en: 'Arizona', zh: '亞利桑那' }, exch: '#6413 #6479' },
  { id: 'istanbul', lat: 41.01, lon: 28.98, name: { en: 'Istanbul', zh: '伊斯坦堡' }, exch: '#6232 #6436' },
  { id: 'poland', lat: 51.25, lon: 22.57, name: { en: 'Poland', zh: '波蘭' }, exch: '#5883', online: true },
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
