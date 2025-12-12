"use client";

import { useEffect, useState } from "react";
import { tasks, type Task, type FollowUp } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function TasksPage() {
  const { user } = useAuth();
  const [taskList, setTaskList] = useState<Task[]>([]);
  const [followUpList, setFollowUpList] = useState<FollowUp[]>([]);
  const [stats, setStats] = useState({ dueToday: 0, upcoming: 0, expired: 0, completed: 0 });
  const [followUpStats, setFollowUpStats] = useState({ dueToday: 0, upcoming: 0, overdue: 0 });
  const [loading, setLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksData, statsData, followUpsData, followUpStatsData] = await Promise.all([
        tasks.list(),
        tasks.stats(),
        tasks.followUps.list(),
        tasks.followUps.stats(),
      ]);
      setTaskList(tasksData.tasks);
      setStats(statsData);
      setFollowUpList(followUpsData.followUps);
      setFollowUpStats(followUpStatsData);
    } catch (error) {
      console.error("Failed to load tasks:", error);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!title.trim() || !dueDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await tasks.create({
        title,
        dueDate: new Date(dueDate).toISOString(),
        priority,
      });
      toast.success("Task created successfully");
      setShowAddTask(false);
      setTitle("");
      setDueDate("");
      setPriority("MEDIUM");
      loadData();
    } catch (error) {
      console.error("Failed to create task:", error);
      toast.error("Failed to create task");
    }
  };

  const handleToggleComplete = async (taskId: string) => {
    try {
      await tasks.toggleComplete(taskId);
      loadData();
    } catch (error) {
      console.error("Failed to toggle task:", error);
      toast.error("Failed to update task");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      await tasks.delete(taskId);
      toast.success("Task deleted successfully");
      loadData();
    } catch (error) {
      console.error("Failed to delete task:", error);
      toast.error("Failed to delete task");
    }
  };

  const handleDeleteFollowUp = async (leadId: string) => {
    if (!confirm("Clear this follow-up? The lead will no longer appear in the follow-ups list.")) return;

    try {
      await tasks.followUps.delete(leadId);
      toast.success("Follow-up cleared");
      loadData();
    } catch (error) {
      console.error("Failed to delete follow-up:", error);
      toast.error("Failed to clear follow-up");
    }
  };

  // Filter tasks by status
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dueTodayTasks = taskList.filter((task) => {
    const taskDate = new Date(task.dueDate);
    taskDate.setHours(0, 0, 0, 0);
    return !task.isCompleted && taskDate.getTime() === today.getTime();
  });

  const upcomingTasks = taskList.filter((task) => {
    const taskDate = new Date(task.dueDate);
    taskDate.setHours(0, 0, 0, 0);
    return !task.isCompleted && taskDate.getTime() > today.getTime();
  });

  const expiredTasks = taskList.filter((task) => {
    const taskDate = new Date(task.dueDate);
    taskDate.setHours(0, 0, 0, 0);
    return !task.isCompleted && taskDate.getTime() < today.getTime();
  });

  const completedTasks = taskList.filter((task) => task.isCompleted);

  // Filter follow-ups
  const dueTodayFollowUps = followUpList.filter((followUp) => {
    const followUpDate = new Date(followUp.nextFollowUpAt);
    followUpDate.setHours(0, 0, 0, 0);
    return followUpDate.getTime() === today.getTime();
  });

  const upcomingFollowUps = followUpList.filter((followUp) => {
    const followUpDate = new Date(followUp.nextFollowUpAt);
    followUpDate.setHours(0, 0, 0, 0);
    return followUpDate.getTime() > today.getTime();
  });

  const overdueFollowUps = followUpList.filter((followUp) => {
    const followUpDate = new Date(followUp.nextFollowUpAt);
    followUpDate.setHours(0, 0, 0, 0);
    return followUpDate.getTime() < today.getTime();
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-100 text-red-800";
      case "HIGH":
        return "bg-orange-100 text-orange-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "LOW":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tasks & Follow-ups</h1>
          <p className="text-sm text-gray-600">Manage your tasks and lead follow-ups</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showAddTask} onOpenChange={setShowAddTask}>
            <DialogTrigger asChild>
              <Button>+ Add Task</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Task title"
                  />
                </div>
                <div>
                  <Label htmlFor="dueDate">Due Date *</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddTask} className="w-full">
                  Create Task
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      {/* Removed per user request */}

      {/* Due Today Section */}
      {(dueTodayTasks.length > 0 || dueTodayFollowUps.length > 0) && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">🔥 Due Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Tasks Due Today */}
              {dueTodayTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={handleToggleComplete}
                  onDelete={handleDeleteTask}
                  formatDate={formatDate}
                  getPriorityColor={getPriorityColor}
                />
              ))}
              {/* Follow-ups Due Today */}
              {dueTodayFollowUps.map((followUp) => (
                <FollowUpItem key={followUp.id} followUp={followUp} formatDate={formatDate} getPriorityColor={getPriorityColor} onDelete={handleDeleteFollowUp} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Tasks */}
      {upcomingTasks.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>📅 Upcoming Tasks ({upcomingTasks.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={handleToggleComplete}
                  onDelete={handleDeleteTask}
                  formatDate={formatDate}
                  getPriorityColor={getPriorityColor}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Follow-ups */}
      {upcomingFollowUps.length > 0 && (
        <Card className="mb-6 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">📞 Upcoming Lead Follow-ups ({upcomingFollowUps.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingFollowUps.map((followUp) => (
                <FollowUpItem key={followUp.id} followUp={followUp} formatDate={formatDate} getPriorityColor={getPriorityColor} onDelete={handleDeleteFollowUp} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expired Tasks */}
      {expiredTasks.length > 0 && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">⚠️ Expired Tasks ({expiredTasks.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expiredTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={handleToggleComplete}
                  onDelete={handleDeleteTask}
                  formatDate={formatDate}
                  getPriorityColor={getPriorityColor}
                  isExpired
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overdue Follow-ups */}
      {overdueFollowUps.length > 0 && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">⚠️ Overdue Lead Follow-ups ({overdueFollowUps.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overdueFollowUps.map((followUp) => (
                <FollowUpItem key={followUp.id} followUp={followUp} formatDate={formatDate} getPriorityColor={getPriorityColor} isOverdue onDelete={handleDeleteFollowUp} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Tasks (Collapsed) */}
      {completedTasks.length > 0 && (
        <details className="mb-6">
          <summary className="cursor-pointer font-semibold text-gray-700 hover:text-gray-900">
            ✅ Completed Tasks ({completedTasks.length}) - Click to expand
          </summary>
          <div className="mt-4 space-y-2 pl-4">
            {completedTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={handleToggleComplete}
                onDelete={handleDeleteTask}
                formatDate={formatDate}
                getPriorityColor={getPriorityColor}
              />
            ))}
          </div>
        </details>
      )}

      {/* Empty State */}
      {taskList.length === 0 && followUpList.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            <div className="text-6xl mb-4">📝</div>
            <p className="text-xl font-semibold mb-2">No tasks yet</p>
            <p className="mb-4">Create your first task to get started!</p>
            <Button onClick={() => setShowAddTask(true)}>+ Add Task</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Task Item Component
function TaskItem({
  task,
  onToggle,
  onDelete,
  formatDate,
  getPriorityColor,
  isExpired = false,
}: {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  formatDate: (date: string) => string;
  getPriorityColor: (priority: string) => string;
  isExpired?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border hover:shadow-md transition-shadow">
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={task.isCompleted}
        onChange={() => onToggle(task.id)}
        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />

      {/* Task Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-medium ${task.isCompleted ? "line-through text-gray-400" : ""}`}>
            {task.title}
          </span>
          <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>
          {task.client && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              👤 {task.client.companyName}
            </span>
          )}
          {task.lead && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              🎯 {task.lead.name}
            </span>
          )}
          {isExpired && !task.isCompleted && (
            <span className="text-xs text-red-600 font-semibold">OVERDUE</span>
          )}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Due: {formatDate(task.dueDate)}
          {task.assignedTo && <span className="ml-2">• Assigned to: {task.assignedTo.fullName}</span>}
        </div>
      </div>

      {/* Delete Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(task.id)}
        className="text-red-600 hover:text-red-800 hover:bg-red-50"
      >
        🗑️
      </Button>
    </div>
  );
}

// Follow-up Item Component
function FollowUpItem({
  followUp,
  formatDate,
  getPriorityColor,
  isOverdue = false,
  onDelete,
}: {
  followUp: FollowUp;
  formatDate: (date: string) => string;
  getPriorityColor: (priority: string) => string;
  isOverdue?: boolean;
  onDelete: (leadId: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border hover:shadow-md transition-shadow">
      {/* Lead Indicator */}
      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
        📞
      </div>

      {/* Follow-up Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium">{followUp.name}</span>
          {followUp.companyName && (
            <span className="text-sm text-gray-500">@ {followUp.companyName}</span>
          )}
          <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(followUp.priority)}`}>
            {followUp.priority}
          </span>
          {isOverdue && (
            <span className="text-xs text-red-600 font-semibold">OVERDUE</span>
          )}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Follow-up: {formatDate(followUp.nextFollowUpAt)}
          {followUp.owner && <span className="ml-2">• Owner: {followUp.owner.fullName}</span>}
        </div>
      </div>

      {/* Link to Lead and Delete Button */}
      <div className="flex items-center gap-2">
        <a
          href={`/dashboard/leads`}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          View Lead →
        </a>
        <button
          onClick={() => onDelete(followUp.id)}
          className="text-red-600 hover:text-red-800 text-sm font-medium ml-2"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
