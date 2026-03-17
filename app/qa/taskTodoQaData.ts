export type QACaseKind = 'unit' | 'senior' | 'e2e';
export type QAPriority = 'P0' | 'P1' | 'P2';
export type QAScenario = 'todo' | 'tasks';

export interface QACase {
  id: string;
  kind: QACaseKind;
  area: string;
  title: string;
  expected: string;
  priority: QAPriority;
}

export interface QAAgentConfig {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  scenario: QAScenario;
  routes: string[];
  apiPaths: string[];
  cases: QACase[];
}

const TODO_CASES: QACase[] = [
  { id: 'todo-unit-01', kind: 'unit', area: 'Task Creation', title: 'Create inbox task with title only', expected: 'Task is saved with active status, empty listId, and visible in Inbox.', priority: 'P0' },
  { id: 'todo-unit-02', kind: 'unit', area: 'Task Creation', title: 'Create Today task from smart list', expected: 'dueDate is set to today and task appears in Today immediately.', priority: 'P0' },
  { id: 'todo-unit-03', kind: 'unit', area: 'Task Lists', title: 'Create custom list', expected: 'List is created with increasing sortOrder and appears in sidebar.', priority: 'P1' },
  { id: 'todo-unit-04', kind: 'unit', area: 'Subtasks', title: 'Add subtask to existing task', expected: 'Subtask is appended with next sortOrder and rendered in detail drawer.', priority: 'P0' },
  { id: 'todo-unit-05', kind: 'unit', area: 'Completion', title: 'Complete task from list row', expected: 'Task status becomes completed, completedAt is set, and task leaves active smart lists.', priority: 'P0' },
  { id: 'todo-unit-06', kind: 'unit', area: 'Trash', title: 'Soft delete task', expected: 'Task stays in database with isActive=false and appears only in Trash.', priority: 'P0' },
  { id: 'todo-unit-07', kind: 'unit', area: 'Restore', title: 'Restore trashed task', expected: 'Task returns to active state with completedAt cleared and is visible again.', priority: 'P1' },
  { id: 'todo-unit-08', kind: 'unit', area: 'Task Details', title: 'Persist title, notes, priority, due date, due time, tags, and list changes', expected: 'PATCH /api/tasks/[id] returns updated task and UI refreshes without stale values.', priority: 'P0' },
  { id: 'todo-senior-01', kind: 'senior', area: 'Smart Lists', title: 'Validate Today, Inbox, Next 7 Days, Completed, and Trash counts', expected: 'Sidebar counts match API responses and change after each CRUD action.', priority: 'P0' },
  { id: 'todo-senior-02', kind: 'senior', area: 'Overdue UX', title: 'Overdue tasks surface in dedicated section', expected: 'Active overdue tasks render above normal tasks and are visually highlighted.', priority: 'P1' },
  { id: 'todo-senior-03', kind: 'senior', area: 'Task Detail Drawer', title: 'Open, edit, save, close, and reopen task detail panel', expected: 'Panel state is consistent and saved values persist after reopen.', priority: 'P0' },
  { id: 'todo-senior-04', kind: 'senior', area: 'List Deletion', title: 'Delete custom list from settings', expected: 'List is deactivated and its tasks are moved back to Inbox instead of being lost.', priority: 'P0' },
  { id: 'todo-senior-05', kind: 'senior', area: 'Error Handling', title: 'Observe toast behavior on failed task mutation', expected: 'User sees clear error toast and UI does not leave partial optimistic state.', priority: 'P1' },
  { id: 'todo-senior-06', kind: 'senior', area: 'Mobile Flow', title: 'Open mobile sidebar, switch list, and create task', expected: 'Sidebar opens/closes correctly and selected view updates on mobile.', priority: 'P1' },
  { id: 'todo-senior-07', kind: 'senior', area: 'Task Metadata', title: 'Verify tags, list badge, due time, and subtask completion summary on rows', expected: 'Each badge is accurate and remains readable after edits.', priority: 'P2' },
  { id: 'todo-senior-08', kind: 'senior', area: 'Unauthorized Access', title: 'Probe task routes without session', expected: 'Protected routes redirect and API endpoints return 401/403.', priority: 'P0' },
  { id: 'todo-e2e-01', kind: 'e2e', area: 'Happy Path', title: 'Create list -> create task -> add subtask -> complete task', expected: 'Task travels through the full lifecycle without manual refresh.', priority: 'P0' },
  { id: 'todo-e2e-02', kind: 'e2e', area: 'Trash Recovery', title: 'Delete task -> verify Trash -> restore task', expected: 'Task appears in Trash, then returns to active state after restore.', priority: 'P0' },
  { id: 'todo-e2e-03', kind: 'e2e', area: 'Scheduling', title: 'Create future-dated task and verify Next 7 Days placement', expected: 'Task is excluded from Today but included in Next 7 Days.', priority: 'P1' },
  { id: 'todo-e2e-04', kind: 'e2e', area: 'Inbox Flow', title: 'Create task from Inbox and later move it into custom list', expected: 'Task leaves Inbox and count updates in both list areas.', priority: 'P1' },
  { id: 'todo-e2e-05', kind: 'e2e', area: 'Task Settings', title: 'Create list from sidebar and delete it from settings page', expected: 'Cross-screen list management remains consistent.', priority: 'P1' },
  { id: 'todo-e2e-06', kind: 'e2e', area: 'Resilience', title: 'Refresh browser mid-session and continue editing same task', expected: 'Session persists and task state rehydrates from API correctly.', priority: 'P1' },
];

