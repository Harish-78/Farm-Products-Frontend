import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { AuthLayout } from '@/components/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, ArrowLeft, Send } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await apiFetch<{ success: boolean; message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setMessage(res.message || 'If an account exists, a reset link has been dispatched.');
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to request reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Enter the verified email address linked to your Poongodi administrator account"
    >
      <div className="space-y-5">
        {error && (
          <div className="p-3.5 rounded-lg bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20 animate-in fade-in">
            {error}
          </div>
        )}

        {message && (
          <div className="p-3.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium border border-emerald-500/20 animate-in fade-in">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="admin@poongodifarms.com"
                className="pl-9 h-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-10 font-semibold gap-2 shadow-sm" disabled={loading}>
            <Send className="h-4 w-4" />
            {loading ? 'Sending Instructions...' : 'Send Password Reset Link'}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground pt-2">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-primary font-semibold hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
