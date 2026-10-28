// The problems #4471 really holds. causes.ts sorts a report by tenant and channel; that cannot see a
// report whose date moved by one day, which no day/month swap explains. The desk flags those by hand
// in desk-notes.json, so they become their own problem here instead of a footnote under `parser`.
import notes from '#lib/data/desk-notes.json';
import { causeOf, uniqueById, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = 'parser' | 'hint' | 'shift';

export function problemOf(r: Report, t: Tenant | undefined): Problem | 'unplaced' {
  if (notes.oneDayMove.includes(r.id)) return 'shift';
  return causeOf(r, t) ?? 'unplaced';
}

export type ProblemGroup = {
  problem: Problem | 'unplaced';
  reports: Report[];
  tenants: number;
  channels: Record<string, number>;
  firstSeen: string;
  lastSeen: string;
  // Reports intake tagged as something other than this problem.
  mistagged: number;
};

export function splitTicket(all: Report[], ticket: number, tenantOf: (r: Report) => Tenant | undefined) {
  const merged = uniqueById(all).filter((r) => r.mergedInto === ticket);
  const by = new Map<ProblemGroup['problem'], Report[]>();
  for (const r of merged) {
    const p = problemOf(r, tenantOf(r));
    by.set(p, [...(by.get(p) ?? []), r]);
  }
  const groups: ProblemGroup[] = [...by.entries()]
    .map(([problem, rs]) => {
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return {
        problem,
        reports: rs,
        tenants: new Set(rs.map((r) => r.tenant)).size,
        channels: rs.reduce<Record<string, number>>((n, r) => ({ ...n, [r.channel]: (n[r.channel] ?? 0) + 1 }), {}),
        firstSeen: days[0],
        lastSeen: days[days.length - 1],
        mistagged: rs.filter((r) => r.meta.intakeTag !== problem).length,
      };
    })
    .sort((a, b) => b.reports.length - a.reports.length);
  return { rows: all.filter((r) => r.mergedInto === ticket).length, merged, groups };
}
