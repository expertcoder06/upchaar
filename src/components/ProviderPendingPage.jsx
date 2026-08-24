import { motion } from 'framer-motion';
import {
    Clock, LogOut, XCircle, RefreshCw, Building2,
    MapPin, Phone, Mail, MessageCircle, Hash, User,
    CheckCircle2, ShieldAlert, Sparkles, Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '@/auth/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase.js';

// Maps profile_type to the correct provider table and dashboard route
const PROVIDER_CONFIG = {
    clinic:     { table: 'clinics',            dashboard: '/clinic/dashboard' },
    medical:    { table: 'medicals',           dashboard: '/medical/dashboard' },
    diagnostic: { table: 'diagnostic_centers', dashboard: '/diagnostic/dashboard' },
    hospital:   { table: 'hospitals',          dashboard: '/hospital/dashboard' },
};

export default function ProviderPendingPage({ profile }) {
    const { signOut } = useAuth();
    const navigate = useNavigate();

    // The user's status might be 'pending' or 'Rejected' (or 'suspended')
    const status = profile?.status?.toLowerCase() || 'pending';
    const isRejected = status === 'rejected' || status === 'suspended';
    const rejectReason = profile?.metadata?.rejectionReason || "Please contact support for more information.";

    const centerName = profile?.center_name || profile?.centerName || profile?.clinic_name || profile?.full_name || 'Center';
    const contactName = profile?.full_name || profile?.name || '';
    const email = profile?.email || '';
    const phone = profile?.phone || '';
    const whatsapp = profile?.whatsapp || profile?.whatsapp_number || '';
    const city = profile?.city || '';
    const state = profile?.state || '';
    const pincode = profile?.pincode || '';
    const photoUrl = profile?.avatar_url || profile?.image_url || null;
    const profileType = (profile?.profile_type || profile?.type || '').toLowerCase();

    const [checking, setChecking] = useState(false);
    const pollingRef = useRef(null);
    const channelRef = useRef(null);

    const formatType = (type) => {
        switch (type?.toLowerCase()) {
            case 'clinic': return 'Clinic';
            case 'medical': return 'Medical Store';
            case 'diagnostic': return 'Diagnostic Centre';
            case 'hospital': return 'Hospital';
            default: return 'Healthcare Provider';
        }
    };

    const getDashboardRoute = (type) => {
        return PROVIDER_CONFIG[type?.toLowerCase()]?.dashboard || null;
    };

    const getProviderTable = (type) => {
        return PROVIDER_CONFIG[type?.toLowerCase()]?.table || null;
    };

    /**
     * Check if the facility has been approved in its provider table or profiles table.
     * Redirects automatically if approved.
     */
    const checkApprovalStatus = async () => {
        if (!profile?.id || isRejected) return;

        const dashboardRoute = getDashboardRoute(profileType);
        const table = getProviderTable(profileType);

        if (!dashboardRoute) return;

        try {
            let approved = false;

            // Check provider-specific table first
            if (table) {
                const { data: rec } = await supabase
                    .from(table)
                    .select('status')
                    .eq('profile_id', profile.id)
                    .maybeSingle();

                if (rec) {
                    const s = (rec.status || '').toLowerCase();
                    approved = s === 'approved' || s === 'active';
                }
            }

            // Fallback: check profiles table
            if (!approved) {
                const { data: prof } = await supabase
                    .from('profiles')
                    .select('status')
                    .eq('id', profile.id)
                    .maybeSingle();

                if (prof) {
                    const s = (prof.status || '').toLowerCase();
                    approved = s === 'approved' || s === 'active';
                }
            }

            if (approved) {
                // Cleanup polling before navigating
                clearInterval(pollingRef.current);
                if (channelRef.current) {
                    supabase.removeChannel(channelRef.current);
                }
                navigate(dashboardRoute, { replace: true });
            }
        } catch {
            // Silently ignore errors; next poll will retry
        }
    };

    // Manual "Check Again" button handler
    const handleCheckAgain = async () => {
        setChecking(true);
        await checkApprovalStatus();
        setChecking(false);
    };

    // Set up polling (every 30s) + real-time subscription on mount
    useEffect(() => {
        if (isRejected || !profile?.id) return;

        const table = getProviderTable(profileType);
        const dashboardRoute = getDashboardRoute(profileType);
        if (!dashboardRoute) return;

        // Initial check on mount
        checkApprovalStatus();

        // Poll every 30 seconds
        pollingRef.current = setInterval(checkApprovalStatus, 30_000);

        // Real-time subscription on provider table if available
        if (table) {
            const channel = supabase
                .channel(`provider_status_${profile.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: table,
                        filter: `profile_id=eq.${profile.id}`,
                    },
                    (payload) => {
                        const newStatus = (payload.new?.status || '').toLowerCase();
                        if (newStatus === 'approved' || newStatus === 'active') {
                            clearInterval(pollingRef.current);
                            supabase.removeChannel(channel);
                            navigate(dashboardRoute, { replace: true });
                        }
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'profiles',
                        filter: `id=eq.${profile.id}`,
                    },
                    (payload) => {
                        const newStatus = (payload.new?.status || '').toLowerCase();
                        if (newStatus === 'active' || newStatus === 'approved') {
                            clearInterval(pollingRef.current);
                            supabase.removeChannel(channel);
                            navigate(dashboardRoute, { replace: true });
                        }
                    }
                )
                .subscribe();

            channelRef.current = channel;
        }

        return () => {
            clearInterval(pollingRef.current);
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profile?.id, profileType, isRejected]);

    const handleTryAgain = async () => {
        await signOut();
        navigate('/register');
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50/70 via-white to-emerald-50/70 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative selection:bg-teal-500 selection:text-white">
            {/* Ambient background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-300/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-100/30 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-10 w-full max-w-2xl bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-teal-900/10 border border-white/80 p-6 sm:p-10 text-center"
            >
                {/* Header Logo */}
                <div className="flex justify-center mb-6">
                    <div className="relative">
                        <div className={`absolute inset-0 rounded-2xl blur-xl animate-pulse ${isRejected ? 'bg-rose-400/30' : 'bg-teal-400/30'}`} />
                        <div className={`relative h-16 w-16 sm:h-20 sm:w-20 rounded-2xl flex items-center justify-center shadow-xl ${
                            isRejected
                                ? 'bg-gradient-to-br from-rose-500 to-red-600 shadow-rose-500/25 text-white'
                                : 'bg-gradient-to-br from-teal-500 to-emerald-500 shadow-teal-500/25 text-white'
                        }`}>
                            {isRejected ? <ShieldAlert size={34} /> : <Building2 size={34} />}
                        </div>
                    </div>
                </div>

                {/* Brand & Badge */}
                <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-xs font-bold tracking-[0.2em] uppercase text-teal-600">
                        Upchar Health
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {formatType(profileType)}
                    </span>
                </div>

                {/* Main Heading */}
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight leading-snug mb-3">
                    {isRejected ? 'Registration Status: Rejected' : 'Verification in Progress'}
                </h1>

                {/* Status Notice Block */}
                {isRejected ? (
                    <div className="bg-rose-50/80 border border-rose-100 rounded-2xl p-5 sm:p-6 mb-6 text-left shadow-sm">
                        <div className="flex items-center gap-2 text-rose-700 font-bold text-sm mb-2">
                            <XCircle size={18} className="text-rose-600 shrink-0" />
                            <span>Application Rejected</span>
                        </div>
                        <p className="text-slate-700 text-sm leading-relaxed mb-3">
                            Unfortunately, your facility registration could not be approved at this time.
                        </p>
                        <div className="p-3.5 bg-white/90 rounded-xl border border-rose-100">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600 mb-1">Reason provided by Admin:</p>
                            <p className="text-sm text-slate-700 italic font-medium">&quot;{rejectReason}&quot;</p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-gradient-to-br from-teal-50/90 to-emerald-50/90 border border-teal-100 rounded-2xl p-5 sm:p-6 mb-6 text-left shadow-sm">
                        <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 text-teal-800 font-bold text-sm">
                                <Clock size={16} className="text-teal-600 animate-spin shrink-0" />
                                <span>Under Admin Review</span>
                            </div>
                            <span className="text-[11px] font-semibold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-200">
                                Step 2 of 3
                            </span>
                        </div>
                        <p className="text-slate-700 text-sm leading-relaxed">
                            Your details have been submitted to our administration team for verification. All services, tests, and bookings will be unlocked once approved.
                        </p>
                        <p className="text-xs text-slate-500 mt-2.5">
                            ⏱️ Review time is typically <span className="font-semibold text-teal-700">within 24–48 hours</span>. We may contact you on your registered phone if further documents are required.
                        </p>
                        <p className="text-[11px] text-teal-600 mt-2 font-medium">
                            🔄 This page checks automatically every 30 seconds and will redirect you once approved.
                        </p>
                    </div>
                )}

                {/* Submitted Registration Details Card */}
                <div className="border border-slate-150 bg-slate-50/60 rounded-2xl p-5 mb-6 text-left">
                    <div className="flex items-center justify-between mb-4 border-b border-slate-200/60 pb-3">
                        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles size={14} className="text-teal-500" />
                            Submitted Registration Details
                        </h2>
                        <span className="text-[11px] font-medium text-slate-400">Read-Only</span>
                    </div>

                    <div className="space-y-4">
                        {/* Center Name & Photo Banner */}
                        <div className="flex items-center gap-4 p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                            {photoUrl ? (
                                <img
                                    src={photoUrl}
                                    alt={centerName}
                                    className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl object-cover border border-slate-200 shrink-0"
                                    onError={e => { e.target.style.display = 'none'; }}
                                />
                            ) : (
                                <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl bg-teal-100/70 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
                                    <Building2 size={24} />
                                </div>
                            )}
                            <div className="min-w-0 flex-1">
                                <h3 className="font-bold text-slate-800 text-base sm:text-lg truncate">{centerName}</h3>
                                {contactName && (
                                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                        <User size={12} className="text-slate-400" />
                                        Contact: {contactName}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Grid details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                            {email && (
                                <div className="bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-2.5">
                                    <Mail size={14} className="text-slate-400 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-[10px] text-slate-400 font-semibold uppercase">Email</p>
                                        <p className="font-medium text-slate-700 truncate">{email}</p>
                                    </div>
                                </div>
                            )}
                            {phone && (
                                <div className="bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-2.5">
                                    <Phone size={14} className="text-slate-400 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-[10px] text-slate-400 font-semibold uppercase">Phone</p>
                                        <p className="font-medium text-slate-700 truncate">{phone}</p>
                                    </div>
                                </div>
                            )}
                            {whatsapp && (
                                <div className="bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-2.5">
                                    <MessageCircle size={14} className="text-teal-500 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-[10px] text-slate-400 font-semibold uppercase">WhatsApp</p>
                                        <p className="font-medium text-slate-700 truncate">{whatsapp}</p>
                                    </div>
                                </div>
                            )}
                            {(city || state || pincode) && (
                                <div className="bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-2.5">
                                    <MapPin size={14} className="text-slate-400 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-[10px] text-slate-400 font-semibold uppercase">Location</p>
                                        <p className="font-medium text-slate-700 truncate">
                                            {[city, state, pincode].filter(Boolean).join(', ')}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    {isRejected ? (
                        <button
                            onClick={handleTryAgain}
                            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 text-white font-semibold shadow-md shadow-rose-500/20 hover:shadow-lg hover:from-rose-600 hover:to-red-700 transition-all text-sm cursor-pointer"
                        >
                            <RefreshCw size={16} />
                            Register Again
                        </button>
                    ) : (
                        <button
                            onClick={handleCheckAgain}
                            disabled={checking}
                            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold transition-all text-sm cursor-pointer shadow-md shadow-teal-500/20"
                        >
                            <RefreshCw size={15} className={checking ? 'animate-spin' : ''} />
                            {checking ? 'Checking…' : 'Check Approval Now'}
                        </button>
                    )}

                    <button
                        onClick={handleLogout}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-6 rounded-xl border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-600 hover:text-rose-600 font-medium transition-all text-sm cursor-pointer"
                    >
                        <LogOut size={15} />
                        Sign Out
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
