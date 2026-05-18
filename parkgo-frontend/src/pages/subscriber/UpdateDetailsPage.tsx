import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Phone, Hash, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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
      <header className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-primary-50 flex items-center justify-center">
          <Pencil className="h-5 w-5 text-primary-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Update details
          </h1>
          <p className="text-slate-500 text-sm">
            Change your phone, license plate, or password
          </p>
        </div>
      </header>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="rounded-3xl bg-white border border-slate-100 p-6 md:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-5"
        noValidate
      >
        <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
          You must enter your <strong>current password</strong> to change any
          detail. Leave a field blank to keep its current value.
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
    </div>
  );
}
