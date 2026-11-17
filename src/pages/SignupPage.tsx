import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AuthLayout } from '@/components/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KeyRound, Mail, User, Lock, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function SignupPage() {
  const { signup, requestSignupOtp, initiateGoogleLogin } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 1: Send OTP to email
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      await requestSignupOtp(email);
      setMessage(`Verification OTP sent to ${email}`);
      setStep('otp');
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to send verification OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Complete signup with OTP
  const handleVerifyAndSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signup(name, email, password, otp);
      navigate('/');
    } catch (err: unknown) {
      setError((err as Error).message || 'Verification failed. Please check the OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      await initiateGoogleLogin();
    } catch (err: unknown) {
      setError((err as Error).message || 'Google login not configured or failed');
    }
  };

  return (
    <AuthLayout
      title={step === 'details' ? 'Create an Account' : 'Verify Your Email'}
      subtitle={
        step === 'details'
          ? 'Register as an administrator to manage Poongodi Farm Products'
          : `We dispatched a 6-digit confirmation code to ${email}`
      }
    >
      <div className="space-y-5">
        {/* Progress steps indicator */}
        <div className="flex items-center justify-center gap-3 pb-1">
          <div className="flex items-center gap-1.5">
            <div
              className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                step === 'details'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-emerald-500 text-white'
              }`}
            >
              {step === 'otp' ? <CheckCircle2 className="h-3.5 w-3.5" /> : '1'}
            </div>
            <span className="text-xs font-medium">Details</span>
          </div>
          <div className="w-8 h-[1px] bg-border" />
          <div className="flex items-center gap-1.5">
            <div
              className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                step === 'otp'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              2
            </div>
            <span className="text-xs font-medium text-muted-foreground">OTP Verify</span>
          </div>
        </div>

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

        {step === 'details' ? (
          <>
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-semibold">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="Arun Kumar"
                    className="pl-9 h-10"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

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

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold">
                  Create Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min 6 characters"
                    className="pl-9 h-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-10 font-semibold gap-2 shadow-sm" disabled={loading}>
                {loading ? 'Sending OTP...' : 'Send Verification OTP'}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-3 text-muted-foreground font-medium">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-10 flex items-center justify-center gap-2.5 border-border hover:bg-muted font-medium"
              onClick={handleGoogleLogin}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Sign Up with Google
            </Button>
          </>
        ) : (
          <form onSubmit={handleVerifyAndSignup} className="space-y-4">
            <div className="space-y-2 text-center py-2">
              <Label htmlFor="otp" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Enter 6-Digit OTP Code
              </Label>
              <Input
                id="otp"
                type="text"
                maxLength={6}
                placeholder="• • • • • •"
                className="text-center tracking-[0.75em] text-2xl font-mono h-14 font-bold bg-muted/30 focus-visible:ring-primary"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                autoFocus
                required
              />
              <p className="text-[11px] text-muted-foreground">Valid for 10 minutes from request</p>
            </div>

            <Button type="submit" className="w-full h-10 font-semibold gap-2 shadow-sm" disabled={loading}>
              <KeyRound className="h-4 w-4" />
              {loading ? 'Verifying & Registering...' : 'Verify OTP & Complete Registration'}
            </Button>

            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={() => setStep('details')}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground font-medium"
              >
                <ArrowLeft className="h-3 w-3" /> Edit details
              </button>
              <button
                type="button"
                onClick={handleRequestOtp}
                disabled={loading}
                className="text-primary hover:underline font-semibold"
              >
                Resend code
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-xs text-muted-foreground pt-2">
          Already registered?{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
