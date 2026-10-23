import db from '../db';
import type { Staff } from '../types';

export function listStaff(): Staff[] {
  return db
    .prepare(`SELECT * FROM staff ORDER BY id ASC`)
    .all() as Staff[];
}

export function getStaff(id: number): Staff | undefined {
  return db.prepare(`SELECT * FROM staff WHERE id = ?`).get(id) as
    | Staff
    | undefined;
}

export interface CreateStaffInput {
  name: string;
  email?: string | null;
  active?: boolean;
}

export function createStaff(input: CreateStaffInput): Staff {
  const result = db
    .prepare(
      `
      INSERT INTO staff (name, email, active)
      VALUES (@name, @email, @active)
    `
    )
    .run({
      name: input.name,
      email: input.email ?? null,
      active: input.active === false ? 0 : 1,
    });

  const created = getStaff(Number(result.lastInsertRowid));
  if (!created) throw new Error('Failed to load created staff');
  return created;
}

export interface PatchStaffInput {
  name?: string;
  email?: string | null;
  active?: boolean;
}

export function patchStaff(
  id: number,
  input: PatchStaffInput
): Staff | undefined {
  const existing = getStaff(id);
  if (!existing) return undefined;

  db.prepare(
    `
    UPDATE staff
    SET name = @name,
        email = @email,
        active = @active
    WHERE id = @id
  `
  ).run({
    id,
    name: input.name ?? existing.name,
    email: input.email !== undefined ? input.email : existing.email,
    active:
      input.active !== undefined
        ? input.active
          ? 1
          : 0
        : existing.active,
  });

  return getStaff(id);
}
