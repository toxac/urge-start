import { AuthShell } from '@/components/auth/AuthShell';
import { OnboardingForm } from '@/components/onboarding/OnboardingForm';

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string }>;
}) {
  const resolvedParams = await searchParams;
  const intent = resolvedParams.intent === 'join' ? 'join' : 'try';

  return (
    <AuthShell
      eyebrow="Welcome to Urge"
      title="Set up your profile."
      description="Let's get the basics out of the way before we start the program."
    >
      <OnboardingForm intent={intent} />
    </AuthShell>
  );
}