'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { countries } from 'countries-list';

import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { setupUserOnboarding } from '@/actions/auth';
import { $userContext } from '@/lib/stores/user-context';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Transform countries object into a sortable array, using ISO codes as values
const countryOptions = Object.entries(countries)
  .map(([code, data]) => ({ code, name: data.name }))
  .sort((a, b) => a.name.localeCompare(b.name));

const onboardingSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters.')
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores.'),
  display_name: z.string().min(1, 'Display name is required.'),
  mobile_number: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true; // Optional field
      const phoneNumber = parsePhoneNumberFromString(val);
      return phoneNumber?.isValid() ?? false;
    }, 'Enter a valid phone number with country code (e.g., +91...).'),
  city: z.string().optional(),
  country: z.string().optional(), // Now stores the ISO code (e.g., 'IN')
});

type OnboardingValues = z.infer<typeof onboardingSchema>;

export function OnboardingForm({ intent = 'try' }: { intent?: 'try' | 'join' }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);

  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      username: '',
      display_name: '',
      mobile_number: '',
      city: '',
      country: 'IN' // Default to India ISO code
    },
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

  const handleUsernameBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const username = e.target.value;
    if (username.length < 3 || form.formState.errors.username) {
      setIsUsernameAvailable(null);
      return;
    }

    setIsCheckingUsername(true);
    const supabase = createSupabaseBrowserClient();

    const { data } = await supabase
      .from('user_profile')
      .select('id')
      .eq('username_key', username.toLowerCase())
      .maybeSingle();

    setIsUsernameAvailable(!data);
    setIsCheckingUsername(false);
  };

  async function onSubmit(values: OnboardingValues) {
    if (isUsernameAvailable === false) {
      setError('Please choose an available username.');
      return;
    }

    setError(null);
    let avatar_url = null;
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    try {
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

      let formattedPhone = null;
      if (values.mobile_number) {
        const parsed = parsePhoneNumberFromString(values.mobile_number);
        formattedPhone = parsed?.format('E.164') || values.mobile_number;
      }

      // Automatically determine currency and full country name from the ISO code
      let countryName = null;
      let currencyCode = null;

      if (values.country) {
        const countryData = countries[values.country as keyof typeof countries];
        if (countryData) {
          countryName = countryData.name;
          // currency is an array, so we just take the first one
          currencyCode = countryData.currency[0];
        }
      }

      // Execute Onboarding Transaction
      const result = await setupUserOnboarding({
        username: values.username,
        username_key: values.username.toLowerCase(),
        display_name: values.display_name,
        mobile_number: formattedPhone,
        city: values.city || null,
        country: countryName,
        currency: currencyCode,
        avatar_url,
        bio: null,
        shipping_address: null,
        social_links: {},
        website_url: null,
      } as any, intent);

      if (result.success && result.profile) {
        // Merge the new profile into the existing universal context state
        const currentState = $userContext.get();
        $userContext.set({
          ...currentState,
          profile: result.profile,
          isHydrated: true
        });

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
        {form.formState.errors.display_name && (
          <p className="text-sm text-destructive">{form.formState.errors.display_name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <div className="relative">
          <Input
            id="username"
            {...form.register('username')}
            onBlur={handleUsernameBlur}
          />
        </div>
        {form.formState.errors.username ? (
          <p className="text-sm text-destructive">{form.formState.errors.username.message}</p>
        ) : isCheckingUsername ? (
          <p className="text-sm text-muted-foreground">Checking availability...</p>
        ) : isUsernameAvailable === true ? (
          <p className="text-sm text-green-600 dark:text-green-400">Username is available!</p>
        ) : isUsernameAvailable === false ? (
          <p className="text-sm text-destructive">This username is already taken.</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="mobile_number">Mobile Number (with country code)</Label>
        <Input id="mobile_number" placeholder="+91..." {...form.register('mobile_number')} />
        {form.formState.errors.mobile_number && (
          <p className="text-sm text-destructive">{form.formState.errors.mobile_number.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" {...form.register('city')} />
        </div>
        <div className="space-y-2 flex flex-col">
          <Label htmlFor="country">Country</Label>
          <select
            id="country"
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            {...form.register('country')}
          >
            <option value="">Select country...</option>
            {countryOptions.map(({ code, name }) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={form.formState.isSubmitting || isCheckingUsername || isUsernameAvailable === false}
      >
        {form.formState.isSubmitting ? 'Saving...' : 'Complete Setup'}
      </Button>
    </form>
  );
}