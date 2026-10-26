// The team shop ("8806 Supply"): the catalog and how ordering works. Every text field is { en, zh }.
// CONCEPT: the products, prices, materials and the order window are proposals until the team confirms
// them with a supplier (see "Things to confirm" in the README). Nothing is paid on the site: an order is
// a message to the team on Instagram (or e-mail, if SITE.email is set), and the team confirms the total,
// payment and pickup or delivery in the chat.
//
// Images live in assets/img/shop as <image>-600.webp and <image>-1200.webp (transparent studio renders).

export const SHOP = {
  batch: { en: 'Season 2026 batch', zh: '2026 賽季批次' },
  // How an order is filled. The first option is the default in the bag.
  fulfilment: [
    { id: 'pickup', label: { en: 'Pick up at school', zh: '到校取貨' }, note: { en: 'Our Lady of Providence High School, New Taipei City — free', zh: '新北市崇光高中 — 免運費' } },
    { id: 'delivery', label: { en: 'Delivery in Taiwan', zh: '台灣宅配' }, note: { en: 'We\'ll quote shipping in the chat', zh: '運費將在對話中報價' } },
  ],
  // Most a bag holds of one item in one size (larger orders: message the team).
  maxQty: 10,
};

export const CATEGORIES = [
  { id: 'all', label: { en: 'All', zh: '全部' } },
  { id: 'apparel', label: { en: 'Apparel', zh: '服飾' } },
  { id: 'accessories', label: { en: 'Accessories', zh: '配件' } },
  { id: 'collectibles', label: { en: 'Pins & stickers', zh: '徽章與貼紙' } },
];

