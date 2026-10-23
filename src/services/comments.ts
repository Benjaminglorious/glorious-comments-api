import db from '../db';
import type { Comment, CommentStatus, CommentWithAssignee, Source } from '../types';
import { pickAssignee } from './assignment';

export interface ListFilters {
  source?: Source;
  assignee_id?: number;
  status?: CommentStatus | 'all';
}

export function listComments(filters: ListFilters = {}): CommentWithAssignee[] {
  const clauses: string[] = [];
  const params: Record<string, unknown> = {};

  if (filters.source) {
    clauses.push('c.source = @source');
    params.source = filters.source;
  }
  if (filters.assignee_id != null) {
    clauses.push('c.assignee_id = @assignee_id');
    params.assignee_id = filters.assignee_id;
  }
  if (filters.status && filters.status !== 'all') {
    clauses.push('c.status = @status');
    params.status = filters.status;
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  return db
    .prepare(
      `
      SELECT c.*, s.name AS assignee_name
      FROM comments c
      LEFT JOIN staff s ON s.id = c.assignee_id
      ${where}
      ORDER BY c.id ASC
    `
    )
    .all(params) as CommentWithAssignee[];
}

export function getComment(id: number): CommentWithAssignee | undefined {
  return db
    .prepare(
      `
      SELECT c.*, s.name AS assignee_name
      FROM comments c
      LEFT JOIN staff s ON s.id = c.assignee_id
      WHERE c.id = ?
    `
    )
    .get(id) as CommentWithAssignee | undefined;
}

export interface CreateCommentInput {
  source: Source;
  author: string;
  content: string;
  external_id?: string | null;
  url?: string | null;
  created_at?: string | null;
  auto_assign?: boolean;
}

export function createComment(input: CreateCommentInput): CommentWithAssignee {
  const assigneeId =
    input.auto_assign === false ? null : pickAssignee();

  const createdAt = input.created_at || undefined;

  const result = db
    .prepare(
      `
      INSERT INTO comments (source, author, content, external_id, url, status, assignee_id, created_at, updated_at)
      VALUES (
        @source,
        @author,
        @content,
        @external_id,
        @url,
        'open',
        @assignee_id,
        COALESCE(@created_at, datetime('now')),
        datetime('now')
      )
    `
    )
    .run({
      source: input.source,
      author: input.author,
      content: input.content,
      external_id: input.external_id ?? null,
      url: input.url ?? null,
      assignee_id: assigneeId,
      created_at: createdAt ?? null,
    });

  const created = getComment(Number(result.lastInsertRowid));
  if (!created) throw new Error('Failed to load created comment');
  return created;
}

export interface PatchCommentInput {
  status?: CommentStatus;
  assignee_id?: number | null;
}

export function patchComment(
  id: number,
  input: PatchCommentInput
): CommentWithAssignee | undefined {
  const existing = getComment(id);
  if (!existing) return undefined;

  const status = input.status ?? existing.status;
  const assigneeId =
    input.assignee_id !== undefined ? input.assignee_id : existing.assignee_id;

  if (input.assignee_id !== undefined && input.assignee_id !== null) {
    const staff = db
      .prepare(`SELECT id FROM staff WHERE id = ? AND active = 1`)
      .get(input.assignee_id);
    if (!staff) {
      throw new Error('ASSIGNEE_NOT_FOUND');
    }
  }

  db.prepare(
    `
    UPDATE comments
    SET status = @status,
        assignee_id = @assignee_id,
        updated_at = datetime('now')
    WHERE id = @id
  `
  ).run({
    id,
    status,
    assignee_id: assigneeId,
  });

  return getComment(id);
}

export type { Comment };
