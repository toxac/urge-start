'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { setupUserOnboarding } from '@/actions/auth';
import { $profileStore } from '@/lib/stores/profile-store';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const onboardingSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters.').regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores.'),
  display_name: z.string().min(1, 'Display name is required.'),
  city: z.string().optional(),
  country: z.string().optional(),
});

type OnboardingValues = z.infer<typeof onboardingSchema>;

export function OnboardingForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [intent, setIntent] = useState<'try' | 'join'>('try');

  useEffect(() => {
    // Read the intent set on the homepage
    const storedIntent = localStorage.getItem('urge_intent') as 'try' | 'join';
    if (storedIntent) setIntent(storedIntent);
  }, []);

  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { username: '', display_name: '', city: '', country: '' },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        setError('Avatar must be under 1MB.');
        return;
      }
      setAvatarFile(file);
      setError(null);
    }
  };

  async function onSubmit(values: OnboardingValues) {
    setError(null);
    let avatar_url = null;
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    try {
      // 1. Upload Avatar if selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `${user.id}-${Math.random()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile);
          
        if (uploadError) throw new Error('Avatar upload failed.');
        
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
        avatar_url = publicUrl;
      }

      // 2. Execute Onboarding Transaction
      const result = await setupUserOnboarding({
        username: values.username,
        username_key: values.username.toLowerCase(),
        display_name: values.display_name,
        city: values.city || null,
        country: values.country || null,
        avatar_url,
        bio: null,
        mobile_number: null,
        shipping_address: null,
        social_links: {},
        website_url: null,
      }, intent);

      // 3. Hydrate Profile Store
      if (result.success && result.profile) {
        $profileStore.set({ profile: result.profile, isHydrated: true });
        
        // 4. Route based on intent
        if (intent === 'join') {
          router.push('/checkout');
        } else {
          router.push('/program');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="avatar">Avatar (Optional, max 1MB)</Label>
        <Input id="avatar" type="file" accept="image/*" onChange={handleFileChange} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="display_name">Display Name</Label>
        <Input id="display_name" {...form.register('display_name')} />
        {form.formState.errors.display_name && <p className="text-sm text-destructive">{form.formState.errors.display_name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input id="username" {...form.register('username')} />
        {form.formState.errors.username && <p className="text-sm text-destructive">{form.formState.errors.username.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" {...form.register('city')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input id="country" {...form.register('country')} />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? 'Saving...' : 'Complete Setup'}
      </Button>
    </form>
  );
}