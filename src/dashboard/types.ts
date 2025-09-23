export interface DashboardStat {
  id: string;
  label: string;
  value: string;
  trend: string;
  trendTone: 'positive' | 'negative' | 'neutral' | 'info';
}

export interface DashboardAlert {
  id: string;
  title: string;
  description: string;
  type: 'įspėjimas' | 'informacija' | 'kritinis';
  createdAt: string;
}

export interface DashboardTask {
  id: string;
  title: string;
  assignedTo: string;
  dueDate: string;
  status: string;
  priority: string;
}

export interface DashboardSnapshot {
  stats: DashboardStat[];
  alerts: DashboardAlert[];
  tasks: DashboardTask[];
}
