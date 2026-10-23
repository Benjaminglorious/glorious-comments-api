import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const dbPath =
  process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'comments.db');
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

// Close any leftover WAL by removing DB files before opening a fresh connection.
// Dynamic require so this runs AFTER unlink (static imports are hoisted).
for (const suffix of ['', '-wal', '-shm']) {
  const p = dbPath + suffix;
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const db = require('./index').default as import('better-sqlite3').Database;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { pickAssignee } = require('../services/assignment') as typeof import('../services/assignment');

const staff = [
  { name: '陳志偉', email: 'chiwai.chan@glorious.example' },
  { name: '李美玲', email: 'meiling.li@glorious.example' },
  { name: '黃俊傑', email: 'chun.wong@glorious.example' },
];

const insertStaff = db.prepare(
  `INSERT INTO staff (name, email, active) VALUES (@name, @email, 1)`
);

const insertComment = db.prepare(
  `
  INSERT INTO comments (source, author, content, external_id, url, status, assignee_id, created_at, updated_at)
  VALUES (@source, @author, @content, @external_id, @url, 'open', @assignee_id, @created_at, datetime('now'))
`
);

const demoComments = [
  {
    source: '28car',
    author: '車友阿強',
    content: '想問東榮有冇現貨 Toyota Alphard 二手？預算大約 40 萬。',
    external_id: '28car-post-1001',
    url: 'https://www.28car.com/example/1001',
    created_at: '2026-10-10 09:15:00',
  },
  {
    source: '28car',
    author: 'HKDriver88',
    content: '請問可以安排週末睇車嗎？想睇下 BMW X5。',
    external_id: '28car-post-1002',
    url: 'https://www.28car.com/example/1002',
    created_at: '2026-10-11 14:22:00',
  },
  {
    source: '28car',
    author: '阿明',
    content: '有冇分期計劃？首期大概幾多？',
    external_id: '28car-msg-1003',
    url: null,
    created_at: '2026-10-12 11:05:00',
  },
  {
    source: '28car',
    author: 'CarLover',
    content: '想換車，舊車係 Mazda3，可唔可以估價？',
    external_id: '28car-post-1004',
    url: 'https://www.28car.com/example/1004',
    created_at: '2026-10-13 16:40:00',
  },
  {
    source: 'glorious_web',
    author: '王小姐',
    content: '官網查詢：想預約試駕 Honda Vezel。',
    external_id: 'web-inq-2001',
    url: 'https://www.driver.com.hk/example/inquiry/2001',
    created_at: '2026-10-10 10:00:00',
  },
  {
    source: 'glorious_web',
    author: '張先生',
    content: '請問觀塘店營業時間？星期六開唔開？',
    external_id: 'web-inq-2002',
    url: 'https://www.driver.com.hk/example/inquiry/2002',
    created_at: '2026-10-11 08:30:00',
  },
  {
    source: 'glorious_web',
    author: '林太',
    content: '想了解保養套餐同售後服務詳情。',
    external_id: 'web-inq-2003',
    url: 'https://www.driver.com.hk/example/inquiry/2003',
    created_at: '2026-10-14 13:18:00',
  },
  {
    source: 'glorious_web',
    author: 'Kenny',
    content: 'Contact form: Interested in Mercedes C-Class. Please call me.',
    external_id: 'web-inq-2004',
    url: 'https://www.driver.com.hk/example/inquiry/2004',
    created_at: '2026-10-15 09:55:00',
  },
  {
    source: 'facebook',
    author: 'Siu Ming',
    content: '呢架車仲有冇呀？價錢可唔可以再傾？',
    external_id: 'fb-comment-3001',
    url: 'https://www.facebook.com/example/posts/3001',
    created_at: '2026-10-12 19:20:00',
  },
  {
    source: 'facebook',
    author: 'Jenny Lo',
    content: '請問可以 WhatsApp 聯絡嗎？想問保險同過戶。',
    external_id: 'fb-comment-3002',
    url: 'https://www.facebook.com/example/posts/3002',
    created_at: '2026-10-13 20:05:00',
  },
  {
    source: 'facebook',
    author: 'David Chan',
    content: '有冇電動車選擇？想睇 Tesla / BYD。',
    external_id: 'fb-msg-3003',
    url: null,
    created_at: '2026-10-14 21:10:00',
  },
  {
    source: 'facebook',
    author: 'Amy Wong',
    content: '剛睇完廣告，想問落地價包唔包牌費？',
    external_id: 'fb-comment-3004',
    url: 'https://www.facebook.com/example/posts/3004',
    created_at: '2026-10-16 12:00:00',
  },
];

const seed = db.transaction(() => {
  for (const s of staff) {
    insertStaff.run(s);
  }
  for (const c of demoComments) {
    const assigneeId = pickAssignee();
    insertComment.run({
      ...c,
      assignee_id: assigneeId,
    });
  }
});

seed();

const staffCount = (
  db.prepare(`SELECT COUNT(*) AS n FROM staff`).get() as { n: number }
).n;
const commentCount = (
  db.prepare(`SELECT COUNT(*) AS n FROM comments`).get() as { n: number }
).n;
const bySource = db
  .prepare(
    `SELECT source, COUNT(*) AS n FROM comments GROUP BY source ORDER BY source`
  )
  .all();
const byAssignee = db
  .prepare(
    `
    SELECT s.id, s.name, COUNT(c.id) AS open_count
    FROM staff s
    LEFT JOIN comments c ON c.assignee_id = s.id AND c.status = 'open'
    GROUP BY s.id
    ORDER BY s.id
  `
  )
  .all();

console.log(`Seeded ${staffCount} staff and ${commentCount} comments.`);
console.log('By source:', bySource);
console.log('Open by assignee:', byAssignee);
console.log(`Database: ${dbPath}`);

db.close();
