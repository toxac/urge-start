import { AuthShell } from '@/components/auth/AuthShell';
import { SignupForm } from '@/components/auth/SignupForm';

export default function SignupPage() {
  return (
    <AuthShell
      eyebrow="Start here"
      title="Let's get you in."
      description="You only need an email and password for now. We'll figure out the rest together later."
    >
      <SignupForm />
    </AuthShell>
  );
}