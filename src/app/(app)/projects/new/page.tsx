'use client';

import { useForm, Controller } from 'react-hook-form';
import { trpc } from '@/lib/trpc';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

type Form = {
  name: string;
  type: 'general' | 'website';
  description?: string;
  roleId?: string;
  domain?: string;
  hostingProvider?: string;
  dnsStatus?: string;
  goLiveDate?: string;
  repoUrl?: string;
  stagingUrl?: string;
};

export default function NewProjectPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const create = trpc.projects.create.useMutation({
    onSuccess: () => {
      // Invalidate projects list to refresh UI
      utils.projects.list.invalidate();
    },
  });
  const { data: roles } = trpc.roles.list.useQuery();
  
  const { control, register, handleSubmit, watch } = useForm<Form>({ 
    defaultValues: { type: 'general' } 
  });
  
  const type = watch('type');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">New Project</h1>
        
        <form 
          className="space-y-6" 
          onSubmit={handleSubmit(async (data) => {
            try {
              const res = await create.mutateAsync(data);
              router.push(`/projects/${res.id}`);
            } catch (error) {
              console.error('Failed to create project:', error);
            }
          })}
        >
          {/* Project Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Project Name *
            </label>
            <Input
              {...register('name')}
              placeholder="Enter project name"
              className="w-full"
            />
          </div>

          {/* Type and Role */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                Project Type
              </label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select defaultValue={field.value} onValueChange={field.onChange}>
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
              <label htmlFor="roleId" className="block text-sm font-medium text-gray-700 mb-2">
                Role (optional)
              </label>
              <Controller
                name="roleId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value ?? 'unassigned'} onValueChange={(v) => field.onChange(v === 'unassigned' ? undefined : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {roles?.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          <div className="flex items-center">
                            <div
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: r.color }}
                            ></div>
                            {r.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              {...register('description')}
              placeholder="Short description or notes"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Website Fields */}
          {type === 'website' && (
            <div className="space-y-4 border rounded-lg p-4 bg-blue-50">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Website Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="domain" className="block text-sm font-medium text-blue-800 mb-2">
                    Domain
                  </label>
                  <Input
                    {...register('domain')}
                    placeholder="example.com"
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label htmlFor="hostingProvider" className="block text-sm font-medium text-blue-800 mb-2">
                    Hosting Provider
                  </label>
                  <Input
                    {...register('hostingProvider')}
                    placeholder="Vercel / WP / etc."
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label htmlFor="dnsStatus" className="block text-sm font-medium text-blue-800 mb-2">
                    DNS Status
                  </label>
                  <Input
                    {...register('dnsStatus')}
                    placeholder="propagated / pending"
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label htmlFor="goLiveDate" className="block text-sm font-medium text-blue-800 mb-2">
                    Go-live Date
                  </label>
                  <Input
                    type="date"
                    {...register('goLiveDate')}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label htmlFor="repoUrl" className="block text-sm font-medium text-blue-800 mb-2">
                    Repo URL
                  </label>
                  <Input
                    {...register('repoUrl')}
                    placeholder="https://github.com/..."
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label htmlFor="stagingUrl" className="block text-sm font-medium text-blue-800 mb-2">
                    Staging URL
                  </label>
                  <Input
                    {...register('stagingUrl')}
                    placeholder="https://staging.example.com"
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6">
            <Button
              variant="outline"
              type="button"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={create.isLoading}
            >
              {create.isLoading ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
