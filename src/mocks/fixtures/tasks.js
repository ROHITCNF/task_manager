/**
 * Tasks of the DMT workspace, built to reproduce the reference screenshots:
 * - every card visible in taskboard_light.png, verbatim
 * - column counts 4 / 49 / 10 / 0 / 9 / 1 (taskboard_light.png, home_light.png)
 * - open tasks per person 19/19/18/5/4/3/2/1 + 1 unassigned (home_light.png)
 * - calendar entries and "+N more" counts, and the "No due date" list (calendar_light.png)
 * - client task counts (clients_light.png)
 * Tasks that are not visible anywhere use neutral filler titles.
 *
 * Stored shape = wire Task minus embedded refs (the server expands keys into refs).
 */

const d = (day) => `2026-09-${String(day).padStart(2, '0')}`;

/** @typedef {{ title: string, status: string, priority: string, start?: number|null, end?: number|null, due?: number|null,
 *   checklist?: [number, number], comments?: number, clients?: string[], by: string, created: number, assignees?: string[] }} Spec */

/** Cards visible on the board, in column order (position order within each column). */
const VISIBLE = [
  // Backlog (4 — all visible)
  { title: 'Re: Intellicar Track Platform cleanup', status: 'backlog', priority: 'high', start: 23, end: 28, clients: ['Bounce'], by: 'anantha', created: 23, assignees: ['anantha'] },
  { title: 'Bgauss_new vehicle_component FOTA', status: 'backlog', priority: 'medium', start: 23, end: 23, clients: ['BGauss'], by: 'anantha', created: 23, assignees: ['anantha'] },
  { title: 'Re: Callisto Microvolt Project _ Jupiter electric', status: 'backlog', priority: 'medium', start: 1, end: 14, comments: 1, clients: ['Jupiter Wagon Limited'], by: 'anantha', created: 22, assignees: ['anantha'] },
  { title: 'Re: ALVA Request for Quotation : IoT', status: 'backlog', priority: 'medium', start: 17, end: 17, due: 30, comments: 1, clients: ['Alva Auto'], by: 'neeraj', created: 17, assignees: ['anantha'] },
  // To do (visible top)
  { title: 'Re: OF_ITPL-H-PI-0826-2_Bounce_15000 Qty_Aug 2026_DEL_04-08-26_Bhiwadi', status: 'todo', priority: 'urgent', start: 29, end: 29, due: 29, checklist: [0, 1], clients: ['Bounce'], by: 'neeraj', created: 29, assignees: ['bommidi'] },
  { title: 'Re: MrMed <> Intellicar - Integration Queries || 29 September 2026', status: 'todo', priority: 'urgent', start: 29, end: 29, due: 29, checklist: [0, 3], comments: 1, clients: ['Mr. Med'], by: 'neeraj', created: 29, assignees: ['anantha'] },
  { title: 'Re: Tum-tum ⇄ Intellicar MQTT Integration — SIT / UAT / Production Connection Details, and DEV Data Confirmations', status: 'todo', priority: 'urgent', start: 29, end: 29, due: 29, checklist: [0, 2], clients: ['Tum Tum'], by: 'neeraj', created: 29, assignees: ['anantha'] },
  { title: 'Re: Clarification Required – Callisto Microvolt Project', status: 'todo', priority: 'urgent', start: 29, end: 29, due: 29, checklist: [0, 1], clients: ['Jupiter Electric Mobility'], by: 'neeraj', created: 29, assignees: ['bommidi'] },
  // In progress (visible top)
  { title: 'Test10', status: 'in_progress', priority: 'none', start: 29, end: 29, due: 30, by: 'neeraj', created: 29, assignees: ['pradeep', 'anantha'] },
  { title: 'CAN Config Test Yukinova_superpower_v7', status: 'in_progress', priority: 'medium', start: 28, end: 29, by: 'abhinay', created: 28, assignees: [] },
  { title: 'Changes only in BGauss Co pro FW for RUV models.', status: 'in_progress', priority: 'urgent', start: 28, end: 30, due: 30, comments: 1, clients: ['BGauss'], by: 'neeraj', created: 24, assignees: ['anantha'] },
  { title: 'Re: Wire harness, connectors and fitment details', status: 'in_progress', priority: 'urgent', start: 23, end: 23, due: 23, clients: ['Tata Motors'], by: 'neeraj', created: 23, assignees: ['pradeep'] },
  { title: '[New ICP Creation] Xero EV', status: 'in_progress', priority: 'urgent', start: 22, end: 22, due: 22, by: 'neeraj', created: 22, assignees: ['pradeep'] },
  // Done (visible top)
  { title: 'APIs Integration', status: 'done', priority: 'medium', start: 28, end: 30, by: 'guttula', created: 25, assignees: ['guttula'] },
  { title: 'Re: DPC Code Request', status: 'done', priority: 'urgent', start: 24, end: 24, due: 24, comments: 1, clients: ['Multiple Clients'], by: 'neeraj', created: 24, assignees: ['pradeep'] },
  { title: 'code for beacon module parser 104/53, 100/99 and 100/99', status: 'done', priority: 'low', start: 23, end: 23, by: 'guttula', created: 23, assignees: ['guttula'] },
  { title: '-INTERNAL- New optix config for Bgauss vehicle details', status: 'done', priority: 'low', start: 22, end: 22, due: 22, by: 'anantha', created: 22, assignees: ['guttula'] },
  { title: 'Curd operation on accounts, deals', status: 'done', priority: 'medium', start: 22, end: 30, by: 'guttula', created: 22, assignees: ['guttula'] },
];

