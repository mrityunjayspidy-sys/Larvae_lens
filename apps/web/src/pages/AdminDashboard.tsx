import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useAuth } from '../features/auth/AuthContext';
import { ScanDetail } from '../types';
import { 
  Cpu, 
  Users, 
  CheckCircle2, 
  Send, 
  MapPin, 
  Sparkles, 
  Activity, 
  Layers,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();

  const [selectedScanForDispatch, setSelectedScanForDispatch] = useState<ScanDetail | null>(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const [priority, setPriority] = useState<string>('high');
  const [instructions, setInstructions] = useState<string>('Inspect water site, treat with Bti biolarvicide granules, and eliminate mosquito breeding containers.');

  // Fetch all tasks
  const { data: allTasks = [] } = useQuery({
    queryKey: ['adminTasks'],
    queryFn: () => apiClient.getTasks(token),
    enabled: !!token,
  });

  // Fetch field workers roster
  const { data: workers = [] } = useQuery({
    queryKey: ['adminWorkers'],
    queryFn: () => apiClient.getWorkers(token),
    enabled: !!token,
  });

  // Fetch unassigned positive scans
  const { data: unassignedScans = [], isLoading: unassignedLoading } = useQuery({
    queryKey: ['adminUnassignedScans'],
    queryFn: () => apiClient.getUnassignedScans(token),
    enabled: !!token,
  });

  // Fetch all municipal scans for overall KPIs
  const { data: allScansData } = useQuery({
    queryKey: ['adminAllScans'],
    queryFn: () => apiClient.getUserScans(token, 1, 100),
    enabled: !!token,
  });

  const assignMutation = useMutation({
    mutationFn: async (payload: { scan_id: string; worker_id: string; priority: string; instructions: string }) => {
      return apiClient.assignTask(payload, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTasks'] });
      queryClient.invalidateQueries({ queryKey: ['adminWorkers'] });
      queryClient.invalidateQueries({ queryKey: ['adminUnassignedScans'] });
      setSelectedScanForDispatch(null);
    }
  });

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScanForDispatch || !selectedWorkerId) return;

    assignMutation.mutate({
      scan_id: selectedScanForDispatch.id,
      worker_id: selectedWorkerId,
      priority,
      instructions
    });
  };

  const totalScans = allScansData?.total || 0;
  const completedTasks = allTasks.filter(t => t.status === 'completed').length;
  const activeTasks = allTasks.filter(t => t.status !== 'completed').length;
  const availableWorkersCount = workers.filter(w => w.status === 'available').length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 py-6">
      {/* 1. Command Center Header */}
      <div className="card bg-slate-900 text-white p-6 sm:p-8 rounded-card space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-950/80 text-teal-300 border border-teal-800/80 text-xs font-bold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              Surveillance Command & Abatement Dispatch Center
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Administrator Command: {user?.full_name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Dispatch positive citizen mosquito breeding detections to active field teams, track larvicide treatments, and manage AI models.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/admin/models" className="btn-secondary bg-slate-800 hover:bg-slate-700 text-white border-slate-700 text-xs py-2.5 px-4 font-bold">
              <Cpu className="w-4 h-4 text-teal-400" />
              Model Registry
            </Link>
            <Link to="/review" className="btn-secondary bg-slate-800 hover:bg-slate-700 text-white border-slate-700 text-xs py-2.5 px-4 font-bold">
              <Layers className="w-4 h-4 text-amber-400" />
              Review Queue
            </Link>
          </div>
        </div>

        {/* Global Surveillance Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-700/80">
          <div className="p-3.5 rounded-control bg-slate-800/80 border border-slate-700/60">
            <span className="text-[11px] text-slate-400 font-bold block">Total Citizen Scans</span>
            <span className="text-2xl font-black font-mono text-white">{totalScans}</span>
          </div>

          <div className="p-3.5 rounded-control bg-slate-800/80 border border-slate-700/60">
            <span className="text-[11px] text-amber-400 font-bold block">Pending Dispatch</span>
            <span className="text-2xl font-black font-mono text-amber-400">{unassignedScans.length}</span>
          </div>

          <div className="p-3.5 rounded-control bg-slate-800/80 border border-slate-700/60">
            <span className="text-[11px] text-teal-400 font-bold block">Active Field Tasks</span>
            <span className="text-2xl font-black font-mono text-teal-400">{activeTasks}</span>
          </div>

          <div className="p-3.5 rounded-control bg-slate-800/80 border border-slate-700/60">
            <span className="text-[11px] text-emerald-400 font-bold block">Completed Treatments</span>
            <span className="text-2xl font-black font-mono text-emerald-400">{completedTasks}</span>
          </div>
        </div>
      </div>

      {/* 2. Dispatch Section: Unassigned Positive Scans */}
      <div className="card space-y-4 bg-white border border-slate-200/90 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Send className="w-5 h-5 text-teal-600" />
              Citizen Detections Ready for Dispatch ({unassignedScans.length})
            </h2>
            <p className="text-xs text-slate-500">
              Positive larva detections reported by citizens that require field worker intervention.
            </p>
          </div>
        </div>

        {unassignedLoading ? (
          <div className="p-8 text-center text-xs text-slate-500 font-bold">
            Scanning for unassigned citizen reports...
          </div>
        ) : unassignedScans.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-card space-y-2 border border-slate-200">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="font-bold text-slate-900 text-xs">All Positive Detections Dispatched</p>
            <p className="text-[11px] text-slate-500">Every confirmed positive scan has been assigned to a field worker.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-black border-b border-slate-200">
                  <th className="py-3 px-3">Scan ID</th>
                  <th className="py-3 px-3">Predicted Larvae</th>
                  <th className="py-3 px-3">Risk Band</th>
                  <th className="py-3 px-3">Location Geotag</th>
                  <th className="py-3 px-3">Reported Time</th>
                  <th className="py-3 px-3 text-right">Dispatch Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {unassignedScans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">#{scan.id.slice(0, 8)}</td>
                    <td className="py-3 px-3 font-mono font-black text-rose-600">
                      {scan.probable_larvae_count || 0} Larvae
                    </td>
                    <td className="py-3 px-3">
                      <span className="badge-high text-[11px] py-0.5">
                        {scan.risk_level?.replace(/_/g, ' ') || 'High'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {scan.latitude && scan.longitude ? (
                        <span className="font-mono text-[11px] flex items-center gap-1 font-bold text-slate-800">
                          <MapPin className="w-3.5 h-3.5 text-teal-600" />
                          {scan.latitude.toFixed(4)}°, {scan.longitude.toFixed(4)}°
                        </span>
                      ) : (
                        <span className="text-slate-400">Manual Zone</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-medium">
                      {new Date(scan.created_at).toLocaleDateString()} {new Date(scan.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedScanForDispatch(scan);
                          if (workers.length > 0) setSelectedWorkerId(workers[0].id);
                        }}
                        className="btn-primary text-xs py-1.5 px-3 inline-flex items-center gap-1.5 shadow-2xs font-bold"
                      >
                        <Send className="w-3.5 h-3.5 text-teal-400" />
                        Assign Worker
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. Field Workers Availability Roster & Active Dispatches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Field Workers Availability Roster */}
        <div className="card space-y-4 bg-white border border-slate-200/90 shadow-card">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-600" />
              Field Worker Availability Roster ({workers.length})
            </h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              {availableWorkersCount} Ready
            </span>
          </div>

          <div className="space-y-2.5">
            {workers.map((worker) => (
              <div key={worker.id} className="p-3.5 rounded-control bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900">{worker.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      worker.status === 'available' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {worker.status === 'available' ? 'Available' : 'On-Site Active'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {worker.assigned_zone || 'Municipal Field Operations'} • {worker.phone || worker.email}
                  </p>
                </div>

                <div className="text-right shrink-0 font-mono">
                  <span className="text-[10px] text-slate-500 block font-bold">Workload</span>
                  <span className="font-bold text-slate-900 text-xs">
                    {worker.active_tasks_count} active / {worker.completed_tasks_count} done
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Vector Abatement Tasks */}
        <div className="card space-y-4 bg-white border border-slate-200/90 shadow-card">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-600" />
              Live Abatement Tasks ({allTasks.length})
            </h3>
          </div>

          {allTasks.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-card space-y-1 border border-slate-200 text-xs">
              <p className="font-bold text-slate-900">No Dispatched Tasks Yet</p>
              <p className="text-slate-500">Tasks assigned to field workers will be tracked live here.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto">
              {allTasks.map((task) => (
                <div key={task.id} className="p-3 rounded-control bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900">Task #{task.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      task.status === 'completed' 
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : task.status === 'accepted' || task.status === 'in_progress'
                        ? 'bg-sky-50 text-sky-800 border border-sky-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {task.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600">
                    <span>Assigned To: <strong>{task.assigned_worker_name}</strong></span>
                    <span className="font-mono text-rose-600 font-bold">{task.probable_larvae_count} Larvae</span>
                  </div>
                  {task.action_taken && (
                    <p className="text-[11px] text-emerald-800 font-medium">
                      Action: {task.action_taken}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. Dispatch Modal */}
      {selectedScanForDispatch && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card w-full max-w-lg bg-white border border-slate-200 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Send className="w-5 h-5 text-teal-600" />
                Dispatch Task (Scan #{selectedScanForDispatch.id.slice(0, 8)})
              </h3>
              <button
                onClick={() => setSelectedScanForDispatch(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDispatch} className="space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-control border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">AI Model Larvae Detected:</span>
                  <span className="font-mono font-black text-rose-600">{selectedScanForDispatch.probable_larvae_count || 0} Larvae</span>
                </div>
                {selectedScanForDispatch.latitude && selectedScanForDispatch.longitude && (
                  <p className="text-[11px] text-slate-600 font-mono">
                    📍 GPS: {selectedScanForDispatch.latitude.toFixed(4)}°, {selectedScanForDispatch.longitude.toFixed(4)}°
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-900 block">
                  Select Available Field Worker <span className="text-rose-600">*</span>
                </label>
                <select
                  required
                  value={selectedWorkerId}
                  onChange={(e) => setSelectedWorkerId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-control border border-slate-300 bg-white text-slate-900 font-bold focus:outline-none focus:border-slate-900"
                >
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.assigned_zone || 'Field'} - {w.active_tasks_count} active tasks)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-900 block">Priority Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-control border border-slate-300 bg-white text-slate-900 font-bold focus:outline-none focus:border-slate-900"
                >
                  <option value="high">High Priority (Urgent Abatement Required)</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-900 block">Field Action Instructions</label>
                <textarea
                  rows={3}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Instructions for the field worker..."
                  className="w-full text-xs p-2.5 rounded-control border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedScanForDispatch(null)}
                  className="btn-secondary text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignMutation.isPending}
                  className="btn-primary text-xs py-2 px-5 shadow-sm"
                >
                  {assignMutation.isPending ? 'Dispatching...' : 'Dispatch Task to Worker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
