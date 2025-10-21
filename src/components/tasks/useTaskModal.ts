import { useState } from 'react';

interface TaskModalState {
  isOpen: boolean;
  projectId?: string;
  defaultValues?: any;
}

export function useTaskModal() {
  const [modalState, setModalState] = useState<TaskModalState>({
    isOpen: false,
  });

  const openModal = (projectId: string, defaultValues?: any) => {
    setModalState({
      isOpen: true,
      projectId,
      defaultValues,
    });
  };

  const closeModal = () => {
    setModalState({
      isOpen: false,
    });
  };

  const editTask = (task: any) => {
    setModalState({
      isOpen: true,
      projectId: task.projectId,
      defaultValues: task,
    });
  };

  return {
    ...modalState,
    openModal,
    closeModal,
    editTask,
  };
}
