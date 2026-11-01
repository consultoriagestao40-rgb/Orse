import React from 'react';
import ContextualModuleTransition from '@/components/ContextualModuleTransition';

export default function TasksLoading() {
  return <ContextualModuleTransition module="tasks" variant="fullscreen" />;
}
