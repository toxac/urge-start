import { AuthShell } from '@/components/auth/AuthShell';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <AuthShell
      eyebrow="Almost there"
      title="Choose a new password."
      description="Pick something you'll be comfortable using next time."
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}