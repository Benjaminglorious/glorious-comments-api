import { Router } from 'express';
import { z } from 'zod';
import {
  createStaff,
  getStaff,
  listStaff,
  patchStaff,
} from '../services/staff';

export const staffRouter = Router();

staffRouter.get('/staff', (_req, res) => {
  const items = listStaff();
  res.json({ count: items.length, items });
});

staffRouter.get('/staff/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }
  const item = getStaff(id);
  if (!item) {
    res.status(404).json({ error: 'Staff not found' });
    return;
  }
  res.json(item);
});

const createBody = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().nullable(),
  active: z.boolean().optional(),
});

staffRouter.post('/staff', (req, res) => {
  const parsed = createBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }
  const item = createStaff(parsed.data);
  res.status(201).json(item);
});

const patchBody = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().nullable().optional(),
  active: z.boolean().optional(),
});

staffRouter.patch('/staff/:id', (req, res) => {
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
  const item = patchStaff(id, parsed.data);
  if (!item) {
    res.status(404).json({ error: 'Staff not found' });
    return;
  }
  res.json(item);
});
