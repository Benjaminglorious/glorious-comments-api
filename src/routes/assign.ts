import { Router } from 'express';
import { rebalanceOpenComments } from '../services/assignment';
import { listComments } from '../services/comments';

export const assignRouter = Router();

assignRouter.post('/assign/rebalance', (_req, res) => {
  const result = rebalanceOpenComments();
  const open = listComments({ status: 'open' });
  const byStaff: Record<string, number> = {};
  for (const c of open) {
    const key = String(c.assignee_id ?? 'unassigned');
    byStaff[key] = (byStaff[key] ?? 0) + 1;
  }
  res.json({
    reassigned: result.reassigned,
    open_count: open.length,
    open_by_assignee_id: byStaff,
  });
});
