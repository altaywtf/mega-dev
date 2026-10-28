<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import type { Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { splitTicket, type Problem } from '#lib/kb/problems';

  // `tickets`: the issue each problem is filed as. `repo`: where those issues live.
  let { ticket, tickets, repo }: { ticket: number; tickets: Record<Problem, number>; repo: string } = $props();

  const split = $derived(splitTicket(reports as Report[], ticket, tenantOf));
  const LABEL: Record<string, string> = {
    parser: 'shared parser reads dates month first',
    hint: 'booking-v3 form hint says MM/DD/YYYY',
    shift: 'date moves by one day',
    unplaced: 'no tenant on file',
  };
  const channels = (c: Record<string, number>) =>
    Object.entries(c)
      .sort((a, b) => b[1] - a[1])
      .map(([ch, n]) => `${ch} ${n}`)
      .join(' · ');
</script>

<p class="sum">
  <strong>{split.merged.length}</strong> reports in #{ticket}
  ({split.rows - split.merged.length} repeated rows dropped) ·
  <strong>{split.groups.length}</strong> problems
</p>
<p class="muted"><code>shift</code> reports stay counted under the cause the desk files them by, so rows add up to more than the total.</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>channels</th><th>tenants</th><th>seen</th><th>intake tag off</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each split.groups as g (g.problem)}
      <tr>
        <td><code>{g.problem}</code> {LABEL[g.problem]}</td>
        <td><strong>{g.reports.length}</strong></td>
        <td class="muted">{channels(g.channels)}</td>
        <td>{g.tenants}</td>
        <td class="muted">{g.firstSeen} → {g.lastSeen}</td>
        <td>{g.mistagged}</td>
        <td>
          {#if g.problem !== 'unplaced' && tickets[g.problem]}
            <a href="https://github.com/{repo}/issues/{tickets[g.problem]}">#{tickets[g.problem]}</a>
          {:else}—{/if}
        </td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .sum { font-size: 1.1rem; }
  .muted { color: var(--muted); font-size: 0.85em; }
</style>
