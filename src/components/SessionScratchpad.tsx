import React, { useState, useEffect } from 'react';
import { Check, Plus, Trash2, Edit3, Target } from 'lucide-react';

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export const SessionScratchpad: React.FC = () => {
  const [intention, setIntention] = useState(() => {
    return localStorage.getItem('komorebi_daily_intention') || 'Complete high-leverage architectural designs';
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('komorebi_session_tasks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return [
      { id: '1', text: 'Outline system modular boundaries', completed: true },
      { id: '2', text: 'Implement Web Audio oscillator graph', completed: false },
      { id: '3', text: 'Audit responsive layout and keyboard accessibility', completed: false },
    ];
  });

  const [newTaskInput, setNewTaskInput] = useState('');
  const [notes, setNotes] = useState(() => {
    return (
      localStorage.getItem('komorebi_quick_notes') ||
      'Focus Rule: Deep work requires mono-tasking without ambient notification clutter. Breathe deeply and sink into flow.'
    );
  });

  useEffect(() => {
    localStorage.setItem('komorebi_daily_intention', intention);
  }, [intention]);

  useEffect(() => {
    localStorage.setItem('komorebi_session_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('komorebi_quick_notes', notes);
  }, [notes]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;
    const newTask: Task = {
      id: Date.now().toString(),
      text: newTaskInput.trim(),
      completed: false,
    };
    setTasks([...tasks, newTask]);
    setNewTaskInput('');
  };

  const toggleTask = (id: string) => {
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const clearCompleted = () => {
    setTasks(tasks.filter((t) => !t.completed));
  };

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <section aria-label="Session Notes & Tasks" className="rounded-2xl border border-neutral-200/80 bg-white/70 backdrop-blur-sm p-4 sm:p-6 dark:border-neutral-800/80 dark:bg-neutral-900/60 shadow-sm transition-all space-y-6">
      {/* Daily Intention Banner */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1.5">
          <Target className="h-3.5 w-3.5" />
          <span>Core Session Intention</span>
        </div>
        <input
          type="text"
          value={intention}
          onChange={(e) => setIntention(e.target.value)}
          placeholder="What is your singular priority for this block?"
          className="w-full bg-transparent font-display text-base font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden dark:text-neutral-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Task Checklist */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Action Items ({completedCount}/{tasks.length})
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Concrete milestones for the current work session.
              </p>
            </div>
            {completedCount > 0 && (
              <button
                onClick={clearCompleted}
                className="text-[11px] text-neutral-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              >
                Clear completed
              </button>
            )}
          </div>

          {/* New Task Input Form */}
          <form onSubmit={handleAddTask} className="flex gap-2">
            <input
              type="text"
              placeholder="Add next action item..."
              value={newTaskInput}
              onChange={(e) => setNewTaskInput(e.target.value)}
              className="flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-amber-500 focus:outline-hidden dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
            />
            <button
              type="submit"
              className="flex items-center gap-1 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-800 dark:bg-amber-500 dark:text-neutral-950 dark:hover:bg-amber-400 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add</span>
            </button>
          </form>

          {/* Tasks List */}
          <ul className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {tasks.length === 0 ? (
              <li className="py-4 text-center text-xs text-neutral-400">
                No items remaining. Define your first task above.
              </li>
            ) : (
              tasks.map((task) => (
                <li
                  key={task.id}
                  className="group flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50/70 px-3 py-2 text-xs transition-colors dark:border-neutral-800/60 dark:bg-neutral-950/40"
                >
                  <label className="flex items-center gap-2.5 flex-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id)}
                      className="h-4 w-4 rounded border-neutral-300 text-amber-500 focus:ring-amber-500 dark:border-neutral-700"
                    />
                    <span
                      className={`${
                        task.completed
                          ? 'line-through text-neutral-400 dark:text-neutral-500'
                          : 'text-neutral-800 dark:text-neutral-200'
                      }`}
                    >
                      {task.text}
                    </span>
                  </label>

                  <button
                    onClick={() => deleteTask(task.id)}
                    title="Delete item"
                    aria-label={`Delete task ${task.text}`}
                    className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-500 p-1 transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Right Column: Markdown Scratchpad */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
              <Edit3 className="h-4 w-4 text-amber-500" />
              <span>Scratchpad & Insights</span>
            </h3>
            <span className="text-[11px] text-neutral-400">Auto-persisted</span>
          </div>

          <textarea
            rows={7}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Capture transient ideas, snippets, or takeaways..."
            className="w-full rounded-lg border border-neutral-300 bg-white p-3 text-xs leading-relaxed text-neutral-900 placeholder:text-neutral-400 focus:border-amber-500 focus:outline-hidden dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 font-sans"
          />
        </div>
      </div>
    </section>
  );
};
