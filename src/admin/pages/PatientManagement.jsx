import { useState, useMemo, useEffect } from 'react';
import { fetchPatients, updatePatientStatus } from '@/lib/adminApi.js';
import { useAdmin } from '../context/AdminContext.jsx';
import {
    Search, Ban, CheckCircle, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Plus, Trash2, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase.js';

const PAGE_SIZE = 9;
const STATUS_STYLES = {
    active: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    pending: 'bg-amber-50 text-amber-600 border-amber-200',
    suspended: 'bg-red-50 text-red-500 border-red-200',
    // Legacy label support
    Active: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    Blocked: 'bg-red-50 text-red-500 border-red-200',
};

const EMPTY_PAT_FORM = { name: '', email: '', phone: '', city: 'Delhi' };

const APT_STATUS = {
    Completed: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    Pending: 'bg-amber-50 text-amber-600 border-amber-200',
    Cancelled: 'bg-red-50 text-red-500 border-red-200',
    Confirmed: 'bg-blue-50 text-blue-500 border-blue-200',
};
export default function PatientManagement() {
    const { isSuperAdmin } = useAdmin();
    const [patients, setPatients] = useState([]);
    const [dataLoading, setDataLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('All');
    const [page, setPage] = useState(1);
    const [expandedId, setExpandedId] = useState(null);
    const [confirmBlock, setConfirmBlock] = useState(null);
    const [toast, setToast] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [showAdd, setShowAdd] = useState(false);
    const [addForm, setAddForm] = useState(EMPTY_PAT_FORM);

    useEffect(() => {
        fetchPatients()
            .then(data => setPatients(data.map(p => ({
                ...p,
                name: p.full_name || p.name || p.email,
                joinedAt: p.created_at,
                totalAppointments: p.metadata?.totalAppointments || 0,
                bookingHistory: p.metadata?.bookingHistory || [],
                city: p.metadata?.city || '',
            }))))
            .catch(console.error)
            .finally(() => setDataLoading(false));
    }, []);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const toggleBlock = async (id) => {
        const patient = patients.find(p => p.id === id);
        const newStatus = (patient.status === 'suspended' || patient.status === 'Blocked') ? 'active' : 'suspended';
        try {
            await updatePatientStatus(id, newStatus);
            setPatients(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
            showToast(`${patient.name} ${newStatus === 'suspended' ? 'blocked' : 'unblocked'}`, newStatus === 'suspended' ? 'error' : 'success');
        } catch (err) {
            showToast(err.message, 'error');
        }
        setConfirmBlock(null);
    };

    const handleDeletePatient = async () => {
        try {
            await supabase.from('profiles').delete().eq('id', deleteTarget.id);
            setPatients(prev => prev.filter(p => p.id !== deleteTarget.id));
            showToast(`${deleteTarget.name} deleted`, 'error');
        } catch (err) {
            showToast(err.message, 'error');
        }
        setDeleteTarget(null);
    };

    const handleAddPatient = (e) => {
        e.preventDefault();
        // Patients self-register; admin can only view. Show info toast.
        showToast('Patients register themselves via the registration page.', 'warn');
        setShowAdd(false);
    };

    const filtered = useMemo(() => patients.filter(p => {
        const matchFilter = filter === 'All' || p.status === filter;
        const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
            || p.email.toLowerCase().includes(search.toLowerCase())
            || p.phone.includes(search);
        return matchFilter && matchSearch;
    }), [patients, search, filter]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-800">Patient Management</h1>
                    <p className="text-sm text-slate-500 mt-0.5">{patients.length} registered patients</p>
                </div>
                {isSuperAdmin && (
                    <button onClick={() => setShowAdd(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-teal-500 text-white text-sm font-semibold shadow-md shadow-primary/25 hover:shadow-lg transition-all">
                        <Plus size={16} /> Add Patient
                    </button>
                )}
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input placeholder="Search patients…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                        className="pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition w-64" />
                </div>
                <div className="flex gap-2">
                    {['All', 'Active', 'Blocked'].map(f => (
                        <button key={f} onClick={() => { setFilter(f); setPage(1); }}
                            className={cn('px-4 py-2 rounded-xl text-sm font-medium border transition',
                                filter === f ? 'bg-primary text-white border-primary' : 'bg-white text-slate-500 border-slate-200 hover:border-primary/30')}>
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50">
                            {['Patient', 'Contact', 'City', 'Joined', 'Appointments', 'Status', 'Actions', ''].map(h => (
                                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {paged.map(pat => (
                            <>
                                <tr key={pat.id} className={cn('hover:bg-slate-50/70 transition-colors', pat.status === 'Blocked' && 'opacity-70')}>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center font-bold text-blue-500 text-sm flex-shrink-0">
                                                {pat.name[0]}
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-800">{pat.name}</p>
                                                <p className="text-xs text-slate-400">{pat.id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="text-slate-600">{pat.email}</p>
                                        <p className="text-xs text-slate-400">{pat.phone}</p>
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">{pat.city}</td>
                                    <td className="px-4 py-3 text-slate-500 text-xs">{format(new Date(pat.joinedAt), 'dd MMM yyyy')}</td>
                                    <td className="px-4 py-3 text-slate-700 font-semibold">{pat.totalAppointments}</td>
                                    <td className="px-4 py-3">
                                        <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold border', STATUS_STYLES[pat.status])}>
                                            {pat.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() => setConfirmBlock(pat)}
                                            className={cn('h-8 px-3 flex items-center gap-1.5 rounded-lg text-xs font-medium transition',
                                                pat.status === 'Blocked'
                                                    ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white'
                                                    : 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white')}>
                                            {pat.status === 'Blocked' ? <><CheckCircle size={12} /> Unblock</> : <><Ban size={12} /> Block</>}
                                        </button>
                                    </td>
                                    {isSuperAdmin && (
                                        <td className="px-4 py-3">
                                            <button onClick={() => setDeleteTarget(pat)}
                                                className="h-8 w-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all" title="Delete">
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    )}
                                    <td className="px-4 py-3">
                                        {pat.bookingHistory.length > 0 && (
                                            <button onClick={() => setExpandedId(expandedId === pat.id ? null : pat.id)}
                                                className="h-8 px-2 flex items-center gap-1 text-xs text-primary hover:bg-primary/10 rounded-lg transition">
                                                History {expandedId === pat.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                                {/* Booking History Row */}
                                {expandedId === pat.id && (
                                    <tr key={`${pat.id}-history`}>
                                        <td colSpan={8} className="px-6 pb-4 bg-slate-50">
                                            <div className="rounded-xl border border-slate-200 overflow-hidden mt-1">
                                                <table className="w-full text-xs">
                                                    <thead>
                                                        <tr className="bg-slate-100">
                                                            {['Appt ID', 'Doctor', 'Specialization', 'Date', 'Status', 'Fee'].map(h => (
                                                                <th key={h} className="text-left px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase">{h}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 bg-white">
                                                        {pat.bookingHistory.map(b => (
                                                            <tr key={b.id}>
                                                                <td className="px-3 py-2 text-slate-500">{b.id}</td>
                                                                <td className="px-3 py-2 font-medium text-slate-700">{b.doctor}</td>
                                                                <td className="px-3 py-2 text-slate-500">{b.specialization}</td>
                                                                <td className="px-3 py-2 text-slate-500">{b.date}</td>
                                                                <td className="px-3 py-2">
                                                                    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold', APT_STATUS[b.status])}>
                                                                        {b.status}
                                                                    </span>
                                                                </td>
                                                                <td className="px-3 py-2 text-slate-700 font-semibold">₹{b.fee}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </>
                        ))}
                        {paged.length === 0 && (
                            <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400 text-sm">No patients found</td></tr>
                        )}
                    </tbody>
                </table>

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

            {/* ── Add Patient Modal ─────────────────────────────── */}
            <AnimatePresence>
                {showAdd && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                            <div className="flex items-center justify-between p-5 border-b border-slate-100">
                                <h3 className="font-bold text-slate-800 text-lg">Add New Patient</h3>
                                <button onClick={() => { setShowAdd(false); setAddForm(EMPTY_PAT_FORM); }} className="h-8 w-8 rounded-lg text-slate-400 hover:bg-slate-100 flex items-center justify-center transition"><X size={16} /></button>
                            </div>
                            <form onSubmit={handleAddPatient} className="p-5 space-y-4">
                                {[
                                    { key: 'name', label: 'Full Name', placeholder: 'Aditya Kumar', type: 'text' },
                                    { key: 'email', label: 'Email', placeholder: 'patient@gmail.com', type: 'email' },
                                    { key: 'phone', label: 'Phone', placeholder: '9876543210', type: 'tel' },
                                    { key: 'city', label: 'City', placeholder: 'Delhi', type: 'text' },
                                ].map(({ key, label, placeholder, type }) => (
                                    <div key={key}>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
                                        <input required type={type} value={addForm[key]} onChange={e => setAddForm(f => ({ ...f, [key]: e.target.value }))}
                                            placeholder={placeholder}
                                            className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition" />
                                    </div>
                                ))}
                                <div className="flex gap-3 pt-1">
                                    <button type="button" onClick={() => { setShowAdd(false); setAddForm(EMPTY_PAT_FORM); }}
                                        className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">Cancel</button>
                                    <button type="submit"
                                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-primary to-teal-500 text-white text-sm font-semibold hover:opacity-90 transition">Add Patient</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Delete Confirm ──────────────────────────────────── */}
            <AnimatePresence>
                {deleteTarget && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                            <h3 className="font-bold text-slate-800 text-lg mb-1">Delete Patient?</h3>
                            <p className="text-sm text-slate-500 mb-5">{deleteTarget?.name}</p>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition">Cancel</button>
                                <button onClick={handleDeletePatient} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition">Yes, Delete</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Block Confirm Modal */}
            <AnimatePresence>
                {confirmBlock && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                            <h3 className="font-bold text-slate-800 text-lg mb-1">
                                {confirmBlock.status === 'Blocked' ? 'Unblock' : 'Block'} Patient?
                            </h3>
                            <p className="text-sm text-slate-500 mb-5">{confirmBlock.name}</p>
                            <div className="flex gap-3">
                                <button onClick={() => setConfirmBlock(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition">Cancel</button>
                                <button onClick={() => toggleBlock(confirmBlock.id)}
                                    className={cn('flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition',
                                        confirmBlock.status === 'Blocked' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600')}>
                                    {confirmBlock.status === 'Blocked' ? 'Yes, Unblock' : 'Yes, Block'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                        className={cn('fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium',
                            toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white')}>
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
