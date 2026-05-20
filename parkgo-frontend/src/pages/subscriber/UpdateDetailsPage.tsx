import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Phone, Hash, Lock, Info } from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { updateDetailsSchema, type UpdateDetailsInput } from '@/utils/validators';
import { subscriberApi } from '@/api/subscriber.api';
import { useAuthStore } from '@/store/authStore';

export default function UpdateDetailsPage() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateDetailsInput>({
    resolver: zodResolver(updateDetailsSchema),
    defaultValues: {
      current_password: '',
      license_plate: '',
      phone_number: '',
      new_password: '',
    },
  });

  const update = useMutation({
    mutationFn: (values: UpdateDetailsInput) => {
      if (!user) throw new Error('Not signed in');
      return subscriberApi.updateMyDetails(user.id, values);
    },
    onSuccess: () => {
      toast.success('Details updated successfully');
      qc.invalidateQueries({ queryKey: ['subscriber'] });
      qc.invalidateQueries({ queryKey: ['auth', 'me'] });
      reset({
        current_password: '',
        license_plate: '',
        phone_number: '',
        new_password: '',
      });
    },
    onError: (err: { error?: string; message?: string }) => {
      toast.error(err.error || err.message || 'Update failed');
    },
  });

  const onSubmit = (values: UpdateDetailsInput) => update.mutate(values);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        eyebrow="Settings"
        title={
          <span className="inline-flex items-center gap-3">
            <span className="h-10 w-10 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
              <Pencil className="h-5 w-5" />
            </span>
            Update details
          </span>
        }
        description="Change your phone, license plate, or password"
      />

      <Card variant="default" padding="xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div className="rounded-2xl bg-info-50 border border-info-100 p-4 flex items-start gap-3">
            <Info className="h-5 w-5 text-info-600 shrink-0 mt-0.5" />
            <div className="text-sm text-info-600">
              <p className="font-semibold">Current password required</p>
              <p className="mt-0.5">
                Leave a field blank to keep its current value.
              </p>
            </div>
          </div>

          <Input
            type="password"
            label="Current password (required)"
            autoComplete="current-password"
            icon={<Lock className="h-4 w-4" />}
            error={errors.current_password?.message}
            {...register('current_password')}
          />

          <Input
            type="text"
            label="License plate"
            placeholder="12-345-67"
            icon={<Hash className="h-4 w-4" />}
            error={errors.license_plate?.message}
            {...register('license_plate')}
          />

          <Input
            type="tel"
            label="Phone number"
            placeholder="0501234567"
            icon={<Phone className="h-4 w-4" />}
            error={errors.phone_number?.message}
            {...register('phone_number')}
          />

          <Input
            type="password"
            label="New password (leave blank to keep current)"
            autoComplete="new-password"
            icon={<Lock className="h-4 w-4" />}
            error={errors.new_password?.message}
            {...register('new_password')}
          />

          <Button type="submit" size="lg" fullWidth loading={update.isPending}>
            Save changes
          </Button>
        </form>
      </Card>
    </div>
  );
}
