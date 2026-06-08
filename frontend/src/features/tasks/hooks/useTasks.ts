import { useQuery } from '@tanstack/react-query';
import { getTasks } from '../api/tasks';
import { taskKeys } from '../query-keys';

export function useTasks() {
  return useQuery({
    queryKey: taskKeys.lists(),
    queryFn: getTasks,
  });
}
