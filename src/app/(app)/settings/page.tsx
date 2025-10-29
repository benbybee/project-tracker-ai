'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc';
import {
  Settings as SettingsIcon,
  Trash2,
  Edit2,
  Save,
  X,
  User,
  LogOut,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { useSession, signOut } from 'next-auth/react';
import { usePWAToast } from '@/components/ui/toast-pwa';

// Use auto dynamic rendering to avoid chunk loading issues
export const dynamic = 'force-dynamic';

type EditingRole = {
  id: string;
  name: string;
  color: string;
} | null;

export default function SettingsPage() {
  const { data: session } = useSession();
  const { showToast, ToastContainer } = usePWAToast();
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleColor, setNewRoleColor] = useState('#3B82F6');
  const [editingRole, setEditingRole] = useState<EditingRole>(null);

  // Profile management state
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Fetch user profile
  const { data: userProfile } = trpc.user.getProfile.useQuery();

  // Initialize form fields when user profile loads
  useEffect(() => {
    if (userProfile) {
      setProfileName(userProfile.name || '');
      setProfileEmail(userProfile.email || '');
    }
  }, [userProfile]);

  const { data: roles, isLoading, isFetching } = trpc.roles.list.useQuery();
  const isLoadingState = isLoading || isFetching || !roles;
  const utils = trpc.useUtils();

  const createRoleMutation = trpc.roles.create.useMutation({
    onSuccess: async () => {
      setNewRoleName('');
      setNewRoleColor('#3B82F6');
      // Refetch immediately to ensure consistency
      await utils.roles.list.invalidate();
      await utils.roles.list.refetch();
    },
  });

  const updateRoleMutation = trpc.roles.update.useMutation({
    onSuccess: async () => {
      setEditingRole(null);
      // Refetch immediately to ensure consistency
      await utils.roles.list.invalidate();
      await utils.roles.list.refetch();
    },
  });

  const deleteRoleMutation = trpc.roles.remove.useMutation({
    onSuccess: async () => {
      // Refetch immediately to ensure consistency
      await utils.roles.list.invalidate();
      await utils.roles.list.refetch();
    },
  });

  // User profile mutations
  const updateProfileMutation = trpc.user.updateProfile.useMutation({
    onSuccess: async () => {
      await utils.user.getProfile.invalidate();
      showToast('Profile updated successfully', 'success');
    },
    onError: (error) => {
      showToast(error.message || 'Failed to update profile', 'error');
    },
  });

  const changePasswordMutation = trpc.user.changePassword.useMutation({
    onSuccess: () => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Password changed successfully', 'success');
    },
    onError: (error) => {
      showToast(error.message || 'Failed to change password', 'error');
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

  const handleEditRole = (role: {
    id: string;
    name: string;
    color: string;
  }) => {
    setEditingRole({ id: role.id, name: role.name, color: role.color });
  };

  const handleCancelEdit = () => {
    setEditingRole(null);
  };

  const handleSaveEdit = async () => {
    if (!editingRole || !editingRole.name.trim()) return;

    try {
      await updateRoleMutation.mutateAsync({
        id: editingRole.id,
        name: editingRole.name,
        color: editingRole.color,
      });
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this role? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      await deleteRoleMutation.mutateAsync({ id: roleId });
    } catch (error) {
      console.error('Failed to delete role:', error);
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
            {isLoadingState ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
                <p className="text-gray-600">Loading roles...</p>
              </div>
            ) : roles && roles.length > 0 ? (
              <>
                {/* Mobile View */}
                <div className="block sm:hidden space-y-3">
                  {roles.map((role) => {
                    const isEditing = editingRole?.id === role.id;

                    return (
                      <div
                        key={role.id}
                        className="border border-gray-200 rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors"
                      >
                        {isEditing ? (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Role Name
                              </label>
                              <Input
                                value={editingRole.name}
                                onChange={(e) =>
                                  setEditingRole({
                                    ...editingRole,
                                    name: e.target.value,
                                  })
                                }
                                placeholder="Enter role name"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Color
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={editingRole.color}
                                  onChange={(e) =>
                                    setEditingRole({
                                      ...editingRole,
                                      color: e.target.value,
                                    })
                                  }
                                  className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
                                />
                                <Input
                                  value={editingRole.color}
                                  onChange={(e) =>
                                    setEditingRole({
                                      ...editingRole,
                                      color: e.target.value,
                                    })
                                  }
                                  className="flex-1"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="default"
                                size="sm"
                                className="flex-1"
                                onClick={handleSaveEdit}
                                disabled={updateRoleMutation.isLoading}
                              >
                                <Save className="w-4 h-4 mr-1" />
                                {updateRoleMutation.isLoading
                                  ? 'Saving...'
                                  : 'Save'}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={handleCancelEdit}
                                disabled={updateRoleMutation.isLoading}
                              >
                                <X className="w-4 h-4 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
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
                              Created:{' '}
                              {new Date(role.createdAt).toLocaleDateString()}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => handleEditRole(role)}
                              >
                                <Edit2 className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDeleteRole(role.id)}
                                disabled={deleteRoleMutation.isLoading}
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
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
                        {roles.map((role) => {
                          const isEditing = editingRole?.id === role.id;

                          return (
                            <tr key={role.id} className="hover:bg-gray-50">
                              {isEditing ? (
                                <>
                                  <td className="px-4 py-3 text-sm" colSpan={4}>
                                    <div className="flex items-center gap-4">
                                      <div className="flex-1">
                                        <Input
                                          value={editingRole.name}
                                          onChange={(e) =>
                                            setEditingRole({
                                              ...editingRole,
                                              name: e.target.value,
                                            })
                                          }
                                          placeholder="Role name"
                                          className="w-full"
                                        />
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="color"
                                          value={editingRole.color}
                                          onChange={(e) =>
                                            setEditingRole({
                                              ...editingRole,
                                              color: e.target.value,
                                            })
                                          }
                                          className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
                                        />
                                        <Input
                                          value={editingRole.color}
                                          onChange={(e) =>
                                            setEditingRole({
                                              ...editingRole,
                                              color: e.target.value,
                                            })
                                          }
                                          className="w-28"
                                        />
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          variant="default"
                                          size="sm"
                                          onClick={handleSaveEdit}
                                          disabled={
                                            updateRoleMutation.isLoading
                                          }
                                        >
                                          <Save className="w-4 h-4 mr-1" />
                                          {updateRoleMutation.isLoading
                                            ? 'Saving...'
                                            : 'Save'}
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={handleCancelEdit}
                                          disabled={
                                            updateRoleMutation.isLoading
                                          }
                                        >
                                          <X className="w-4 h-4 mr-1" />
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  </td>
                                </>
                              ) : (
                                <>
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
                                    {new Date(
                                      role.createdAt
                                    ).toLocaleDateString()}
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEditRole(role)}
                                      >
                                        <Edit2 className="w-4 h-4 mr-1" />
                                        Edit
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={() =>
                                          handleDeleteRole(role.id)
                                        }
                                        disabled={deleteRoleMutation.isLoading}
                                      >
                                        <Trash2 className="w-4 h-4 mr-1" />
                                        Delete
                                      </Button>
                                    </div>
                                  </td>
                                </>
                              )}
                            </tr>
                          );
                        })}
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

        {/* Profile Management */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="h-6 w-6 text-gray-700" />
            <h2 className="text-xl font-semibold text-gray-900">
              Profile Settings
            </h2>
          </div>

          <div className="space-y-6">
            {/* Profile Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Profile Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="profileName"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Name
                  </label>
                  <Input
                    id="profileName"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder={session?.user?.name || 'Enter your name'}
                  />
                </div>
                <div>
                  <label
                    htmlFor="profileEmail"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Email
                  </label>
                  <Input
                    id="profileEmail"
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    placeholder={session?.user?.email || 'your@email.com'}
                  />
                </div>
                <Button
                  onClick={async () => {
                    if (!profileName.trim() && !profileEmail.trim()) {
                      showToast(
                        'Please provide at least one field to update',
                        'error'
                      );
                      return;
                    }

                    const updateData: { name?: string; email?: string } = {};

                    if (
                      profileName.trim() &&
                      profileName !== userProfile?.name
                    ) {
                      updateData.name = profileName.trim();
                    }

                    if (
                      profileEmail.trim() &&
                      profileEmail !== userProfile?.email
                    ) {
                      updateData.email = profileEmail.trim();
                    }

                    if (Object.keys(updateData).length === 0) {
                      showToast('No changes detected', 'info');
                      return;
                    }

                    await updateProfileMutation.mutateAsync(updateData);
                  }}
                  disabled={updateProfileMutation.isLoading}
                >
                  {updateProfileMutation.isLoading
                    ? 'Updating...'
                    : 'Update Profile'}
                </Button>
              </div>
            </div>

            {/* Password Change */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Change Password
              </h3>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="currentPassword"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Current Password
                  </label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                </div>
                <div>
                  <label
                    htmlFor="newPassword"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    New Password
                  </label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Confirm New Password
                  </label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (newPassword !== confirmPassword) {
                      showToast('Passwords do not match', 'error');
                      return;
                    }
                    if (newPassword.length < 8) {
                      showToast(
                        'Password must be at least 8 characters',
                        'error'
                      );
                      return;
                    }

                    await changePasswordMutation.mutateAsync({
                      currentPassword,
                      newPassword,
                    });
                  }}
                  disabled={
                    !currentPassword ||
                    !newPassword ||
                    !confirmPassword ||
                    changePasswordMutation.isLoading
                  }
                >
                  {changePasswordMutation.isLoading
                    ? 'Changing...'
                    : 'Change Password'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Other Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Other Settings
          </h2>

          <div className="space-y-4">
            {/* Logout Button */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h3 className="text-base font-medium text-gray-900">
                  Sign Out
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Sign out of your account
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => signOut({ callbackUrl: '/sign-in' })}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>

            <p className="text-sm text-gray-500 text-center mt-4">
              Additional settings will be available in future updates.
            </p>
          </div>
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
}
