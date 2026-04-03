import { useState, useEffect } from 'react';
import { useDoctor } from '../context/DoctorContext.jsx';
import { supabase } from '@/lib/supabase.js';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar, Users, TrendingUp, Clock, FileText, CheckCircle,
    MoreVertical, Video, MapPin, ChevronRight, Star, AlertCircle
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';
import Patient360Drawer from '../components/Patient360Drawer.jsx';



const REVENUE_DATA = [
    { name: 'Mon', total: 4000 }, { name: 'Tue', total: 3000 },
    { name: 'Wed', total: 5500 }, { name: 'Thu', total: 4500 },
    { name: 'Fri', total: 6000 }, { name: 'Sat', total: 7500 },
    { name: 'Sun', total: 4200 },
];

const REVIEWS = [
    { id: 1, author: 'P. Singh', rating: 5, text: 'Very patient and explained everything clearly.', time: '2 hours ago' },
    { id: 2, author: 'R. Kumar', rating: 5, text: 'Excellent diagnosis and friendly staff.', time: '4 hours ago' },
    { id: 3, author: 'A. Rao', rating: 5, text: 'The teleconsultation was smooth and very helpful.', time: '1 day ago' },
];

const STATUS_CONFIG = {
    'In-Progress': { color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', dot: 'bg-indigo-500 animate-pulse' },
    'Checked-in': { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' },
    'Upcoming': { color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', dot: 'bg-slate-400' },
};

export default function DoctorDashboard() {
    const { doctor, doctorRecord } = useDoctor();
    const [selectedApt, setSelectedApt] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!doctorRecord?.id) {
            setAppointments([]);
            setLoading(false);
            return;
        }

        const fetchApts = async () => {
            try {
                const { data } = await supabase
                    .from('appointments')
                    .select('*')
                    .eq('doctor_id', doctorRecord.id)
                    .order('date', { ascending: true })
                    .order('time_slot', { ascending: true });
                setAppointments(data || []);
            } catch (err) {
                console.error('Failed to load doctor appointments');
            } finally {
                setLoading(false);
            }
        };
        fetchApts();
    }, [doctorRecord?.id]);

    // Stats calculations
    const completedCount = appointments.filter(a => a.status === 'Completed').length;
    const totalToday = appointments.length;
    const progressPercent = totalToday === 0 ? 0 : Math.round((completedCount / totalToday) * 100);

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-8">
            {/* Pending approval banner */}
            {doctorRecord?.status === 'Pending' && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-4 rounded-3xl bg-amber-50 border border-amber-200 shadow-sm">
                    <AlertCircle size={20} className="text-amber-500 flex-shrink-0" />
                    <div>
                        <p className="font-bold text-amber-800 text-sm tracking-tight">Account pending approval</p>
                        <p className="text-xs text-amber-700/80 mt-0.5 font-medium">The admin team will review your profile shortly.</p>
                    </div>
                </motion.div>
            )}

            {/* Top Row: Quick Stats & Progress */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Schedule Progress */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Clock size={16} className="text-teal-500" />
                            <h3 className="font-bold text-slate-800 text-sm tracking-tight">Today's Schedule</h3>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">{completedCount} of {totalToday} patients seen</p>
                    </div>
                    <div className="mt-6">
                        <div className="flex justify-between text-xs font-bold mb-2">
                            <span className="text-slate-700">Progress</span>
                            <span className="text-teal-600">{progressPercent}%</span>
                        </div>
                        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercent}%` }}
                                transition={{ duration: 1, delay: 0.2 }}
                                className="h-full bg-gradient-to-r from-teal-400 to-teal-500 rounded-full"
                            />
                        </div>
                    </div>
                </div>

                {/* Earnings Tracker */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <TrendingUp size={16} className="text-blue-500" />
                                <h3 className="font-bold text-slate-800 text-sm tracking-tight">Earnings Tracker</h3>
                            </div>
                            <p className="text-2xl font-black text-slate-800 tracking-tight mt-2">
                                ₹{(doctor.totalRevenue || 45200).toLocaleString()}
                            </p>
                            <p className="text-xs text-emerald-500 font-bold mt-1 bg-emerald-50 inline-block px-2 py-0.5 rounded-md">+14% vs last week</p>
                        </div>
                    </div>
                    <div className="h-16 w-full mt-4 -ml-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={REVENUE_DATA}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Tooltip cursor={false} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }} />
                                <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Patient Feedback */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-6 border border-indigo-100/50 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div>
                            <h3 className="font-bold text-indigo-900 text-sm tracking-tight">Latest Feedback</h3>
                            <div className="flex items-center gap-1 mt-1">
                                {[1, 2, 3, 4, 5].map(i => <Star key={i} size={12} className="fill-amber-400 text-amber-400" />)}
                                <span className="text-xs font-bold text-indigo-800 ml-1">4.9/5</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-hidden relative z-10">
                        <div className="space-y-3">
                            {REVIEWS.slice(0, 2).map(r => (
                                <div key={r.id} className="bg-white/60 backdrop-blur-sm rounded-2xl p-3 border border-white">
                                    <p className="text-xs text-indigo-900/80 font-medium italic line-clamp-2">"{r.text}"</p>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-[10px] font-bold text-indigo-900">{r.author}</span>
                                        <span className="text-[10px] font-semibold text-indigo-400">{r.time}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left: Interactive Timeline (Takes 2 columns) */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col">
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-10">
                        <div>
                            <h2 className="font-bold text-slate-800 tracking-tight">Appointment Timeline</h2>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">Drag to reschedule or click for details</p>
                        </div>
                        <button className="text-xs font-bold text-teal-600 bg-teal-50 px-3 py-1.5 rounded-lg hover:bg-teal-100 transition-colors">
                            Block Time
                        </button>
                    </div>

                    <div className="p-6">
                        <div className="relative border-l-2 border-slate-100 ml-3 space-y-6 min-h-[300px]">
                            {loading ? (
                                <p className="text-sm text-slate-500 py-10 text-center">Loading appointments...</p>
                            ) : appointments.length === 0 ? (
                                <p className="text-sm text-slate-500 py-10 text-center">No appointments found.</p>
                            ) : appointments.map((apt, i) => {
                                const cfg = STATUS_CONFIG[apt.status] || STATUS_CONFIG['Upcoming'];
                                return (
                                    <motion.div
                                        key={apt.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="relative pl-6 sm:pl-8 group"
                                    >
                                        {/* Timeline Dot */}
                                        <div className="absolute left-[-5px] top-6 w-2.5 h-2.5 rounded-full ring-4 ring-white bg-slate-300">
                                            <div className={cn("absolute inset-0 rounded-full", cfg.dot)} />
                                        </div>

                                        {/* Time Label */}
                                        <div className="absolute left-[-60px] top-5 w-12 text-right hidden sm:block">
                                            <span className="text-xs font-bold text-slate-500">{apt.time_slot ? apt.time_slot.split(' ')[0] : '10:00'}</span>
                                            <span className="text-[10px] font-semibold text-slate-400 block">{apt.time_slot ? apt.time_slot.split(' ')[1] : 'AM'}</span>
                                        </div>

                                        {/* Appointment Card */}
                                        <button
                                            onClick={() => setSelectedApt(apt)}
                                            className="w-full text-left bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-slate-200 transition-all group-hover:-translate-y-0.5"
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                                                <div className="flex items-center gap-3">
                                                    <span className={cn('px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide uppercase', cfg.bg, cfg.color)}>
                                                        {apt.status === 'Scheduled' ? 'Upcoming' : apt.status}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">
                                                        {apt.type || apt.consultation_type === 'Online' ? <Video size={10} className="text-blue-500" /> : <MapPin size={10} className="text-emerald-500" />}
                                                        {apt.type || apt.consultation_type || 'Online'}
                                                    </span>
                                                    <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg hidden sm:inline-flex">
                                                        <Clock size={10} /> {apt.duration}
                                                    </span>
                                                </div>
                                                <div className="sm:hidden text-xs font-bold text-slate-500">
                                                    {apt.time_slot || apt.time || '10:00 AM'}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-bold text-slate-800 text-base tracking-tight">{apt.patientName || apt.patient_name || apt.patient}</h4>
                                                    <p className="text-xs font-medium text-slate-500 mt-1">{apt.issue || 'Consultation'}</p>
                                                </div>
                                                <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors shrink-0">
                                                    <ChevronRight size={16} />
                                                </div>
                                            </div>
                                        </button>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right: Quick Actions & Prescription Tool */}
                <div className="space-y-6">
                    {/* Digital Prescription Tool Launch */}
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-slate-900/10 relative overflow-hidden group hover:shadow-2xl hover:shadow-teal-900/20 transition-all cursor-pointer">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-teal-500/20 rounded-full blur-2xl group-hover:bg-teal-500/30 transition-colors" />
                        <FileText size={24} className="text-teal-400 mb-4" />
                        <h3 className="font-bold text-lg tracking-tight mb-1">Quick Prescription</h3>
                        <p className="text-sm text-slate-400 font-medium mb-6">Write and send digital Rx securely to your patients instantly.</p>
                        <button className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl text-sm font-bold backdrop-blur-md transition-colors flex items-center justify-center gap-2">
                            Create New Rx <ChevronRight size={14} />
                        </button>
                    </div>

                    {/* Patient Queue Summary */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] p-6">
                        <h3 className="font-bold text-slate-800 tracking-tight flex items-center gap-2 mb-4">
                            <Users size={16} className="text-slate-400" /> Walk-in Queue
                        </h3>
                        <div className="space-y-4">
                            {[1, 2].map((i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-xs">
                                        #{i}
                                    </div>
                                    <div className="flex-1">
                                        <div className="h-3 w-24 bg-slate-100 rounded-full mb-1.5" />
                                        <div className="h-2 w-16 bg-slate-50 rounded-full" />
                                    </div>
                                </div>
                            ))}
                            <button className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-2xl text-xs font-bold text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-colors">
                                + Add Walk-in Patient
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Patient 360 Drawer */}
            <Patient360Drawer
                isOpen={!!selectedApt}
                onClose={() => setSelectedApt(null)}
                appointment={selectedApt}
            />
        </div>
    );
}
