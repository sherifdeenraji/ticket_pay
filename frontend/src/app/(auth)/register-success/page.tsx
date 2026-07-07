'use client';

import Link from 'next/link';
import { Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RegisterSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-hidden">
      {/* Background blurs */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse-slow" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-secondary/20 rounded-full blur-[100px] animate-pulse-slow" />

      <div className="w-full max-w-md relative z-10 text-center space-y-6">
        <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto text-primary animate-bounce-slow">
          <Mail className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight">
            Check Your <span className="text-primary">Email</span>
          </h1>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            We&apos;ve sent a verification link to your registered email address. Please click the link to activate your account.
          </p>
        </div>

        <div className="glass p-8 rounded-3xl shadow-2xl space-y-4 text-left">
          <h3 className="font-bold text-sm">Next Steps:</h3>
          <ul className="text-xs text-muted-foreground space-y-2 list-disc pl-4">
            <li>Open the confirmation email in your inbox.</li>
            <li>Click the verification link in the email.</li>
            <li>Once verified, you will be redirected to log in.</li>
          </ul>
        </div>

        <Link href="/login" className="block w-full">
          <Button className="w-full h-12 rounded-2xl flex items-center justify-center gap-2">
            <span>Go to Login</span>
            <ArrowRight size={16} />
          </Button>
        </Link>
      </div>
    </div>
  );
}
