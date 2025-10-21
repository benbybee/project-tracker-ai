'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { trpc } from '@/lib/trpc';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { GlassCard } from '@/components/ui/glass-card';

const EditProjectSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters'),
  description: z.string().optional(),
  type: z.enum(['general', 'website']),
  roleId: z.string().optional(),
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
  };
  onSuccess: () => void;
}

export function EditProjectModal({ isOpen, onClose, project, onSuccess }: EditProjectModalProps) {
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
    }
  });

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<EditProjectFields>({
    resolver: zodResolver(EditProjectSchema),
    defaultValues: {
      name: project.name,
      description: project.description || '',
      type: project.type,
      roleId: project.roleId || '',
    }
  });

  // Reset form when project changes
  useEffect(() => {
    reset({
      name: project.name,
      description: project.description || '',
      type: project.type,
      roleId: project.roleId || '',
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
                  <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
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
                <Select {...register('type')}>
                  <option value="general">General</option>
                  <option value="website">Website</option>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <Select {...register('roleId')}>
                  <option value="">No role assigned</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </Select>
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
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </GlassCard>
      </DialogContent>
    </Dialog>
  );
}
