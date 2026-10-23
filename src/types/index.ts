export type Source = '28car' | 'glorious_web' | 'facebook';
export type CommentStatus = 'open' | 'done';

export interface Staff {
  id: number;
  name: string;
  email: string | null;
  active: number; // 1 | 0 in SQLite
  created_at: string;
}

export interface Comment {
  id: number;
  source: Source;
  author: string;
  content: string;
  external_id: string | null;
  url: string | null;
  status: CommentStatus;
  assignee_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface CommentWithAssignee extends Comment {
  assignee_name: string | null;
}

export const SOURCES: Source[] = ['28car', 'glorious_web', 'facebook'];
export const STATUSES: CommentStatus[] = ['open', 'done'];