/** Tasks seen only in the calendar's "No due date" panel (not on visible cards). */
const NO_DUE_ONLY = [
  { title: 'New Vehicle On-boarding', status: 'todo', priority: 'medium', by: 'neeraj', created: 26 },
  { title: 'emo device bench test', status: 'canceled', priority: 'none', by: 'neeraj', created: 20, assignees: [] },
];

/**
 * To-do tasks seen only as calendar entries (the first three of a day).
 * Titles clipped in the reference (…) are completed with a best guess.
 */
const CALENDAR_ONLY = [
  [21, 'Re: Request to Remove Extra CAN Signal from IoT'],
  [21, 'Relay Quality Issue – Multiple Field Failures Reported 741H-72-1C-B-E (72V)'],
  [21, 'ITR devices came with un-tested firmware'],
  [22, 'nRF FW Release for Production - EG800G Module'],
  [22, 'Re: nRF FW Release for Production'],
  [22, 'Requirement for CAn devices in Vinfast vehicles'],
  [23, 'Validation of protocol for SAE J1939'], // clipped: "Validation of protocol for SA…"
  [23, 'New config development request'], // clipped: "New config development re…"
  [23, 'Vehicle Lock & Anti-Theft System'], // clipped: "Vehicle Lock & Anti-Theft S…"
  [28, 'Re: Moove INDIA - Mumbai - ITR devices reverse pick up'],
  [28, 'Aprilia SR 175 & SR 125 Harness status'],
  [28, 'Re: KYC documents _AIS device _5 Nos _BLR'],
].map(([day, title]) => ({ title, status: 'todo', priority: 'urgent', start: day, end: day, due: day, by: 'neeraj', created: day }));

/** Filler (never visible in the references). Due days fill the calendar's "+N more" and hidden columns. */
const FILLER_TODO_DAYS = [...Array(13).fill(21), ...Array(4).fill(22), ...Array(3).fill(28), 29, ...Array(4).fill(24), ...Array(4).fill(25), ...Array(3).fill(26)];
const FILLER_IN_PROGRESS_DAYS = [24, 24, 25, 25, 26];
const FILLER_DONE_DAYS = [24, 25, 25, 26];

