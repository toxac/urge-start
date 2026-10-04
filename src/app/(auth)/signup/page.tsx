import { AuthShell } from '@/components/auth/AuthShell';
import { SignupForm } from '@/components/auth/SignupForm';

export default function SignupPage({
  searchParams,
}: {
  searchParams: { intent?: string };
}) {
  // Default to 'try' if no valid intent is provided
  const intent = searchParams.intent === 'join' ? 'join' : 'try';

  return (
    <AuthShell
      eyebrow="Start here"
      title="Let's get you in."
      description="You only need an email and password for now. We'll figure out the rest together later."
    >
      <SignupForm intent={intent} />
    </AuthShell>
  );
}