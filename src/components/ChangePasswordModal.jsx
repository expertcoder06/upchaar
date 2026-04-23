import React, { useState } from 'react';
import { supabase } from '@/lib/supabase.js';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function ChangePasswordModal({ isOpen, onClose, userEmail }) {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleClose = () => {
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        setSuccess(false);
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError("New passwords do not match.");
            return;
        }

        if (newPassword.length < 6) {
            setError("New password must be at least 6 characters.");
            return;
        }

        setLoading(true);

        try {
            // First, verify the old password by attempting a sign-in
            if (userEmail && oldPassword) {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email: userEmail,
                    password: oldPassword,
                });

                if (signInError) {
                    throw new Error("Incorrect old password.");
                }
            }

            // Update with new password
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (updateError) throw updateError;

            setSuccess(true);
            setTimeout(() => {
                handleClose();
            }, 2000);
        } catch (err) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 20 }}
                        transition={{ type: 'spring', duration: 0.35, bounce: 0.2 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl pointer-events-auto overflow-hidden flex flex-col">
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center shadow-sm">
                                        <Lock size={16} className="text-white" />
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-slate-800 text-base">Change Password</h2>
                                        <p className="text-xs text-slate-500">Secure your account</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleClose}
                                    className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="px-6 py-5">
                                {success ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex flex-col items-center justify-center py-8 gap-3"
                                    >
                                        <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center">
                                            <CheckCircle size={32} className="text-emerald-500" />
                                        </div>
                                        <p className="font-bold text-slate-800 text-lg">Password Updated!</p>
                                        <p className="text-sm text-slate-500 text-center">
                                            Your password has been changed successfully.
                                        </p>
                                    </motion.div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-4">

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Old Password</label>
                                            <input
                                                type="password"
                                                value={oldPassword}
                                                onChange={e => setOldPassword(e.target.value)}
                                                placeholder="Enter your current password"
                                                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition bg-slate-50 focus:bg-white"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">New Password</label>
                                            <input
                                                type="password"
                                                value={newPassword}
                                                onChange={e => setNewPassword(e.target.value)}
                                                placeholder="Enter new password"
                                                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition bg-slate-50 focus:bg-white"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Confirm New Password</label>
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={e => setConfirmPassword(e.target.value)}
                                                placeholder="Re-enter new password"
                                                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition bg-slate-50 focus:bg-white"
                                                required
                                            />
                                        </div>

                                        {error && (
                                            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                                                <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
                                                {error}
                                            </motion.div>
                                        )}

                                        <div className="flex gap-3 pt-4">
                                            <button type="button" onClick={handleClose} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition">
                                                Cancel
                                            </button>
                                            <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-primary to-teal-500 hover:opacity-90 transition shadow-sm shadow-primary/20 disabled:opacity-60 flex items-center justify-center gap-2">
                                                {loading ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : 'Change Password'}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