let fillerNo = 0;
const filler = (status, priority, day, assignees) => {
  fillerNo += 1;
  return { title: `Pending action item ${fillerNo}`, status, priority, start: day, end: day, due: day, by: 'neeraj', created: 20, assignees };
};

const FILLER = [
  ...FILLER_TODO_DAYS.map((day) => filler('todo', 'urgent', day)),
  ...FILLER_IN_PROGRESS_DAYS.map((day) => filler('in_progress', 'medium', day)),
  ...FILLER_DONE_DAYS.map((day) => filler('done', 'medium', day, ['guttula'])),
];

/** Remaining client links so client task counts match clients_light.png. */
const FILLER_CLIENT_LINKS = [
  'Aeidith', 'Akasa', 'All Clients', 'Amararaja', 'Amararaja', 'Anantshree Vehicle Pvt. Ltd.',
  'BGauss', 'BGauss', 'BGauss', 'BGauss', 'Battery Smart', 'Battery Smart', 'Battery Smart', 'Bounce',
  'EVM Wheels', 'EVM Wheels', 'Eastman', 'Eastman', 'Epitome', 'Exicom', 'HWY Rider', 'Hero Motocorp',
];
FILLER_CLIENT_LINKS.forEach((clientName, i) => { FILLER[i].clients = [clientName]; });

/**
 * Open tasks without fixed assignees get people so the per-person open counts match home_light.png.
 * Fixed assignments already give anantha 8, bommidi 2, pradeep 3.
 */
const OPEN_ASSIGNMENT_QUEUE = [
  ...Array(17).fill('bommidi'), ...Array(15).fill('pradeep'), ...Array(11).fill('anantha'),
  ...Array(5).fill('devanand'), ...Array(4).fill('neeraj'), ...Array(3).fill('aswin'),
  ...Array(2).fill('prudhviraj'), 'abhinay',
];

const ALL = [...VISIBLE, ...NO_DUE_ONLY, ...CALENDAR_ONLY, ...FILLER];

const unassignedOpen = ALL.filter((t) => t.assignees === undefined && t.status !== 'done' && t.status !== 'canceled');
unassignedOpen.forEach((t) => { t.assignees = []; });
OPEN_ASSIGNMENT_QUEUE.forEach((person, i) => {
  let index = i % unassignedOpen.length;
  while (unassignedOpen[index].assignees.includes(person)) index = (index + 1) % unassignedOpen.length;
  unassignedOpen[index].assignees.push(person);
});

const STATUS_ORDER = ['backlog', 'todo', 'in_progress', 'testing_validation', 'done', 'canceled'];

/** @returns {object[]} stored tasks (wire format with keys instead of refs) */
export function buildTasks() {
  const positionCounter = Object.fromEntries(STATUS_ORDER.map((s) => [s, 0]));
  return ALL.map((spec, i) => {
    positionCounter[spec.status] += 1;
    const createdAt = `${d(spec.created)}T05:00:00Z`;
    return {
      id: `tsk_01J8Z${String(i + 1).padStart(4, '0')}0000000000000000000`.slice(0, 30),
      title: spec.title,
      description: null,
      status: spec.status,
      priority: spec.priority,
      startDate: spec.start ? d(spec.start) : null,
      endDate: spec.end ? d(spec.end) : null,
      dueDate: spec.due ? d(spec.due) : null,
      position: `a${String(positionCounter[spec.status]).padStart(4, '0')}`,
      checklist: { done: spec.checklist?.[0] ?? 0, total: spec.checklist?.[1] ?? 0 },
      commentCount: spec.comments ?? 0,
      createdByKey: spec.by,
      createdAt,
      updatedAt: createdAt,
      assigneeKeys: [...(spec.assignees ?? [])],
      clientNames: [...(spec.clients ?? [])],
      labelIds: [],
      version: 1,
    };
  });
}
