import React, { useState, useEffect } from 'react';
import type { Task } from '../../types';
import { api } from '../../api/client';
import { formatBDT, useAuth } from '../../context/AuthContext';
import {
  Plus,
  Edit2,
  Trash2,
  Clock,
  CheckCircle2,
  X,
  AlertCircle,
  Coins,
  Flame,
  Search
} from 'lucide-react';

export const AdminTasksTab: React.FC = () => {
  const { addToast } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reward, setReward] = useState('5.00');
  const [timerSeconds, setTimerSeconds] = useState('20');
  const [dailyLimit, setDailyLimit] = useState('10');
  const [active, setActive] = useState(true);
  const [adText, setAdText] = useState('');

  const loadTasks = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminTasks();
      setTasks(res.tasks);
    } catch (err: any) {
      addToast(err.message || 'Failed to load tasks', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleOpenCreate = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setReward('5.00');
    setTimerSeconds('20');
    setDailyLimit('10');
    setActive(true);
    setAdText('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setReward(task.reward.toString());
    setTimerSeconds(task.timerSeconds.toString());
    setDailyLimit(task.dailyLimit.toString());
    setActive(task.active);
    setAdText(task.adText || '');
    setIsModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTask) {
        await api.updateAdminTask(editingTask.id, {
          title,
          description,
          reward: parseFloat(reward),
          timerSeconds: parseInt(timerSeconds, 10),
          dailyLimit: parseInt(dailyLimit, 10),
          active,
          adText,
        });
        addToast(`Task "${title}" updated successfully`, 'success');
      } else {
        await api.createAdminTask({
          title,
          description,
          reward: parseFloat(reward),
          timerSeconds: parseInt(timerSeconds, 10),
          dailyLimit: parseInt(dailyLimit, 10),
          active,
          adText,
        });
        addToast(`Task "${title}" created successfully`, 'success');
      }
      setIsModalOpen(false);
      loadTasks();
    } catch (err: any) {
      addToast(err.message || 'Operation failed', 'error');
    }
  };

  const handleDeleteTask = async (id: string, taskTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete task "${taskTitle}"?`)) return;
    try {
      await api.deleteAdminTask(id);
      addToast('Task deleted successfully', 'success');
      loadTasks();
    } catch (err: any) {
      addToast(err.message || 'Failed to delete task', 'error');
    }
  };

  const handleToggleActive = async (task: Task) => {
    try {
      await api.updateAdminTask(task.id, { active: !task.active });
      addToast(`Task ${!task.active ? 'enabled' : 'disabled'}`, 'info');
      loadTasks();
    } catch (err: any) {
      addToast(err.message || 'Failed to toggle status', 'error');
    }
  };

  const filteredTasks = tasks.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-white">Timer Task Management</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure sponsored task campaigns, BDT rewards, countdown timers, and view completion rates.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Task</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search tasks..."
          className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Tasks Table */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-semibold">
              <tr>
                <th className="py-3.5 px-4">Task Details</th>
                <th className="py-3.5 px-4">Reward (BDT)</th>
                <th className="py-3.5 px-4">Timer</th>
                <th className="py-3.5 px-4">Attempts / Done</th>
                <th className="py-3.5 px-4">Paid Out</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-slate-300">
              {filteredTasks.map(task => (
                <tr key={task.id} className="hover:bg-slate-850/50 transition-colors">
                  <td className="py-3 px-4 max-w-xs">
                    <div className="font-semibold text-white truncate">{task.title}</div>
                    <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {task.description}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                    +{formatBDT(task.reward)}
                  </td>
                  <td className="py-3 px-4 font-mono">
                    {task.timerSeconds}s
                  </td>
                  <td className="py-3 px-4 font-mono">
                    <span className="text-white">{task.totalAttempts}</span>
                    <span className="text-slate-500"> / </span>
                    <span className="text-emerald-400 font-semibold">{task.completedTasks}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-teal-400">
                    {formatBDT(task.rewardsDistributed)}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleToggleActive(task)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-colors ${
                        task.active
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {task.active ? 'Active' : 'Disabled'}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => handleOpenEdit(task)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="Edit Task"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id, task.title)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-400 transition-colors"
                      title="Delete Task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingTask ? 'Edit Task Campaign' : 'Create Sponsored Task'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Visit Financial Partner Website"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Description / Instructions</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Specify steps user must follow during countdown..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Reward (BDT ৳)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={reward}
                    onChange={e => setReward(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Timer (Seconds)</label>
                  <input
                    type="number"
                    required
                    min={5}
                    value={timerSeconds}
                    onChange={e => setTimerSeconds(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Daily Limit</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={dailyLimit}
                    onChange={e => setDailyLimit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Sponsor Highlight / Ad Callout (Optional)</label>
                <input
                  type="text"
                  value={adText}
                  onChange={e => setAdText(e.target.value)}
                  placeholder="e.g. 50% discount on first recharge"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={active}
                  onChange={e => setActive(e.target.checked)}
                  className="rounded border-slate-800 text-indigo-600 focus:ring-0"
                />
                <label htmlFor="activeCheck" className="text-slate-300 cursor-pointer">
                  Campaign is active and visible to users immediately
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-md"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