const TASK_CASES: QACase[] = [
  { id: 'tasks-unit-01', kind: 'unit', area: 'Pomodoro', title: 'Start pomodoro session', expected: 'POST /api/pomodoro creates a session and running state is enabled.', priority: 'P0' },
  { id: 'tasks-unit-02', kind: 'unit', area: 'Pomodoro', title: 'Complete or stop pomodoro session', expected: 'PATCH /api/pomodoro/[id] stores durationSecs and completion flag.', priority: 'P0' },
  { id: 'tasks-unit-03', kind: 'unit', area: 'Habits', title: 'Create habit', expected: 'Habit is created with default color/icon and appears in habit grid.', priority: 'P0' },
  { id: 'tasks-unit-04', kind: 'unit', area: 'Habits', title: 'Toggle habit log for today', expected: 'POST/DELETE log endpoints update completion state for the selected date.', priority: 'P0' },
  { id: 'tasks-unit-05', kind: 'unit', area: 'Countdowns', title: 'Create countdown', expected: 'Countdown is created with target date and correct direction.', priority: 'P0' },
  { id: 'tasks-unit-06', kind: 'unit', area: 'Countdowns', title: 'Edit countdown target date or direction', expected: 'PATCH /api/countdowns/[id] returns updated countdown record.', priority: 'P1' },
  { id: 'tasks-unit-07', kind: 'unit', area: 'Task Tools', title: 'Switch tool tabs between Pomodoro, Habits, and Countdowns', expected: 'Only one tool panel is visible at a time and task list UI is hidden while a tool is active.', priority: 'P1' },
  { id: 'tasks-unit-08', kind: 'unit', area: 'Settings', title: 'Load task settings list management page', expected: 'Task settings loads existing lists and allows deletion workflow.', priority: 'P1' },
  { id: 'tasks-senior-01', kind: 'senior', area: 'Tasks Hub UX', title: 'Validate Tasks page as combined productivity hub', expected: 'List management and tool panels coexist without navigation dead ends.', priority: 'P0' },
  { id: 'tasks-senior-02', kind: 'senior', area: 'Pomodoro UX', title: 'Pause, resume, and reset timer with optional task title', expected: 'Timer controls remain responsive and session data matches visible state.', priority: 'P0' },
  { id: 'tasks-senior-03', kind: 'senior', area: 'Habit Grid UX', title: 'Review seven-day grid accuracy and deletion behavior', expected: 'Day markers, today highlight, and log persistence are visually consistent.', priority: 'P1' },
  { id: 'tasks-senior-04', kind: 'senior', area: 'Countdown UX', title: 'Validate past, near-term, and distant countdown styling', expected: 'Visual urgency states change correctly based on day difference.', priority: 'P1' },
  { id: 'tasks-senior-05', kind: 'senior', area: 'Cross-tool Stability', title: 'Open tool tab, return to tasks list, and continue task editing', expected: 'Switching panels does not lose selected list context or break drawer state.', priority: 'P1' },
  { id: 'tasks-senior-06', kind: 'senior', area: 'Performance', title: 'Evaluate responsiveness of habit/countdown refresh after mutations', expected: 'APIs respond quickly and UI updates without stale entries.', priority: 'P2' },
  { id: 'tasks-senior-07', kind: 'senior', area: 'Accessibility', title: 'Check button labels, keyboard flow, and empty states across tools', expected: 'Core controls are reachable and empty states explain next action clearly.', priority: 'P2' },
  { id: 'tasks-senior-08', kind: 'senior', area: 'Security', title: 'Verify tool APIs reject unauthenticated requests', expected: 'Pomodoro, habits, and countdown endpoints stay protected behind auth.', priority: 'P0' },
  { id: 'tasks-e2e-01', kind: 'e2e', area: 'Focus Flow', title: 'Start pomodoro -> stop session -> verify recent sessions', expected: 'Session appears in recent history with duration and completion state.', priority: 'P0' },
  { id: 'tasks-e2e-02', kind: 'e2e', area: 'Habit Flow', title: 'Create habit -> log today -> remove log -> delete habit', expected: 'Habit lifecycle works fully without leaving orphaned logs in UI.', priority: 'P0' },
  { id: 'tasks-e2e-03', kind: 'e2e', area: 'Countdown Flow', title: 'Create countdown -> edit it -> remove it', expected: 'Countdown cards refresh after each mutation and removed cards disappear.', priority: 'P0' },
  { id: 'tasks-e2e-04', kind: 'e2e', area: 'Mixed Session', title: 'Create task, run pomodoro, then return to complete task', expected: 'Tool usage does not break the main to-do workflow.', priority: 'P1' },
  { id: 'tasks-e2e-05', kind: 'e2e', area: 'Settings', title: 'Open task settings and manage lists after using tools', expected: 'Settings screen stays consistent after prior task/tool mutations.', priority: 'P1' },
  { id: 'tasks-e2e-06', kind: 'e2e', area: 'Recovery', title: 'Refresh page while tool data exists and re-open each tool tab', expected: 'Pomodoro history, habits, and countdowns reload from APIs successfully.', priority: 'P1' },
];

export const TODO_QA_CONFIG: QAAgentConfig = {
  id: 'todo',
  title: 'To-Do QA Agent',
  subtitle: 'Core lists, tasks, subtasks, completion, trash, and restore coverage.',
  description: 'unit, senior QA, e2e · lists, smart views, CRUD, subtasks',
  scenario: 'todo',
  routes: ['/orbit/tasks', '/orbit/tasks/settings'],
  apiPaths: ['/api/task-lists', '/api/tasks?smartList=today', '/api/tasks?smartList=inbox', '/api/tasks?smartList=next7', '/api/tasks?smartList=completed', '/api/tasks?smartList=trash'],
  cases: TODO_CASES,
};

export const TASKS_QA_CONFIG: QAAgentConfig = {
  id: 'tasks',
  title: 'Tasks Hub QA Agent',
  subtitle: 'Pomodoro, habits, countdowns, settings, and task productivity workflow coverage.',
  description: 'unit, senior QA, e2e · pomodoro, habits, countdowns, settings',
  scenario: 'tasks',
  routes: ['/orbit/tasks', '/orbit/tasks/settings'],
  apiPaths: ['/api/pomodoro', '/api/habits', '/api/countdowns', '/api/task-lists'],
  cases: TASK_CASES,
};
