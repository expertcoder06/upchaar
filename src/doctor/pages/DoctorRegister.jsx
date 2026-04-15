import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDoctor } from '../context/DoctorContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase.js';
import { Stethoscope, Eye, EyeOff, Loader2, AlertCircle, Phone, Lock, User, MapPin, ChevronDown, Building2, Clock3, ShieldCheck, CheckCircle2, RefreshCw } from 'lucide-react';
import { isStrongPassword, PASSWORD_RULE_MESSAGE } from '@/lib/auth.js';
import { sendOtp, verifyOtp } from '@/lib/otpService.js';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30;

const SPECIALIZATIONS = [
    'General Physician', 'Cardiologist', 'Dermatologist', 'Endocrinologist',
    'Gastroenterologist', 'Gynaecologist', 'Nephrologist', 'Neurologist',
    'Oncologist', 'Ophthalmologist', 'Orthopaedic', 'Paediatrician',
    'Psychiatrist', 'Pulmonologist', 'Radiologist', 'Urologist',
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const EMPTY = {
    fullName: '',
    email: '',
    phone: '',
    whatsappNumber: '',
    password: '',
    confirmPassword: '',
    specialization: '',
    city: '',
    clinicName: '',
    fee: '500',
    medicalLicense: '',
    nmcRegistration: '',
    dob: '',
    hoursFrom: '09:00',
    hoursTo: '20:00',
    availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
};

const MIN_AGE = 18;

export default function DoctorRegister() {
    const { register } = useDoctor();
    const navigate = useNavigate();
    const [form, setForm] = useState(EMPTY);
    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // ── OTP step ───────────────────
    const [step, setStep]             = useState('form'); // 'form' | 'otp'
    const [otp, setOtp]               = useState(['','','','','','']);
    const [otpPhone, setOtpPhone]     = useState('');
    const [otpError, setOtpError]     = useState('');
    const [otpLoading, setOtpLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const otpRefs = useRef([]);

    useEffect(() => {
        if (resendCooldown <= 0) return;
        const id = setTimeout(() => setResendCooldown(s => s - 1), 1000);
        return () => clearTimeout(id);
    }, [resendCooldown]);

    const handleOtpChange = (idx, val) => {
        if (!/^\d?$/.test(val)) return;
        const next = [...otp]; next[idx] = val; setOtp(next);
        if (val && idx < OTP_LENGTH - 1) otpRefs.current[idx + 1]?.focus();
    };
    const handleOtpKeyDown = (idx, e) => {
        if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
    };
    const handleOtpPaste = e => {
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
        if (pasted.length === OTP_LENGTH) { setOtp(pasted.split('')); otpRefs.current[OTP_LENGTH - 1]?.focus(); }
        e.preventDefault();
    };

    const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const toggleDay = (day) => setForm(f => ({
        ...f,
        availableDays: f.availableDays.includes(day)
            ? f.availableDays.filter(d => d !== day)
            : [...f.availableDays, day],
    }));

    const validate = () => {
        if (!form.fullName.trim()) return 'Full name is required.';
        if (!form.phone.trim() || !/^\d{10}$/.test(form.phone.trim())) return 'Enter a valid 10-digit phone number.';
        if (form.whatsappNumber.trim() && !/^\d{10}$/.test(form.whatsappNumber.trim())) return 'Enter a valid 10-digit WhatsApp number.';
        if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) return 'Enter a valid email address.';
        if (!form.dob) return 'Date of Birth is required.';

        const birthDate = new Date(form.dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
        if (age < MIN_AGE) return `You must be at least ${MIN_AGE} years old to register.`;

        if (!form.medicalLicense.trim()) return 'Medical License Number is required.';
        if (!form.nmcRegistration.trim()) return 'NMC/MCI Registration Number is required.';
        if (!form.clinicName.trim()) return 'Clinic or medical name is required.';
        if (!form.availableDays.length) return 'Select at least one available day.';
        if (!form.hoursFrom || !form.hoursTo) return 'Consultation start and end time are required.';
        if (form.hoursFrom >= form.hoursTo) return 'End time must be later than start time.';
        if (!Number(form.fee) || Number(form.fee) < 1) return 'Enter a valid consultation fee.';
        if (form.password.length < 6) return 'Password must be at least 6 characters.';
        if (!isStrongPassword(form.password)) return PASSWORD_RULE_MESSAGE;
        if (form.password !== form.confirmPassword) return 'Passwords do not match.';

        return null;
    };

    // Step 1: validate + uniqueness + send OTP
    const handleSubmit = async (e) => {
        e.preventDefault();
        const err = validate();
        if (err) { setError(err); return; }
        setError('');
        setLoading(true);
        try {
            // Uniqueness checks via RPC (bypasses RLS for anon users)
            const { data: phoneTaken } = await supabase.rpc('is_phone_taken', { p_phone: form.phone.trim() });
            if (phoneTaken) throw new Error('This phone number is already registered.');

            if (form.whatsappNumber.trim()) {
                const { data: waTaken } = await supabase.rpc('is_whatsapp_taken', { p_wa: form.whatsappNumber.trim() });
                if (waTaken) throw new Error('This WhatsApp number is already registered.');
            }

            const { data: licenseCheck } = await supabase.from('doctors').select('profile_id').eq('medical_license', form.medicalLicense.trim()).maybeSingle();
            if (licenseCheck) throw new Error('Medical License Number is already registered.');

            const { data: registrationCheck } = await supabase.from('doctors').select('profile_id').eq('nmc_registration', form.nmcRegistration.trim()).maybeSingle();
            if (registrationCheck) throw new Error('NMC/MCI Registration Number is already registered.');

            // Bypass OTP
            // const e164 = await sendOtp(form.phone);
            // setOtpPhone(e164);
            // setOtp(['','','','','','']);
            // setOtpError('');
            // setResendCooldown(RESEND_COOLDOWN);
            // setStep('otp');

            await register({
                fullName: form.fullName, email: form.email, phone: form.phone,
                whatsappNumber: form.whatsappNumber, password: form.password,
                specialization: form.specialization, city: form.city,
                clinicName: form.clinicName, fee: Number(form.fee),
                medicalLicense: form.medicalLicense, nmcRegistration: form.nmcRegistration,
                dob: form.dob, availableDays: form.availableDays,
                hoursFrom: form.hoursFrom, hoursTo: form.hoursTo,
            });
            navigate('/doctor/dashboard', { replace: true });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Resend
    const handleResend = async () => {
        if (resendCooldown > 0) return;
        setOtpError(''); setOtpLoading(true);
        try { await sendOtp(form.phone); setOtp(['','','','','','']); setResendCooldown(RESEND_COOLDOWN); }
        catch (err) { setOtpError(err.message); }
        finally { setOtpLoading(false); }
    };

    // Step 2: Verify OTP & create account
    const handleVerifyAndRegister = async (e) => {
        e.preventDefault();
        const token = otp.join('');
        if (token.length < OTP_LENGTH) { setOtpError('Please enter the complete 6-digit code.'); return; }
        setOtpLoading(true); setOtpError('');
        try {
            await verifyOtp(otpPhone, token);
            await supabase.auth.signOut(); // clear temp OTP session
            await register({
                fullName: form.fullName, email: form.email, phone: form.phone,
                whatsappNumber: form.whatsappNumber, password: form.password,
                specialization: form.specialization, city: form.city,
                clinicName: form.clinicName, fee: Number(form.fee),
                medicalLicense: form.medicalLicense, nmcRegistration: form.nmcRegistration,
                dob: form.dob, availableDays: form.availableDays,
                hoursFrom: form.hoursFrom, hoursTo: form.hoursTo,
            });
            navigate('/doctor/dashboard', { replace: true });
        } catch (err) {
            setOtpError(err.message);
        } finally {
            setOtpLoading(false);
        }
    };

    const fields = [
        { name: 'fullName', label: 'Full Name', placeholder: 'Dr. Priya Sharma', type: 'text', icon: User, required: true },
        { name: 'dob', label: 'Date of Birth', placeholder: '', type: 'date', icon: null, required: true },
        { name: 'phone', label: 'Phone Number', placeholder: '9876543210', type: 'tel', icon: Phone, required: true },
        { name: 'whatsappNumber', label: 'WhatsApp (Optional)', placeholder: '9876543210', type: 'tel', icon: Phone, required: false },
        { name: 'medicalLicense', label: 'Medical License Number', placeholder: 'REG-123456', type: 'text', icon: null, required: true },
        { name: 'nmcRegistration', label: 'NMC / MCI Registration Number', placeholder: 'NMC/123/2024', type: 'text', icon: null, required: true },
        { name: 'email', label: 'Email Address', placeholder: 'doctor@clinic.com', type: 'email', icon: null, required: true },
        { name: 'city', label: 'City', placeholder: 'Delhi, Mumbai, Bangalore', type: 'text', icon: MapPin, required: false },
        { name: 'clinicName', label: 'Clinic / Medical Name', placeholder: 'City Heart Clinic', type: 'text', icon: Building2, required: true },
        { name: 'fee', label: 'Consultation Fee (Rs.)', placeholder: '500', type: 'number', icon: null, required: true },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-indigo-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative w-full max-w-2xl"
            >
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-teal-900/10 border border-white/60 overflow-hidden">
                    <div className="bg-gradient-to-r from-primary to-teal-400 px-8 pt-10 pb-8">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                                <Stethoscope size={24} className="text-white" />
                            </div>
                            <div>
                                <p className="text-white/70 text-xs font-medium uppercase tracking-widest">Upchaar Health</p>
                                <h1 className="text-white font-bold text-xl">
                                    {step === 'otp' ? 'Verify Mobile Number' : 'Create Doctor Account'}
                                </h1>
                            </div>
                        </div>
                        <p className="text-white/80 text-sm">
                            {step === 'otp'
                                ? `6-digit code sent to ${form.phone}`
                                : 'Register your clinic timings and consultation details for the dashboard.'}
                        </p>
                    </div>

                    <div className="px-8 py-8">
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm"
                                >
                                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                                    <span>{error}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {step === 'form' && (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {fields.map(({ name, label, placeholder, type, icon: Icon, required }) => (
                                    <div key={name} className={name === 'clinicName' ? 'md:col-span-2' : ''}>
                                        <label className="block text-xs font-semibold text-slate-600 mb-2">
                                            {label} {required && <span className="text-red-400">*</span>}
                                        </label>
                                        <div className="relative">
                                            {Icon && <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />}
                                            <input
                                                name={name} type={type} required={required}
                                                value={form[name]} onChange={handleChange} placeholder={placeholder}
                                                className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition placeholder:text-slate-400`}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-2">Specialization</label>
                                <div className="relative">
                                    <select name="specialization" value={form.specialization} onChange={handleChange}
                                        className="w-full appearance-none pl-4 pr-9 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition text-slate-700">
                                        <option value="">Select specialization...</option>
                                        {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Clock3 size={16} className="text-teal-600" />
                                    <h2 className="text-sm font-semibold text-slate-700">Clinic Timing</h2>
                                </div>
                                <label className="block text-xs font-semibold text-slate-600 mb-2">Available Days</label>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {DAYS.map(day => (
                                        <button type="button" key={day} onClick={() => toggleDay(day)}
                                            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                                                form.availableDays.includes(day)
                                                    ? 'bg-primary text-white border-primary'
                                                    : 'bg-white text-slate-500 border-slate-200 hover:border-primary/40'
                                            }`}>{day}</button>
                                    ))}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-2">Start Time</label>
                                        <input type="time" name="hoursFrom" value={form.hoursFrom} onChange={handleChange}
                                            className="w-full pl-4 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/25" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-2">End Time</label>
                                        <input type="time" name="hoursTo" value={form.hoursTo} onChange={handleChange}
                                            className="w-full pl-4 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/25" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-2">Password <span className="text-red-400">*</span></label>
                                    <div className="relative">
                                        <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input name="password" type={showPass ? 'text' : 'password'} required
                                            value={form.password} onChange={handleChange} placeholder="Min 6 characters"
                                            className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition placeholder:text-slate-400" />
                                        <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                                            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-2">Confirm Password <span className="text-red-400">*</span></label>
                                    <div className="relative">
                                        <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input name="confirmPassword" type={showConfirm ? 'text' : 'password'} required
                                            value={form.confirmPassword} onChange={handleChange} placeholder="Re-enter password"
                                            className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition placeholder:text-slate-400" />
                                        <button type="button" onClick={() => setShowConfirm(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                                            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button type="submit" disabled={loading}
                                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-teal-400 text-white font-semibold text-sm hover:shadow-lg hover:shadow-primary/25 hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2">
                                {loading ? <><Loader2 size={16} className="animate-spin" />Registering…</> : <><ShieldCheck size={16} />Create Account</>}
                            </button>
                        </form>
                        )}

                        {/* OTP Step */}
                        {step === 'otp' && (
                        <form onSubmit={handleVerifyAndRegister} className="space-y-6">
                            <div className="flex flex-col items-center text-center gap-2 py-2">
                                <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center mb-1">
                                    <ShieldCheck size={28} className="text-teal-500" />
                                </div>
                                <p className="text-sm text-slate-600">Enter the <span className="font-semibold text-slate-800">6-digit code</span> sent to</p>
                                <p className="text-base font-bold text-teal-700 tracking-wide">{form.phone}</p>
                            </div>

                            <div className="flex gap-2.5 justify-center" onPaste={handleOtpPaste}>
                                {otp.map((digit, idx) => (
                                    <input key={idx} ref={el => otpRefs.current[idx] = el}
                                        type="text" inputMode="numeric" maxLength={1} value={digit}
                                        onChange={e => handleOtpChange(idx, e.target.value)}
                                        onKeyDown={e => handleOtpKeyDown(idx, e)}
                                        autoFocus={idx === 0} style={{ height: '52px' }}
                                        className={`w-11 text-center text-xl font-bold rounded-xl border-2 transition-all outline-none
                                            ${digit ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 bg-slate-50 text-slate-800'}
                                            focus:border-teal-400 focus:ring-2 focus:ring-teal-400/25`}
                                    />
                                ))}
                            </div>

                            <AnimatePresence>
                                {otpError && (
                                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                        className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">
                                        <AlertCircle size={15} className="flex-shrink-0" />{otpError}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <button type="submit" disabled={otpLoading || otp.join('').length < OTP_LENGTH}
                                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-teal-400 text-white font-semibold text-sm hover:shadow-lg hover:shadow-primary/25 hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                                {otpLoading ? <><Loader2 size={16} className="animate-spin" />Verifying…</> : <><CheckCircle2 size={16} />Verify & Create Account</>}
                            </button>

                            <div className="flex items-center justify-between text-sm">
                                <button type="button" onClick={() => { setStep('form'); setError(''); setOtpError(''); }}
                                    className="text-slate-500 hover:text-slate-700 transition">← Edit details</button>
                                <button type="button" onClick={handleResend}
                                    disabled={resendCooldown > 0 || otpLoading}
                                    className="flex items-center gap-1.5 text-teal-600 hover:text-teal-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition">
                                    <RefreshCw size={13} />
                                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                                </button>
                            </div>
                        </form>
                        )}

                        <p className="mt-6 text-center text-sm text-slate-500">
                            Already have an account?{' '}
                            <Link to="/doctor/login" className="text-primary font-semibold hover:underline">Sign in</Link>
                        </p>
                    </div>
                </div>
                <p className="mt-4 text-center text-xs text-slate-400">
                    <Link to="/" className="hover:text-slate-600 transition">Back to Upchaar Health</Link>
                </p>
            </motion.div>
        </div>
    );
}
