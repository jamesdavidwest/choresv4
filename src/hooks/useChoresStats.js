import { useMemo } from 'react';

export const useChoresStats = (chores) => {
  return useMemo(() => {
    if (!chores) return {
      totalChores: 0,
      completedChores: 0,
      pendingChores: 0
    };

    const totalChores = chores.length;
    const completedChores = chores.filter(chore => chore.is_complete).length;
    const pendingChores = totalChores - completedChores;

    return {
      totalChores,
      completedChores,
      pendingChores
    };
  }, [chores]);
};