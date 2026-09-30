import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import { TaskDrawer } from '../features/tasks/TaskDrawer.jsx';

/** /tasks/:taskId — task detail drawer over the board (card_click_state*_light.png). */
export default function TaskDetailPage() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const onClose = useCallback(() => navigate('/tasks'), [navigate]);
  return <TaskDrawer taskId={taskId} onClose={onClose} />;
}
