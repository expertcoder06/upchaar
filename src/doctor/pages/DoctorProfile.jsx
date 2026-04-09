import { useState } from 'react';
import { useDoctor } from '../context/DoctorContext.jsx';
import { Save, Loader2, CheckCircle, User, Stethoscope, Clock, Building2, Copy, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

const SPECIALIZATIONS = [
    'General Physician', 'Cardiologist', 'Dermatologist', 'Endocrinologist',
    'Gastroenterologist', 'Gynaecologist', 'Neurologist', 'Oncologist',
    'Ophthalmologist', 'Orthopaedic', 'Paediatrician', 'Psychiatrist',
    'Pulmonologist', 'Urologist',
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const AVATAR_COLORS = ['#0d9488', '#6366f1', '#f59e0b', '#ec4899', '#3b82f6', '#10b981', '#ef4444'];

export default function DoctorProfile() {
    const { doctor, updateProfile, rotateSecretKey } = useDoctor();
    const [form, setForm] = useState({
        fullName: doctor.fullName || '',
        phone: doctor.phone || '',
        email: doctor.email || '',
        city: doctor.city || '',
        specialization: doctor.specialization || '',
        experience: doctor.experience || '',
        fee: doctor.fee || '',
        degree: doctor.degree || '',
        clinicName: doctor.clinicName || '',
        bio: doctor.bio || '',
        gender: doctor.gender || '',
        hoursFrom: doctor.hoursFrom || '09:00',
        hoursTo: doctor.hoursTo || '17:00',
        availableDays: doctor.availableDays || [],
        languages: (doctor.languages || []).join(', '),
        avatarColor: doctor.avatarColor || '#0d9488',
    });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [copied, setCopied] = useState(false);
    const [regenerating, setRegenerating] = useState(false);

    const handleCopyKey = () => {
        if (!doctor.secretKey) return;
        navigator.clipboard.writeText(doctor.secretKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleRegenerateKey = async () => {
        if (!confirm('Regenerating will invalidate your current key for FUTURE links. Existing links remain active. Proceed?')) return;
        setRegenerating(true);
        try {
            await rotateSecretKey();
        } catch (err) {
            alert('Failed to regenerate key: ' + err.message);
        } finally {
            setRegenerating(false);
        }
    };

    const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const toggleDay = (day) => setForm(f => ({
        ...f,
        availableDays: f.availableDays.includes(day)
            ? f.availableDays.filter(d => d !== day)
            : [...f.availableDays, day],
    }));

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await updateProfile({
                ...form,
                experience: Number(form.experience) || 0,
                fee: Number(form.fee) || 0,
                languages: form.languages.split(',').map(s => s.trim()).filter(Boolean),
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } finally {
            setSaving(false);
        }
    };

    const initials = form.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'DR';

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h1 className="text-xl font-bold text-slate-800">My Profile</h1>
                <p className="text-sm text-slate-500 mt-0.5">Update your clinic details, fee and consultation timing</p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4">
                        <div className="px-2 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                            Private Key
                        </div>
                    </div>
                    <h2 className="font-semibold text-slate-700 text-sm mb-1 flex items-center gap-2">
                        <Building2 size={15} className="text-primary" /> Doctor Secret Key
                    </h2>
                    <p className="text-[11px] text-slate-500 mb-4">Share this unique key with clinics or medical centers to link your professional profile to their dashboard.</p>
                    
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-mono text-sm text-slate-700 select-all min-h-[44px] flex items-center">
                            {doctor.secretKey || 'Generating...'}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleCopyKey}
                                className={cn(
                                    "flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border min-h-[44px]",
                                    copied ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-white border-slate-200 text-slate-600 hover:border-primary/40 hover:bg-slate-50"
                                )}
                            >
                                {copied ? <CheckCircle size={15} /> : <Copy size={15} />}
                                {copied ? 'Copied' : 'Copy'}
                            </button>
                            <button
                                type="button"
                                onClick={handleRegenerateKey}
                                className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-primary hover:border-primary/40 hover:bg-slate-50 transition-all"
                                title="Regenerate Key"
                            >
                                <RefreshCw size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <h2 className="font-semibold text-slate-700 text-sm mb-4">Avatar Color</h2>
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-2xl flex items-center justify-center font-bold text-white text-xl shadow-md" style={{ backgroundColor: form.avatarColor }}>
                            {initials}
                        </div>
                        <div className="flex gap-2.5">
                            {AVATAR_COLORS.map(c => (
                                <button
                                    type="button"
                                    key={c}
                                    onClick={() => setForm(f => ({ ...f, avatarColor: c }))}
                                    style={{ backgroundColor: c }}
                                    className={cn('h-8 w-8 rounded-full transition-all', form.avatarColor === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-105')}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <h2 className="font-semibold text-slate-700 text-sm mb-4 flex items-center gap-2"><User size={15} /> Personal Information</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            { name: 'fullName', label: 'Full Name', placeholder: 'Dr. Priya Sharma', type: 'text' },
                            { name: 'phone', label: 'Phone Number', placeholder: '9876543210', type: 'tel' },
                            { name: 'email', label: 'Email', placeholder: 'doctor@clinic.com', type: 'email' },
                            { name: 'city', label: 'City', placeholder: 'Delhi', type: 'text' },
                        ].map(({ name, label, placeholder, type }) => (
                            <div key={name}>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
                                <input
                                    name={name}
                                    type={type}
                                    value={form[name]}
                                    onChange={handleChange}
                                    placeholder={placeholder}
                                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition"
                                />
                            </div>
                        ))}
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Bio</label>
                            <textarea
                                name="bio"
                                value={form.bio}
                                onChange={handleChange}
                                rows={3}
                                placeholder="Write a short bio..."
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 resize-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <h2 className="font-semibold text-slate-700 text-sm mb-4 flex items-center gap-2"><Stethoscope size={15} /> Professional Details</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Specialization</label>
                            <select
                                name="specialization"
                                value={form.specialization}
                                onChange={handleChange}
                                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
                            >
                                <option value="">Select...</option>
                                {SPECIALIZATIONS.map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>

                        {[
                            { name: 'degree', label: 'Degree', placeholder: 'MBBS, MD (Cardiology)' },
                            { name: 'experience', label: 'Experience (years)', placeholder: '10', type: 'number' },
                            { name: 'fee', label: 'Consultation Fee (Rs.)', placeholder: '1500', type: 'number' },
                            { name: 'languages', label: 'Languages (comma-separated)', placeholder: 'English, Hindi' },
                        ].map(({ name, label, placeholder, type }) => (
                            <div key={name}>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
                                <input
                                    name={name}
                                    type={type || 'text'}
                                    value={form[name]}
                                    onChange={handleChange}
                                    placeholder={placeholder}
                                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <h2 className="font-semibold text-slate-700 text-sm mb-4 flex items-center gap-2"><Building2 size={15} /> Clinic Information</h2>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Clinic Name(s)</label>
                        <input
                            name="clinicName"
                            value={form.clinicName}
                            onChange={handleChange}
                            placeholder="e.g. City Clinic, Apollo Hospital (use commas for multiple)"
                            className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition"
                        />
                        <p className="text-[10px] text-slate-400 mt-1.5 ml-1">Patients will see these clinics as separate options during booking.</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <h2 className="font-semibold text-slate-700 text-sm mb-4 flex items-center gap-2"><Clock size={15} /> Availability</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-2">Available Days</label>
                            <div className="flex flex-wrap gap-2">
                                {DAYS.map(day => (
                                    <button
                                        type="button"
                                        key={day}
                                        onClick={() => toggleDay(day)}
                                        className={cn(
                                            'px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all',
                                            form.availableDays.includes(day) ? 'bg-primary text-white border-primary' : 'bg-white text-slate-500 border-slate-200 hover:border-primary/40'
                                        )}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-4">
                            {[{ name: 'hoursFrom', label: 'From' }, { name: 'hoursTo', label: 'To' }].map(({ name, label }) => (
                                <div key={name} className="flex-1">
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
                                    <input
                                        type="time"
                                        name={name}
                                        value={form[name]}
                                        onChange={handleChange}
                                        className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    className={cn(
                        'flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-sm transition-all shadow-md',
                        saved ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-gradient-to-r from-primary to-teal-400 text-white shadow-primary/25 hover:opacity-90 disabled:opacity-60'
                    )}
                >
                    {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</>
                        : saved ? <><CheckCircle size={16} /> Saved!</>
                            : <><Save size={16} /> Save Profile</>}
                </button>
            </form>
        </div>
    );
}
