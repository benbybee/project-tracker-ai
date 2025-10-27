'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc';
import { Settings as SettingsIcon } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';

// Use auto dynamic rendering to avoid chunk loading issues
export const dynamic = 'force-dynamic';

export default function SettingsPage() {
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleColor, setNewRoleColor] = useState('#3B82F6');

  const { data: roles, isLoading } = trpc.roles.list.useQuery();
  const utils = trpc.useUtils();
  const createRoleMutation = trpc.roles.create.useMutation({
    onSuccess: () => {
      setNewRoleName('');
      setNewRoleColor('#3B82F6');
      // Invalidate and refetch roles list
      utils.roles.list.invalidate();
    },
  });

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    try {
      await createRoleMutation.mutateAsync({
        name: newRoleName,
        color: newRoleColor,
      });
    } catch (error) {
      console.error('Failed to create role:', error);
    }
  };

  return (
    <div className="px-4 sm:px-6 md:px-2 py-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          icon={SettingsIcon}
          title="Settings"
          subtitle="Manage your roles and application preferences"
        />

        {/* Roles Management */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Roles Management
          </h2>

          {/* Create New Role */}
          <form onSubmit={handleCreateRole} className="mb-8">
            <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
              <div className="flex-1">
                <label
                  htmlFor="roleName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Role Name
                </label>
                <Input
                  id="roleName"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="Enter role name"
                />
              </div>
              <div className="flex-1 sm:flex-initial">
                <label
                  htmlFor="roleColor"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="roleColor"
                    value={newRoleColor}
                    onChange={(e) => setNewRoleColor(e.target.value)}
                    className="w-10 h-10 border border-gray-300 rounded cursor-pointer flex-shrink-0"
                  />
                  <Input
                    value={newRoleColor}
                    onChange={(e) => setNewRoleColor(e.target.value)}
                    className="w-24 sm:w-20"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={createRoleMutation.isLoading}
                className="w-full sm:w-auto"
              >
                {createRoleMutation.isLoading ? 'Creating...' : 'Create Role'}
              </Button>
            </div>
          </form>

          {/* Existing Roles */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Existing Roles
            </h3>
            {isLoading ? (
              <div className="text-center py-4">Loading roles...</div>
            ) : roles && roles.length > 0 ? (
              <>
                {/* Mobile View */}
                <div className="block sm:hidden space-y-3">
                  {roles.map((role) => (
                    <div
                      key={role.id}
                      className="border border-gray-200 rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center flex-1 min-w-0">
                          <div
                            className="w-4 h-4 rounded-full mr-3 flex-shrink-0"
                            style={{ backgroundColor: role.color }}
                          ></div>
                          <div className="min-w-0">
                            <span className="font-medium text-gray-900 block truncate">
                              {role.name}
                            </span>
                            <span className="text-xs text-gray-600 font-mono">
                              {role.color}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mb-3">
                        Created: {new Date(role.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            // TODO: Implement edit role functionality
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            // TODO: Implement delete role functionality
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop View */}
                <div className="hidden sm:block border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Role
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Color
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {roles.map((role) => (
                          <tr key={role.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">
                              <div className="flex items-center">
                                <div
                                  className="w-4 h-4 rounded-full mr-3"
                                  style={{ backgroundColor: role.color }}
                                ></div>
                                <span className="font-medium text-gray-900">
                                  {role.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                              {role.color}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {new Date(role.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    // TODO: Implement edit role functionality
                                  }}
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    // TODO: Implement delete role functionality
                                  }}
                                >
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No roles created yet. Create your first role above.
              </div>
            )}
          </div>
        </div>

        {/* Other Settings */}
        <div className="bg-white rounded-lg shadow p-6 mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Other Settings
          </h2>
          <div className="text-center py-8 text-gray-500">
            Additional settings will be available in future updates.
          </div>
        </div>
      </div>
    </div>
  );
}
