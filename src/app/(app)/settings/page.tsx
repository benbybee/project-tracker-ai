'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc';

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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

      {/* Roles Management */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Roles Management</h2>
        
        {/* Create New Role */}
        <form onSubmit={handleCreateRole} className="mb-8">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label htmlFor="roleName" className="block text-sm font-medium text-gray-700 mb-2">
                Role Name
              </label>
              <Input
                id="roleName"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="Enter role name"
              />
            </div>
            <div>
              <label htmlFor="roleColor" className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="roleColor"
                  value={newRoleColor}
                  onChange={(e) => setNewRoleColor(e.target.value)}
                  className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <Input
                  value={newRoleColor}
                  onChange={(e) => setNewRoleColor(e.target.value)}
                  className="w-20"
                />
              </div>
            </div>
            <Button type="submit" disabled={createRoleMutation.isLoading}>
              {createRoleMutation.isLoading ? 'Creating...' : 'Create Role'}
            </Button>
          </div>
        </form>

        {/* Existing Roles */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Existing Roles</h3>
          {isLoading ? (
            <div className="text-center py-4">Loading roles...</div>
          ) : roles && roles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className="border rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className="w-4 h-4 rounded-full mr-3"
                        style={{ backgroundColor: role.color }}
                      ></div>
                      <span className="font-medium text-gray-900">{role.name}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        Delete
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Created {new Date(role.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No roles created yet. Create your first role above.
            </div>
          )}
        </div>
      </div>

      {/* Other Settings */}
      <div className="bg-white rounded-lg shadow p-6 mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Other Settings</h2>
        <div className="text-center py-8 text-gray-500">
          Additional settings will be available in future updates.
        </div>
      </div>
    </div>
  );
}
