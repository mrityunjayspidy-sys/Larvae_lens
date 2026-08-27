import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useAuth } from '../features/auth/AuthContext';
import { VectorTask, TaskStatus, TreatmentAction } from '../types';
import { 
  Users, 
  CheckCircle2, 
  MapPin, 
  Clock, 
  Navigation, 
  CheckSquare, 
  Sparkles, 
  Filter, 
  Droplet,
  Flame,
  X
} from 'lucide-react';

export const FieldWorkerDashboard: React.FC = () => {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedTaskForCompletion, setSelectedTaskForCompletion] = useState<VectorTask | null>(null);
  const [actionTaken, setActionTaken] = useState<TreatmentAction>('Bti Biolarvicide Applied');
  const [treatmentChemical, setTreatmentChemical] = useState('Bti Granules 200 ITU/mg');
  const [dosageGrams, setDosageGrams] = useState('10');
  const [notes, setNotes] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['workerTasks'],
    queryFn: () => apiClient.getTasks(token),
    enabled: !!token,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ taskId, payload }: { taskId: string; payload: { status: TaskStatus; action_taken?: string; notes?: string; treatment_chemical?: string; dosage_grams?: number } }) => {
      setUpdatingId(taskId);
      return apiClient.updateTaskStatus(taskId, payload, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workerTasks'] });
      setSelectedTaskForCompletion(null);
      setUpdatingId(null);
    },
    onError: () => {
      setUpdatingId(null);
    }
  });

  const handleAcceptTask = (taskId: string) => {
    updateStatusMutation.mutate({
      taskId,
      payload: { status: 'accepted' }
    });
  };

  const handleArrivedOnSite = (taskId: string) => {
    updateStatusMutation.mutate({
      taskId,
      payload: { status: 'in_progress' }
    });
  };

  const handleCompleteTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskForCompletion) return;

    updateStatusMutation.mutate({
      taskId: selectedTaskForCompletion.id,
      payload: {
        status: 'completed',
        action_taken: actionTaken,
        treatment_chemical: treatmentChemical.trim() || undefined,
        dosage_grams: dosageGrams ? parseFloat(dosageGrams) : undefined,
        notes: notes.trim() || undefined
      }
    });
  };

  const filteredTasks = filterStatus === 'all'
    ? tasks
    : filterStatus === 'active'
    ? tasks.filter(t => t.status !== 'completed')
    : tasks.filter(t => t.status === 'completed');

  const activeCount = tasks.filter(t => t.status !== 'completed').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;

  return (
    <div className="max-w-5xl mx-auto space-y-6 px-4 py-6">
      {/* 1. Field Operator Header */}
      <div className="card bg-slate-900 text-white p-6 sm:p-8 rounded-card space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-950/80 text-teal-300 border border-teal-800/80 text-xs font-bold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              Field Abatement & Larvicide Operations
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Field Abatement Operations: {user?.full_name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Review assigned citizen scan incidents, navigate to exact GPS coordinates, apply biolarvicide treatment, and log completed actions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-control bg-slate-800 border border-slate-700 text-center min-w-[100px]">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Pending Tasks</span>
              <span className="text-2xl font-black font-mono text-amber-400">{activeCount}</span>
            </div>
            <div className="p-3 rounded-control bg-slate-800 border border-slate-700 text-center min-w-[100px]">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Completed</span>
              <span className="text-2xl font-black font-mono text-emerald-400">{completedCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Task Filters & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            Assigned Vector Tasks ({filteredTasks.length})
          </h2>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-4 h-4 text-slate-500" />
          <div className="grid grid-cols-3 p-0.5 bg-slate-200 rounded-control font-bold text-slate-900 border border-slate-300">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-control transition-all ${
                filterStatus === 'all' ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Tasks
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-3 py-1.5 rounded-control transition-all ${
                filterStatus === 'active' ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-3 py-1.5 rounded-control transition-all ${
                filterStatus === 'completed' ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Done ({completedCount})
            </button>
          </div>
        </div>
      </div>

      {/* 3. Task List */}
      {isLoading ? (
        <div className="card text-center py-12 space-y-3 bg-white border border-slate-200 shadow-card">
          <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500 font-bold">Fetching assigned vector tasks...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="card text-center py-14 space-y-3 bg-white border border-slate-200 shadow-card">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto text-emerald-600 border border-emerald-200">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-black text-slate-900">All Assigned Tasks Clear</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            You currently have no pending abatement assignments in this sector. New citizen positive detections will be dispatched here by the surveillance administrator.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => {
            const isDone = task.status === 'completed';
            const isAccepted = task.status === 'accepted';
            const isInProgress = task.status === 'in_progress';
            const isUpdating = updatingId === task.id;

            return (
              <div
                key={task.id}
                className={`card p-5 sm:p-6 transition-all border ${
                  isDone 
                    ? 'bg-slate-50/80 border-slate-200' 
                    : 'bg-white border-slate-200/90 hover:border-slate-400 hover:shadow-elevated'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Task Metadata */}
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono font-black text-sm text-slate-900">
                        Task #{task.id}
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        Scan Ref: <code className="font-mono text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">#{task.scan_id.slice(0, 8)}</code>
                      </span>

                      {/* Status Badge */}
                      {task.status === 'assigned' && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" /> New Assignment
                        </span>
                      )}
                      {task.status === 'accepted' && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200 flex items-center gap-1">
                          <Navigation className="w-3 h-3 text-sky-600" /> Accepted & En Route
                        </span>
                      )}
                      {task.status === 'in_progress' && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200 flex items-center gap-1">
                          <Droplet className="w-3 h-3 text-purple-600" /> On-Site Inspecting
                        </span>
                      )}
                      {task.status === 'completed' && (
                        <span className="badge-none text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Abatement Completed
                        </span>
                      )}
                    </div>

                    {/* AI Model Findings & Citizen Location */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                      <div className="p-3 rounded-control bg-slate-50 border border-slate-200">
                        <span className="text-slate-500 block font-bold text-[11px]">Reported Resident</span>
                        <span className="font-bold text-slate-900">{task.citizen_name}</span>
                      </div>

                      <div className="p-3 rounded-control bg-slate-50 border border-slate-200">
                        <span className="text-slate-500 block font-bold text-[11px]">AI Model Predicted Larvae</span>
                        <span className="font-mono font-black text-rose-600 text-sm flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5" />
                          {task.probable_larvae_count} Larvae Detected
                        </span>
                      </div>

                      <div className="p-3 rounded-control bg-slate-50 border border-slate-200">
                        <span className="text-slate-500 block font-bold text-[11px]">Exact Location</span>
                        {task.latitude && task.longitude ? (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${task.latitude},${task.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono font-bold text-teal-700 hover:underline flex items-center gap-1 text-[11px]"
                          >
                            <MapPin className="w-3.5 h-3.5 text-teal-600" />
                            {task.latitude.toFixed(4)}°, {task.longitude.toFixed(4)}°
                          </a>
                        ) : (
                          <span className="text-slate-600 font-medium">Zone Center / Manual</span>
                        )}
                      </div>
                    </div>

                    {/* Admin Instructions */}
                    {task.instructions && (
                      <div className="p-3 rounded-control bg-amber-50/60 border border-amber-200 text-xs text-amber-900 space-y-0.5">
                        <span className="font-bold block text-[11px]">Admin Instructions:</span>
                        <p className="text-amber-800 text-[11px] leading-relaxed">{task.instructions}</p>
                      </div>
                    )}

                    {/* Completed Treatment Record */}
                    {isDone && task.action_taken && (
                      <div className="p-3.5 rounded-control bg-emerald-50 border border-emerald-200 text-xs space-y-1">
                        <div className="flex items-center justify-between text-emerald-900 font-black">
                          <span>Action Taken: {task.action_taken}</span>
                          {task.completed_at && (
                            <span className="text-[11px] text-slate-500 font-normal">
                              Completed: {new Date(task.completed_at).toLocaleString()}
                            </span>
                          )}
                        </div>
                        {task.treatment_chemical && (
                          <p className="text-[11px] text-emerald-800">
                            Chemical: <strong>{task.treatment_chemical}</strong> ({task.dosage_grams || 0}g)
                          </p>
                        )}
                        {task.notes && (
                          <p className="text-[11px] text-slate-700 italic">
                            Notes: "{task.notes}"
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 4-Stage Action Workflow Buttons */}
                  {!isDone && (
                    <div className="flex flex-col gap-2 shrink-0 min-w-[200px] pt-2 md:pt-0">
                      {task.status === 'assigned' && (
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleAcceptTask(task.id)}
                          className="btn-primary text-xs py-3 px-4 flex items-center justify-center gap-2 shadow-sm"
                        >
                          <Navigation className="w-4 h-4 text-teal-400" />
                          Accept & Head to Site
                        </button>
                      )}

                      {isAccepted && (
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleArrivedOnSite(task.id)}
                          className="btn-primary text-xs py-3 px-4 flex items-center justify-center gap-2 shadow-sm"
                        >
                          <MapPin className="w-4 h-4 text-teal-400" />
                          Arrived on Site
                        </button>
                      )}

                      {(isAccepted || isInProgress) && (
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => setSelectedTaskForCompletion(task)}
                          className="btn-secondary bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-black text-xs py-3 px-4 flex items-center justify-center gap-2"
                        >
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                          Mark Work as Done
                        </button>
                      )}

                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${task.latitude || 28.6139},${task.longitude || 77.2090}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-center text-slate-600 hover:text-slate-900 font-bold py-1.5 hover:underline"
                      >
                        Open GPS Route in Google Maps
                      </a>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Complete Task Modal */}
      {selectedTaskForCompletion && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card w-full max-w-lg bg-white border border-slate-200 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-emerald-600" />
                Log Abatement Completion (Task #{selectedTaskForCompletion.id})
              </h3>
              <button
                onClick={() => setSelectedTaskForCompletion(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCompleteTask} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-900 block">
                  Action Taken at Water Site <span className="text-rose-600">*</span>
                </label>
                <select
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value as TreatmentAction)}
                  className="w-full text-xs p-2.5 rounded-control border border-slate-300 bg-white text-slate-900 font-bold focus:outline-none focus:border-slate-900"
                >
                  <option value="Bti Biolarvicide Applied">Bti Biolarvicide Applied</option>
                  <option value="Chemical Larvicide (Temephos)">Chemical Larvicide (Temephos)</option>
                  <option value="Container Emptied & Scrubbed">Container Emptied & Scrubbed</option>
                  <option value="Breeding Source Eliminated">Breeding Source Eliminated</option>
                  <option value="Water Source Sealed / Covered">Water Source Sealed / Covered</option>
                  <option value="Field Confirmed Clean (No Action Required)">Field Confirmed Clean (No Action Required)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-900 block mb-1">
                    Chemical / Product Name
                  </label>
                  <input
                    type="text"
                    value={treatmentChemical}
                    onChange={(e) => setTreatmentChemical(e.target.value)}
                    placeholder="e.g. Bti Granules 200 ITU"
                    className="w-full text-xs p-2.5 rounded-control border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-900 block mb-1">
                    Dosage Quantity (Grams)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={dosageGrams}
                    onChange={(e) => setDosageGrams(e.target.value)}
                    placeholder="10.0"
                    className="w-full text-xs p-2.5 rounded-control border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-900 block mb-1">
                  Field Operator Verification Notes
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Standing water in discarded tire treated with 10g Bti. Resident notified on container maintenance."
                  className="w-full text-xs p-2.5 rounded-control border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTaskForCompletion(null)}
                  className="btn-secondary text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateStatusMutation.isPending}
                  className="btn-primary bg-emerald-700 hover:bg-emerald-800 text-white text-xs py-2 px-5 shadow-sm"
                >
                  {updateStatusMutation.isPending ? 'Logging Completion...' : 'Confirm Work Completed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
