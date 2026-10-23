import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import './db'; // init + migrate
import { healthRouter } from './routes/health';
import { commentsRouter } from './routes/comments';
import { staffRouter } from './routes/staff';
import { assignRouter } from './routes/assign';

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

app.use(healthRouter);
app.use(commentsRouter);
app.use(staffRouter);
app.use(assignRouter);

app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
);

app.listen(port, () => {
  console.log(`glorious-comments-api listening on http://localhost:${port}`);
});
