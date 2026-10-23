import db from '../db';

/**
 * Pick the active staff member with the fewest open assignments.
 * Ties broken by lowest staff id.
 */
export function pickAssignee(): number | null {
  const row = db
    .prepare(
      `
      SELECT s.id
      FROM staff s
      LEFT JOIN comments c
        ON c.assignee_id = s.id AND c.status = 'open'
      WHERE s.active = 1
      GROUP BY s.id
      ORDER BY COUNT(c.id) ASC, s.id ASC
      LIMIT 1
    `
    )
    .get() as { id: number } | undefined;

  return row?.id ?? null;
}

/**
 * Rebalance all open comments evenly across active staff.
 * Assigns by open-count then lowest id after each assignment.
 */
export function rebalanceOpenComments(): { reassigned: number } {
  const openComments = db
    .prepare(
      `
      SELECT id FROM comments
      WHERE status = 'open'
      ORDER BY id ASC
    `
    )
    .all() as { id: number }[];

  const activeStaff = db
    .prepare(`SELECT id FROM staff WHERE active = 1 ORDER BY id ASC`)
    .all() as { id: number }[];

  if (activeStaff.length === 0) {
    return { reassigned: 0 };
  }

  // Clear assignees first so counts start fresh
  db.prepare(
    `UPDATE comments SET assignee_id = NULL, updated_at = datetime('now') WHERE status = 'open'`
  ).run();

  const update = db.prepare(
    `UPDATE comments SET assignee_id = ?, updated_at = datetime('now') WHERE id = ?`
  );

  const tx = db.transaction(() => {
    let reassigned = 0;
    for (const comment of openComments) {
      const assigneeId = pickAssignee();
      if (assigneeId == null) break;
      update.run(assigneeId, comment.id);
      reassigned += 1;
    }
    return reassigned;
  });

  return { reassigned: tx() };
}
