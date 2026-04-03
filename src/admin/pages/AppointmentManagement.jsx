import { useState, useMemo, useEffect } from 'react';
import { fetchAppointments } from '@/lib/adminApi.js';
import { Search, ChevronLeft, ChevronRight, TrendingUp, Calendar, IndianRupee } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const PAGE_SIZE = 10;
const STATUS_STYLES = {
    Completed: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    Pending: 'bg-amber-50 text-amber-600 border-amber-200',
    Cancelled: 'bg-red-50 text-red-500 border-red-200',
};

export default function AppointmentManagement() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [page, setPage] = useState(1);

    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAppointments();
    }, []);

    const loadAppointments = async () => {
        try {
            setLoading(true);
            const data = await fetchAppointments();
            setAppointments(data);
        } catch (err) {
            console.error('Failed to load appointments', err);
        } finally {
            setLoading(false);
        }
    };

    const totalRevenue = appointments.reduce((s, a) => s + (a.fee || 0) * 0.1, 0); // Assuming 10% platform fee
    const completed = appointments.filter(a => a.status === 'Completed').length;
    const pending = appointments.filter(a => a.status === 'Scheduled').length; // Scheduled in Supabase, Pending in UI

    const filtered = useMemo(() => appointments.filter(a => {
        const uStatus = a.status === 'Scheduled' ? 'Pending' : a.status;
        const matchStatus = statusFilter === 'All' || uStatus === statusFilter;
        const matchSearch = !search
            || (a.patientName || '').toLowerCase().includes(search.toLowerCase())
            || (a.doctorName || '').toLowerCase().includes(search.toLowerCase())
            || (a.id || '').includes(search);
        return matchStatus && matchSearch;
    }), [search, statusFilter, appointments]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-xl font-bold text-slate-800">Appointment Management</h1>
                <p className="text-sm text-slate-500 mt-0.5">{appointments.length} total appointments</p>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total', value: appointments.length, icon: Calendar, color: 'from-primary to-teal-400' },
                    { label: 'Completed', value: completed, icon: TrendingUp, color: 'from-emerald-500 to-emerald-400' },
                    { label: 'Pending', value: pending, icon: Calendar, color: 'from-amber-500 to-orange-400' },
                    { label: 'Revenue', value: `₹${(totalRevenue / 1000).toFixed(1)}K`, icon: IndianRupee, color: 'from-violet-500 to-purple-400' },
                ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
                        <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center bg-gradient-to-br', color)}>
                            <Icon size={18} className="text-white" />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-slate-800">{value}</p>
                            <p className="text-xs text-slate-500">{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input placeholder="Search by patient, doctor, ID…" value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                        className="pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition w-72" />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {['All', 'Completed', 'Pending', 'Cancelled'].map(s => (
                        <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                            className={cn('px-4 py-2 rounded-xl text-sm font-medium border transition',
                                statusFilter === s ? 'bg-primary text-white border-primary' : 'bg-white text-slate-500 border-slate-200 hover:border-primary/30')}>
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50">
                                {['ID', 'Patient', 'Doctor', 'Specialty', 'Date & Time', 'Type', 'Status', 'Fee', 'Revenue'].map(h => (
                                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {paged.map(apt => (
                                <tr key={apt.id} className="hover:bg-slate-50/70 transition-colors">
                                    <td className="px-4 py-3 text-xs text-slate-400 font-mono">{apt.id}</td>
                                    <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{apt.patientName || 'Unknown Patient'}</td>
                                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{apt.doctorName || 'Dr. Unknown'}</td>
                                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{apt.specialization || 'General'}</td>
                                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap text-xs">
                                        <p>{format(new Date(apt.date), 'dd MMM yyyy')}</p>
                                        <p className="text-slate-400">{apt.time_slot || apt.timeSlot}</p>
                                    </td>
                                    <td className="px-4 py-3 text-slate-500 text-xs">{apt.consultation_type || apt.type || 'Online'}</td>
                                    <td className="px-4 py-3">
                                        <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold border', STATUS_STYLES[apt.status === 'Scheduled' ? 'Pending' : apt.status] || STATUS_STYLES['Pending'])}>
                                            {apt.status === 'Scheduled' ? 'Pending' : apt.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-slate-700 font-semibold">₹{apt.fee || 0}</td>
                                    <td className="px-4 py-3">
                                        <span className={cn('font-semibold', ((apt.fee || 0) * 0.1) > 0 ? 'text-emerald-600' : 'text-slate-300')}>
                                            {((apt.fee || 0) * 0.1) > 0 ? `₹${((apt.fee || 0) * 0.1).toFixed(0)}` : '—'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {paged.length === 0 && (
                                <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-400 text-sm">No appointments found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                        <span className="text-xs text-slate-500">Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
                        <div className="flex gap-1">
                            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-primary hover:text-primary disabled:opacity-40 transition"><ChevronLeft size={14} /></button>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                                <button key={p} onClick={() => setPage(p)} className={cn('h-8 w-8 rounded-lg text-xs font-medium transition', page === p ? 'bg-primary text-white' : 'border border-slate-200 text-slate-500 hover:border-primary hover:text-primary')}>{p}</button>
                            ))}
                            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-primary hover:text-primary disabled:opacity-40 transition"><ChevronRight size={14} /></button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
