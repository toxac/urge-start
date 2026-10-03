import { AuthShell } from '@/components/auth/AuthShell';
import { OnboardingForm } from '@/components/onboarding/OnboardingForm';

export default function OnboardingPage() {
  return (
    <AuthShell
      eyebrow="Welcome to Urge"
      title="Set up your profile."
      description="Let's get the basics out of the way before we start the program."
    >
      <OnboardingForm />
    </AuthShell>
  );
}