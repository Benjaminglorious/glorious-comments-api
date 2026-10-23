import { Router } from 'express';
import { z } from 'zod';
import {
  createComment,
  getComment,
  listComments,
  patchComment,
} from '../services/comments';
import { SOURCES, STATUSES } from '../types';

export const commentsRouter = Router();

const sourceSchema = z.enum(['28car', 'glorious_web', 'facebook']);
const statusSchema = z.enum(['open', 'done']);

commentsRouter.get('/comments', (req, res) => {
  const source = req.query.source as string | undefined;
  const status = (req.query.status as string | undefined) ?? 'all';
  const assigneeRaw = req.query.assignee_id as string | undefined;

  if (source && !SOURCES.includes(source as (typeof SOURCES)[number])) {
    res.status(400).json({
      error: `Invalid source. Allowed: ${SOURCES.join(', ')}`,
    });
    return;
  }

  if (status !== 'all' && !STATUSES.includes(status as (typeof STATUSES)[number])) {
    res.status(400).json({
      error: `Invalid status. Allowed: open, done, all`,
    });
    return;
  }

  let assignee_id: number | undefined;
  if (assigneeRaw != null && assigneeRaw !== '') {
    assignee_id = Number(assigneeRaw);
    if (!Number.isInteger(assignee_id) || assignee_id < 1) {
      res.status(400).json({ error: 'assignee_id must be a positive integer' });
      return;
    }
  }

  const items = listComments({
    source: source as (typeof SOURCES)[number] | undefined,
    status: status as 'open' | 'done' | 'all',
    assignee_id,
  });

  res.json({ count: items.length, items });
});

commentsRouter.get('/comments/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }
  const item = getComment(id);
  if (!item) {
    res.status(404).json({ error: 'Comment not found' });
    return;
  }
  res.json(item);
});

const createBody = z.object({
  source: sourceSchema,
  author: z.string().min(1),
  content: z.string().min(1),
  external_id: z.string().optional().nullable(),
  url: z.string().url().optional().nullable().or(z.literal('')),
  created_at: z.string().optional().nullable(),
  auto_assign: z.boolean().optional(),
});

commentsRouter.post('/comments', (req, res) => {
  const parsed = createBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }
  const data = parsed.data;
  const item = createComment({
    source: data.source,
    author: data.author,
    content: data.content,
    external_id: data.external_id,
    url: data.url === '' ? null : data.url,
    created_at: data.created_at,
    auto_assign: data.auto_assign,
  });
  res.status(201).json(item);
});

const patchBody = z.object({
  status: statusSchema.optional(),
  assignee_id: z.number().int().positive().nullable().optional(),
});

commentsRouter.patch('/comments/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }
  const parsed = patchBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }
  try {
    const item = patchComment(id, parsed.data);
    if (!item) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }
    res.json(item);
  } catch (err) {
    if (err instanceof Error && err.message === 'ASSIGNEE_NOT_FOUND') {
      res.status(400).json({ error: 'assignee_id not found or inactive' });
      return;
    }
    throw err;
  }
});
