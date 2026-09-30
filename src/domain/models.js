/**
 * Domain model type definitions (docs/lld/data-layer.md §2).
 * Domain objects are plain, frozen objects. LocalDate values stay 'YYYY-MM-DD' strings.
 *
 * @typedef {'backlog'|'todo'|'in_progress'|'testing_validation'|'done'|'canceled'} TaskStatus
 * @typedef {'urgent'|'high'|'medium'|'low'|'none'} Priority
 * @typedef {'OWNER'|'MEMBER'} Role
 * @typedef {string} LocalDate
 *
 * @typedef {{ id: string, name: string, avatarUrl: string|null }} UserRef
 * @typedef {UserRef & { email: string }} User
 * @typedef {{ id: string, name: string, role: Role, createdAt: Date }} Workspace
 * @typedef {{ user: UserRef, email: string, role: Role, joinedAt: Date }} Member
 * @typedef {{ id: string, name: string, colour: string }} ClientRef
 * @typedef {ClientRef & { taskCount: number, docCount: number, version: number }} Client
 * @typedef {{ id: string, name: string, colour: string }} Label
 * @typedef {{
 *   id: string, title: string, description?: string|null, status: TaskStatus, priority: Priority,
 *   startDate: LocalDate|null, endDate: LocalDate|null, dueDate: LocalDate|null, position: string,
 *   checklist: { done: number, total: number }, commentCount: number,
 *   createdBy: UserRef, createdAt: Date, updatedAt: Date,
 *   assignees: UserRef[], clients: ClientRef[], labels: Label[], version: number
 * }} Task
 * @typedef {{ id: string, title: string, status: TaskStatus, priority: Priority, dueDate: LocalDate|null }} CalendarTask
 * @typedef {{ key: string, count: number, user?: UserRef }} StatGroup
 * @typedef {{ groupBy: 'status'|'assignee', total: number, groups: StatGroup[], unassignedCount?: number }} TaskStats
 * @typedef {{ myOpenTasks: number, overdue: number, dueThisWeek: number, awaitingReview: number, unreadInbox: number }} DashboardStats
 * @typedef {{ today: LocalDate, stats: DashboardStats, dueSoon: Task[], awaitingReview: object[] }} Dashboard
 */

/**
 * @template T
 * @typedef {{ items: T[], nextCursor: string|null }} Page
 */

export {};
