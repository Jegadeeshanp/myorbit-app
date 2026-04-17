export interface TaskInstanceWithTask {
  id: string
  userId: string
  taskId: string
  date: string
  status: string
  isDeleted: boolean
  completedAt: Date | null
  task: {
    id: string
    title: string
    priority: string
    dueTime: string | null
    tags: string
    listId: string | null
    list?: { id: string; name: string; color: string | null; emoji: string | null } | null
  }
}

export interface TodayResponse {
  overdue:   TaskInstanceWithTask[]
  today:     TaskInstanceWithTask[]
  missed:    TaskInstanceWithTask[]
  completed: TaskInstanceWithTask[]
}
