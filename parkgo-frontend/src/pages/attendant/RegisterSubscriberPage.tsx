import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserPlus,
  User as UserIcon,
  Mail,
  Phone,
  Hash,
  Lock,
  CheckCircle2,
  Dice5,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  subscriberRegistrationSchema,
  type SubscriberRegistrationInput,
} from '@/utils/validators';
import { subscriberApi } from '@/api/subscriber.api';
import type { User } from '@/types';

const genPassword = () => {
  const chars =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  return Array.from(
    { length: 10 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join('');
};

interface SuccessState {
  user: User;
  password: string;
}

export default function RegisterSubscriberPage() {
  const qc = useQueryClient();
  const [success, setSuccess] = useState<SuccessState | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<SubscriberRegistrationInput>({
    resolver: zodResolver(subscriberRegistrationSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone_number: '',
      license_plate: '',
      password: '',
    },
  });

  const create = useMutation({
    mutationFn: (input: SubscriberRegistrationInput) =>
      subscriberApi.register(input),
    onSuccess: (data, variables) => {
      setSuccess({ user: data.user, password: variables.password });
      reset();
      qc.invalidateQueries({ queryKey: ['subscribers'] });
      qc.invalidateQueries({ queryKey: ['facility'] });
    },
    onError: (err: { error?: string; message?: string }) => {
      toast.error(err.error || err.message || 'Registration failed');
    },
  });

  const onSubmit = (values: SubscriberRegistrationInput) => create.mutate(values);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        eyebrow="New account"
        title={
          <span className="inline-flex items-center gap-3">
            <span className="h-10 w-10 rounded-2xl bg-accent-50 border border-accent-100 flex items-center justify-center text-accent-600">
              <UserPlus className="h-5 w-5" />
            </span>
            Register subscriber
          </span>
        }
        description="Create a new subscriber account · a welcome email will be sent"
      />

      <Card variant="default" padding="xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="First name"
            placeholder="John"
            icon={<UserIcon className="h-4 w-4" />}
            error={errors.first_name?.message}
            {...register('first_name')}
          />
          <Input
            label="Last name"
            placeholder="Doe"
            icon={<UserIcon className="h-4 w-4" />}
            error={errors.last_name?.message}
            {...register('last_name')}
          />
        </div>

        <Input
          type="email"
          label="Email"
          placeholder="john.doe@example.com"
          autoComplete="off"
          icon={<Mail className="h-4 w-4" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            type="tel"
            label="Phone number"
            placeholder="0501234567"
            icon={<Phone className="h-4 w-4" />}
            error={errors.phone_number?.message}
            {...register('phone_number')}
          />
          <Input
            label="License plate"
            placeholder="12-345-67"
            icon={<Hash className="h-4 w-4" />}
            error={errors.license_plate?.message}
            {...register('license_plate')}
          />
        </div>

        <div>
          <Input
            type="text"
            label="Initial password"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            icon={<Lock className="h-4 w-4" />}
            error={errors.password?.message}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() =>
              setValue('password', genPassword(), { shouldValidate: true })
            }
            className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            <Dice5 className="h-3.5 w-3.5" />
            Generate strong password
          </button>
        </div>

          <Button type="submit" size="lg" fullWidth loading={create.isPending}>
            <UserPlus className="h-5 w-5" />
            Create subscriber
          </Button>
        </form>
      </Card>

      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-ink-900/60 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setSuccess(null)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              transition={{ type: 'spring', stiffness: 220, damping: 22 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl bg-surface-0 p-6 md:p-8 shadow-popover"
            >
              <div className="flex items-center justify-center mb-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-success-500 to-success-700 flex items-center justify-center shadow-[0_8px_24px_-8px_rgba(16,185,129,0.55)]">
                  <CheckCircle2 className="h-7 w-7 text-white" />
                </div>
              </div>
              <h2 className="font-display text-2xl font-bold text-ink-900 text-center">
                Subscriber created
              </h2>
              <p className="text-sm text-ink-500 text-center mt-1">
                Credentials emailed to {success.user.email}
              </p>

              <div className="mt-6 rounded-2xl bg-surface-50 border border-surface-200 p-4 text-sm space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-ink-500">Subscriber #</span>
                  <Badge tone="brand" size="md">#{success.user.id}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-500">Name</span>
                  <span className="font-semibold text-ink-900">
                    {success.user.first_name} {success.user.last_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-500">Email</span>
                  <span className="font-semibold text-ink-900 truncate ml-2">
                    {success.user.email}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-ink-500">Password</span>
                  <code className="font-mono text-xs bg-surface-0 border border-surface-200 px-2 py-1 rounded-lg text-ink-800">
                    {success.password}
                  </code>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => setSuccess(null)}
                >
                  Register another
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
