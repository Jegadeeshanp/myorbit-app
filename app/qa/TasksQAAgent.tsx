"use client";

import TaskTodoQAAgent from './TaskTodoQAAgent';
import { TASKS_QA_CONFIG } from './taskTodoQaData';

export default function TasksQAAgent() {
  return <TaskTodoQAAgent config={TASKS_QA_CONFIG} />;
}