// Body width (chest, laid flat) and length in cm, per fit.
export const SIZE_GUIDE = {
  tee: { sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL'], chest: [46, 49, 52, 55, 58, 61], length: [66, 69, 72, 75, 77, 79] },
  hoodie: { sizes: ['S', 'M', 'L', 'XL', '2XL'], chest: [54, 57, 60, 63, 66], length: [68, 71, 74, 76, 78] },
};

const img = (src, en, zh) => ({ src, alt: { en, zh } });

export const PRODUCTS = [
  {
    id: 'scorpion-tee', cat: 'apparel', fit: 'tee', price: 590,
    name: { en: 'Scorpion Tee', zh: '蠍子 T 恤' },
    badge: { en: 'Team favourite', zh: '隊員最愛' },
    tagline: { en: 'The crest on the chest. 8806 across the back.', zh: '胸前是隊徽，背後是 8806。' },
    story: {
      en: 'Our scorpion crest, small on the chest. On the back, 8806 sits over a dimension line that reads “45 students” — because that is how the robot gets built — and the line from the team’s own shirts: always ready to strike.',
      zh: '胸前是小小的蠍子隊徽；背後的 8806 下方標了一條尺寸線，寫著「45 位學生」——機器人就是這樣做出來的。最下方是隊服上的那句話：隨時準備出擊。',
    },
    details: [
      { en: '240 g/m² cotton, relaxed fit', zh: '240 g/m² 純棉，寬鬆版型' },
      { en: 'Screen printed front and back', zh: '前後網版印刷' },
      { en: 'Woven 8806 neck label', zh: '領口 8806 織標' },
    ],
    colors: [
      { id: 'black', label: { en: 'Black', zh: '黑色' }, hex: '#141518', images: [
        img('tee-scorpion-front-black', 'Black T-shirt, front: a small white scorpion crest and 8806 on the chest', '黑色 T 恤正面：胸前白色小蠍子隊徽與 8806'),
        img('tee-scorpion-back-black', 'Black T-shirt, back: the scorpion crest, a large 8806, a dimension line reading 45 students and “Always ready to strike”', '黑色 T 恤背面：蠍子隊徽、大大的 8806、標著「45 STUDENTS」的尺寸線與「ALWAYS READY TO STRIKE」'),
      ] },
      { id: 'white', label: { en: 'White', zh: '白色' }, hex: '#efeeea', images: [
        img('tee-scorpion-front-white', 'White T-shirt, front: a small navy scorpion crest and 8806 on the chest', '白色 T 恤正面：胸前深藍色小蠍子隊徽與 8806'),
        img('tee-scorpion-back-white', 'White T-shirt, back: the navy scorpion crest, a large 8806 and a blue dimension line reading 45 students', '白色 T 恤背面：深藍色蠍子隊徽、大大的 8806 與藍色「45 STUDENTS」尺寸線'),
      ] },
    ],
  },
  {
    id: 'blueprint-tee', cat: 'apparel', fit: 'tee', price: 650,
    name: { en: 'Blueprint Tee', zh: '藍圖 T 恤' },
    badge: { en: 'New', zh: '新品' },
    tagline: { en: 'Our robot as a line drawing, on blueprint navy.', zh: '把機器人畫成線稿，印在藍圖色上。' },
    story: {
      en: 'The front is a hidden-line drawing rendered from the 3D robot on this site — every line in the print is an edge of the model — set in a drawing frame with zone letters and a title block: DWG 8806-001, built by students.',
      zh: '正面是由本網站的 3D 機器人模型算出的消隱線稿——印花上的每一條線都是模型真實的邊——再放進有分區編號與標題欄的圖框：圖號 8806-001，由學生繪製。',
    },
    details: [
      { en: '240 g/m² cotton, blueprint navy', zh: '240 g/m² 純棉，藍圖深藍色' },
      { en: 'Large front print, 8806 at the back neck', zh: '正面大印花，後領 8806' },
      { en: 'Relaxed fit', zh: '寬鬆版型' },
    ],
    colors: [
      { id: 'navy', label: { en: 'Blueprint navy', zh: '藍圖深藍' }, hex: '#20347a', images: [
        img('tee-blueprint-front', 'Navy T-shirt, front: a white line drawing of the robot in an engineering drawing frame with a title block', '深藍色 T 恤正面：白色機器人線稿，配上工程圖圖框與標題欄'),
        img('tee-blueprint-back', 'Navy T-shirt, back: 8806 and “Designed in New Taipei City” under the collar', '深藍色 T 恤背面：後領下方的 8806 與「DESIGNED IN NEW TAIPEI CITY」'),
      ] },
    ],
  },
  {
    id: 'pit-crew-hoodie', cat: 'apparel', fit: 'hoodie', price: 1380,
    name: { en: 'Pit Crew Hoodie', zh: 'Pit Crew 連帽衫' },
    badge: { en: 'Limited batch', zh: '限量批次' },
    tagline: { en: 'Heavyweight black, with a cobalt hood lining.', zh: '厚磅黑色，鈷藍色帽裡。' },
    story: {
      en: 'Made for long days in the pit: 8806 on the chest, the team motto — dream big, and never give up — down the sleeve, and the crest on the back. The hood is lined in alliance blue.',
      zh: '為 Pit 區的漫長比賽日而做：胸前 8806，袖子上是隊訓「敢於夢想，永不放棄」，背後是隊徽。帽裡是聯盟藍。',
    },
    details: [
      { en: '380 g/m² brushed fleece', zh: '380 g/m² 內刷毛' },
      { en: 'Cobalt hood lining, kangaroo pocket', zh: '鈷藍色帽裡、袋鼠口袋' },
      { en: 'Printed chest, sleeve and back', zh: '胸前、袖子、背後印花' },
    ],
    colors: [
      { id: 'black', label: { en: 'Black', zh: '黑色' }, hex: '#131417', images: [
        img('hoodie-front', 'Black hoodie, front: a cobalt hood lining, 8806 and “OLPDL · Pit crew” on the chest and the team motto down the sleeve', '黑色連帽衫正面：鈷藍色帽裡、胸前 8806 與「OLPDL · PIT CREW」、袖子上的隊訓'),
        img('hoodie-back', 'Black hoodie, back: “FRC Team 8806”, the scorpion crest and “Dream big, and never give up.”', '黑色連帽衫背面：「FRC TEAM 8806」、蠍子隊徽與「DREAM BIG, AND NEVER GIVE UP.」'),
      ] },
    ],
  },
  {
    id: 'alliance-cap', cat: 'accessories', price: 680,
    name: { en: 'Alliance Cap', zh: 'Alliance 棒球帽' },
    tagline: { en: 'Embroidered crest, 8806 in alliance blue.', zh: '刺繡隊徽，側邊是聯盟藍的 8806。' },
    story: {
      en: 'A six-panel cap with the scorpion embroidered in white on the front and 8806 in alliance blue on the side — for the stands, the pit and every bright day of queueing.',
      zh: '六片式棒球帽，正面是白色刺繡蠍子，側邊是聯盟藍的 8806——看台、Pit 區、排隊上場的大太陽下都用得到。',
    },
    details: [
      { en: 'Cotton twill, adjustable strap', zh: '棉質斜紋布、可調式後扣' },
      { en: 'Embroidered front and side', zh: '正面與側邊刺繡' },
      { en: 'One size', zh: '單一尺寸' },
    ],
    colors: [
      { id: 'black', label: { en: 'Black', zh: '黑色' }, hex: '#141519', images: [
        img('cap-front', 'Black cap with the scorpion crest embroidered in white and 8806 in blue on the side', '黑色棒球帽：白色刺繡蠍子隊徽，側邊藍色 8806'),
      ] },
    ],
  },
  {
    id: 'trading-pin', cat: 'collectibles', price: 200,
    name: { en: 'Trading Pin', zh: '交換徽章' },
    badge: { en: 'For pin trading', zh: '交換用' },
    tagline: { en: 'The crest in soft enamel, for trading at regionals.', zh: '軟琺瑯隊徽，帶去區域賽交換。' },
    story: {
      en: 'Pin trading is an FRC tradition: teams swap pins in the stands and the pits, and a lanyard full of pins is a map of every team you met. Ours is the crest in navy soft enamel with a silver finish, on its own backing card.',
      zh: '交換徽章是 FRC 的傳統：各隊在看台和 Pit 區互相交換，掛滿徽章的識別證帶就是一張認識過的隊伍地圖。我們的徽章是銀色電鍍、深藍軟琺瑯的隊徽，附專屬背卡。',
    },
    details: [
      { en: '32 mm soft enamel, silver finish', zh: '32 mm 軟琺瑯，銀色電鍍' },
      { en: 'Rubber clutch back', zh: '膠質背扣' },
      { en: 'On a backing card', zh: '附背卡' },
    ],
    colors: [
      { id: 'silver', label: { en: 'Silver', zh: '銀色' }, hex: '#c9ced6', images: [
        img('pin-front', 'Round enamel pin: the navy scorpion crest with a silver rim', '圓形琺瑯徽章：銀色邊框的深藍蠍子隊徽'),
        img('pin-card', 'The pin on a black backing card that reads “Trading pin — Trade me at a regional.”', '黑色背卡上的徽章，卡上寫著「Trading pin — Trade me at a regional.」'),
      ] },
    ],
  },
  {
    id: 'sticker-pack', cat: 'collectibles', price: 150,
    name: { en: 'Sticker Pack', zh: '貼紙組' },
    tagline: { en: 'Six die-cut stickers for laptops, toolboxes and robot carts.', zh: '六張造型貼紙，貼筆電、工具箱、機器人推車都好。' },
    story: {
      en: 'The crest, an 8806 badge, the warning sign from the team\'s shirts, “Built by 45 students.”, the robot blueprint — and one blank “your logo here” for the sponsor in your life.',
      zh: '隊徽、8806 徽標、隊服上的警告標誌、「Built by 45 students.」、機器人藍圖——還有一張留白的「YOUR LOGO HERE」，送給你身邊的贊助夥伴。',
    },
    details: [
      { en: 'Six matte vinyl stickers', zh: '六張霧面防水貼紙' },
      { en: 'Up to 9 cm, weatherproof', zh: '最大 9 公分，耐候' },
    ],
    colors: [
      { id: 'mixed', label: { en: 'Mixed', zh: '綜合' }, hex: '#2a6df4', images: [
        img('stickers-front', 'Six stickers: the crest, a blue 8806 badge, a warning triangle with the scorpion, “Built by 45 students.”, “Your logo here” and the robot blueprint', '六張貼紙：隊徽、藍色 8806、蠍子警告三角牌、「Built by 45 students.」、「YOUR LOGO HERE」與機器人藍圖'),
      ] },
    ],
  },
  {
    id: 'workshop-tote', cat: 'accessories', price: 450,
    name: { en: 'Workshop Tote', zh: '工作室帆布袋' },
    tagline: { en: 'Natural canvas, the robot in ink.', zh: '原色帆布，墨色機器人線稿。' },
    story: {
      en: 'Big enough for a laptop, a notebook and the spare parts you swore you would not bring. Printed with the robot line drawing as Fig. 1, 8806 and the year we started.',
      zh: '放得下筆電、筆記本，還有你說好不帶卻還是帶了的備用零件。印著機器人線稿（圖一）、8806 與建隊年份。',
    },
    details: [
      { en: '12 oz cotton canvas', zh: '12 oz 棉帆布' },
      { en: 'Long handles, fits A4 and a laptop', zh: '長提把，可放 A4 與筆電' },
    ],
    colors: [
      { id: 'natural', label: { en: 'Natural', zh: '原色' }, hex: '#e7dfcb', images: [
        img('tote-front', 'Natural canvas tote printed with “OLPDL Workshop”, a line drawing of the robot, 8806 and “Est. 2022”', '原色帆布袋：印著「OLPDL WORKSHOP」、機器人線稿、8806 與「EST. 2022」'),
      ] },
    ],
  },
  {
    id: 'team-bottle', cat: 'accessories', price: 790,
    name: { en: 'Team Bottle', zh: '隊伍保溫瓶' },
    tagline: { en: 'Matte black steel, laser-engraved.', zh: '霧黑不鏽鋼，雷射雕刻。' },
    story: {
      en: 'Competition days are long and the venue water lines are longer. A double-wall steel bottle with the crest and 8806 engraved down to the bare steel.',
      zh: '比賽日很長，會場的飲水機隊伍更長。雙層不鏽鋼保溫瓶，隊徽與 8806 雷射雕刻到不鏽鋼本色。',
    },
    details: [
      { en: '750 ml, double-wall insulated steel', zh: '750 ml 雙層真空不鏽鋼' },
      { en: 'Laser-engraved crest and 8806', zh: '雷射雕刻隊徽與 8806' },
      { en: 'Carry-loop lid', zh: '提環瓶蓋' },
    ],
    colors: [
      { id: 'black', label: { en: 'Matte black', zh: '霧黑' }, hex: '#1a1b1f', images: [
        img('bottle-front', 'Matte black bottle with the scorpion crest and 8806 laser-engraved in steel', '霧黑保溫瓶：雷射雕刻的蠍子隊徽與 8806'),
      ] },
    ],
  },
];
