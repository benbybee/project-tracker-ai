'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GlassCard } from '@/components/ui/glass-card';

const EditProjectSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters'),
  description: z.string().optional(),
  type: z.enum(['general', 'website']),
  roleId: z.string().optional(),
  // WordPress one-click login fields
  wpOneClickEnabled: z.boolean().optional(),
  wpAdminEmail: z
    .string()
    .email('Must be a valid email')
    .optional()
    .or(z.literal('')),
  wpApiKey: z.string().optional(),
});

type EditProjectFields = z.infer<typeof EditProjectSchema>;

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: {
    id: string;
    name: string;
    description?: string | null;
    type: 'general' | 'website';
    roleId?: string | null;
    wpOneClickEnabled?: boolean | null;
    wpAdminEmail?: string | null;
    wpApiKey?: string | null;
  };
  onSuccess: () => void;
}

export function EditProjectModal({
  isOpen,
  onClose,
  project,
  onSuccess,
}: EditProjectModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const utils = trpc.useUtils();
  const { data: roles = [] } = trpc.roles.list.useQuery();

  const updateMutation = trpc.projects.update.useMutation({
    onSuccess: () => {
      utils.projects.get.invalidate({ id: project.id });
      utils.tasks.byProjectId.invalidate({ projectId: project.id });
      onSuccess();
      onClose();
    },
    onError: (error) => {
      console.error('Failed to update project:', error);
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
    watch,
    control,
  } = useForm<EditProjectFields>({
    resolver: zodResolver(EditProjectSchema),
    defaultValues: {
      name: project.name,
      description: project.description || '',
      type: project.type,
      roleId: project.roleId || '',
      wpOneClickEnabled: project.wpOneClickEnabled || false,
      wpAdminEmail: project.wpAdminEmail || '',
      wpApiKey: project.wpApiKey || '',
    },
  });

  const wpOneClickEnabled = watch('wpOneClickEnabled');

  // Reset form when project changes
  useEffect(() => {
    reset({
      name: project.name,
      description: project.description || '',
      type: project.type,
      roleId: project.roleId || '',
      wpOneClickEnabled: project.wpOneClickEnabled || false,
      wpAdminEmail: project.wpAdminEmail || '',
      wpApiKey: project.wpApiKey || '',
    });
  }, [project, reset]);

  const onSubmit = async (data: EditProjectFields) => {
    setIsSubmitting(true);

    updateMutation.mutate({
      id: project.id,
      name: data.name,
      description: data.description || undefined,
      type: data.type,
      roleId: data.roleId || undefined,
      wpOneClickEnabled: data.wpOneClickEnabled,
      wpAdminEmail: data.wpAdminEmail || undefined,
      wpApiKey: data.wpApiKey || undefined,
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
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>
            Update the project details and settings.
          </DialogDescription>
        </DialogHeader>

        <GlassCard className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name *
                </label>
                <Input
                  {...register('name')}
                  placeholder="Enter project name"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <Input
                  {...register('description')}
                  placeholder="Enter project description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Type
                </label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="website">Website</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <Controller
                  name="roleId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || 'no-role'}
                      onValueChange={(value) =>
                        field.onChange(value === 'no-role' ? '' : value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="No role assigned" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-role">
                          No role assigned
                        </SelectItem>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {/* WordPress One-Click Login Section */}
            <div className="space-y-4 border rounded-lg p-4 bg-purple-50 mt-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="wpOneClickEnabled"
                  {...register('wpOneClickEnabled')}
                  className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <label
                  htmlFor="wpOneClickEnabled"
                  className="text-sm font-medium text-purple-900 cursor-pointer"
                >
                  Enable One-Click WordPress Login
                </label>
              </div>

              {wpOneClickEnabled && (
                <>
                  <p className="text-xs text-purple-700">
                    Configure WordPress Magic Login Pro integration for seamless
                    authentication.
                  </p>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label
                        htmlFor="wpAdminEmail"
                        className="block text-sm font-medium text-purple-800 mb-2"
                      >
                        WordPress Admin Email *
                      </label>
                      <Input
                        {...register('wpAdminEmail')}
                        type="email"
                        placeholder="admin@example.com"
                        className="w-full"
                      />
                      {errors.wpAdminEmail && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.wpAdminEmail.message}
                        </p>
                      )}
                      <p className="text-xs text-purple-600 mt-1">
                        The email of the WordPress user to log in as
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="wpApiKey"
                        className="block text-sm font-medium text-purple-800 mb-2"
                      >
                        WordPress API Key *
                      </label>
                      <Input
                        {...register('wpApiKey')}
                        type="password"
                        placeholder="Enter Magic Login Pro API key"
                        className="w-full"
                      />
                      <p className="text-xs text-purple-600 mt-1">
                        API key from Magic Login Pro plugin settings
                      </p>
                    </div>
                  </div>
                </>
              )}
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
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </GlassCard>
      </DialogContent>
    </Dialog>
  );
}
