import { AuthShell } from '@/components/auth/AuthShell';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Password"
      title="Forgot your password?"
      description="No problem. We'll send you a link to choose a new one."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}