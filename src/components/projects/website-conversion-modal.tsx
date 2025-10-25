'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { trpc } from '@/lib/trpc';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { GlassCard } from '@/components/ui/glass-card';

const WebsiteFieldsSchema = z.object({
  domain: z.string().url().optional().or(z.literal('')).nullable(),
  hostingProvider: z.string().optional().nullable(),
  dnsStatus: z
    .enum(['pending', 'propagating', 'active', 'failed'])
    .optional()
    .nullable(),
  goLiveDate: z.string().optional().nullable(),
  repoUrl: z.string().url().optional().or(z.literal('')).nullable(),
  stagingUrl: z.string().url().optional().or(z.literal('')).nullable(),
});

type WebsiteFields = z.infer<typeof WebsiteFieldsSchema>;

interface WebsiteConversionModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onSuccess: () => void;
}

export function WebsiteConversionModal({
  isOpen,
  onClose,
  projectId,
  onSuccess,
}: WebsiteConversionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const utils = trpc.useUtils();
  const convertMutation = trpc.projects.convertToWebsite.useMutation({
    onSuccess: () => {
      utils.projects.get.invalidate({ id: projectId });
      utils.tasks.byProjectId.invalidate({ projectId });
      onSuccess();
      onClose();
    },
    onError: (error) => {
      console.error('Failed to convert project:', error);
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<WebsiteFields>({
    resolver: zodResolver(WebsiteFieldsSchema),
  });

  const onSubmit = async (data: WebsiteFields) => {
    setIsSubmitting(true);

    // Convert empty strings to null
    const cleanedData = {
      domain: data.domain || null,
      hostingProvider: data.hostingProvider || null,
      dnsStatus: data.dnsStatus || null,
      goLiveDate: data.goLiveDate || null,
      repoUrl: data.repoUrl || null,
      stagingUrl: data.stagingUrl || null,
    };

    convertMutation.mutate({
      id: projectId,
      website: cleanedData,
    });
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Convert to Website Project</DialogTitle>
          <DialogDescription>
            Add website-specific information to convert this project to a
            website project type. All fields are optional and can be added
            later.
          </DialogDescription>
        </DialogHeader>

        <GlassCard className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Domain
                </label>
                <Input
                  {...register('domain')}
                  placeholder="https://example.com"
                  className={errors.domain ? 'border-red-500' : ''}
                />
                {errors.domain && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.domain.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hosting Provider
                </label>
                <Input
                  {...register('hostingProvider')}
                  placeholder="Vercel, Netlify, AWS, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  DNS Status
                </label>
                <Select {...register('dnsStatus')}>
                  <option value="">Select status</option>
                  <option value="pending">Pending</option>
                  <option value="propagating">Propagating</option>
                  <option value="active">Active</option>
                  <option value="failed">Failed</option>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Go Live Date
                </label>
                <Input {...register('goLiveDate')} type="date" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Repository URL
                </label>
                <Input
                  {...register('repoUrl')}
                  placeholder="https://github.com/user/repo"
                  className={errors.repoUrl ? 'border-red-500' : ''}
                />
                {errors.repoUrl && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.repoUrl.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Staging URL
                </label>
                <Input
                  {...register('stagingUrl')}
                  placeholder="https://staging.example.com"
                  className={errors.stagingUrl ? 'border-red-500' : ''}
                />
                {errors.stagingUrl && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.stagingUrl.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                {isSubmitting ? 'Converting...' : 'Convert to Website Project'}
              </Button>
            </div>
          </form>
        </GlassCard>
      </DialogContent>
    </Dialog>
  );
}
