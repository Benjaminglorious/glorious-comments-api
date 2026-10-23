# glorious-comments-api

REST API skeleton for **Glorious Motors (東榮汽車)** that aggregates customer comments from:

| `source` value   | Origin                          |
|------------------|---------------------------------|
| `28car`          | 28car.com                       |
| `glorious_web`   | Glorious / 東榮 official website |
| `facebook`       | Facebook Page / comments        |

Demo data is seeded locally. Live source adapters under `src/adapters/` are **stubs** (TODO) — this project does not scrape sites or call Facebook.

## Stack

- Node.js + TypeScript + Express
- SQLite via `better-sqlite3`
- Even assignment of open comments to active staff (least open load, then lowest staff id)

## Setup

```bash
cp .env.example .env
npm install
npm run seed
npm start
```

- `npm run seed` — resets `data/comments.db` and loads 3 staff + 12 demo comments (auto-assigned).
- `npm start` — runs with `tsx` (no separate build required).
- `npm run dev` — same with file watch.
- Default port: **3000** (`PORT` in `.env`).

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness |
| GET | `/comments` | List; query `source`, `assignee_id`, `status` (`open` \| `done` \| `all`) |
| GET | `/comments/:id` | Get one |
| POST | `/comments` | Create (auto-assigns unless `auto_assign: false`) |
| PATCH | `/comments/:id` | Update `status` and/or `assignee_id` |
| GET | `/staff` | List staff |
| POST | `/staff` | Create staff |
| PATCH | `/staff/:id` | Update staff |
| POST | `/assign/rebalance` | Re-assign all open comments evenly |

## Curl examples

### Health

```bash
curl -s http://localhost:3000/health
```

### List by source (28car)

```bash
curl -s 'http://localhost:3000/comments?source=28car'
```

### List open comments for one assignee

```bash
curl -s 'http://localhost:3000/comments?status=open&assignee_id=1'
```

### Create comment (auto-assign)

```bash
curl -s -X POST http://localhost:3000/comments \
  -H 'Content-Type: application/json' \
  -d '{
    "source": "facebook",
    "author": "測試用戶",
    "content": "想問落地價包唔包牌費？",
    "external_id": "fb-demo-999",
    "url": "https://www.facebook.com/example/posts/999"
  }'
```

### Mark done

```bash
curl -s -X PATCH http://localhost:3000/comments/1 \
  -H 'Content-Type: application/json' \
  -d '{"status":"done"}'
```

### Add staff

```bash
curl -s -X POST http://localhost:3000/staff \
  -H 'Content-Type: application/json' \
  -d '{"name":"周雅文","email":"yaman.chow@glorious.example"}'
```

### Rebalance open assignments

```bash
curl -s -X POST http://localhost:3000/assign/rebalance
```

## Adapters (stubs)

```
src/adapters/
  types.ts           # SourceAdapter + ExternalComment
  twentyEightCar.ts  # TODO live 28car
  gloriousWeb.ts     # TODO live website / CRM
  facebook.ts        # TODO Graph API
  index.ts
```

Wire live fetch later; persist via `POST /comments` or a future sync job.

## Assignment rule

When a new comment is created (default) or on `POST /assign/rebalance`:

1. Consider only `staff.active = 1`
2. Prefer the staff member with the **fewest open** comments
3. Break ties with the **lowest staff id**
