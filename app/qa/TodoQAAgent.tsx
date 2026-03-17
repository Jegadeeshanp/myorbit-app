"use client";

import TaskTodoQAAgent from './TaskTodoQAAgent';
import { TODO_QA_CONFIG } from './taskTodoQaData';

export default function TodoQAAgent() {
  return <TaskTodoQAAgent config={TODO_QA_CONFIG} />;
}
