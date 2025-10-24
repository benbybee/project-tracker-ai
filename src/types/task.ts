export type TaskStatus = 
  | 'not_started'
  | 'content'
  | 'design'
  | 'dev'
  | 'qa'
  | 'launch'
  | 'in_progress'
  | 'blocked'
  | 'completed';

export type Role = { 
  id: string; 
  name: string; 
  color: string;
};

export type Subtask = { 
  id: number | string; 
  title: string; 
  completed: boolean;
};

export type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  projectId?: string | null;
  projectName?: string | null;
  roleId?: string | null;
  role?: Role | string | null;
  dueDate?: string | null;    // ISO
  updatedAt?: string | null;  // ISO
  createdAt?: string | null;  // ISO
  version?: number;
  priorityScore?: 1 | 2 | 3 | 4 | "1" | "2" | "3" | "4" | null;
  isDaily?: boolean;
  subtasks?: Subtask[];
};

