'use client';

import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button-base';
import Input from '@/components/ui/input';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function AccountPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // TODO: Implement API call to update user info
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      setIsEditing(false);
      // Show success message
    } catch (error) {
      console.error('Failed to update account:', error);
      // Show error message
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    });
    setIsEditing(false);
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.first_name && !user?.last_name) return 'U';
    const first = user.first_name?.[0] || '';
    const last = user.last_name?.[0] || '';
    return (first + last).toUpperCase();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Icon icon="lucide:arrow-left" className="w-5 h-5 text-content-secondary" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-content-primary">Account Information</h1>
              <p className="text-content-secondary mt-1">Manage your personal information</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-600 rounded-full mb-4">
                  {user?.avatar ? (
                    <img 
                      src={`https://app.nexpo.vn/assets/${user.avatar}`} 
                      alt={`${user.first_name} ${user.last_name}`}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-3xl font-semibold text-white">
                      {getUserInitials()}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-content-primary">
                  {user?.first_name} {user?.last_name}
                </h3>
                <p className="text-sm text-content-tertiary mt-1">{user?.email}</p>
                
                <button className="mt-4 inline-flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
                  <Icon icon="lucide:camera" className="w-4 h-4" />
                  <span>Change Avatar</span>
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-content-tertiary">Role</span>
                    <span className="font-medium text-content-primary">{user?.role || 'User'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-content-tertiary">Status</span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Information Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-content-primary">Personal Information</h2>
                {!isEditing ? (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    icon="lucide:edit-3"
                  >
                    Edit
                  </Button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      variant="gradient"
                      loading={isSaving}
                      icon="lucide:save"
                    >
                      Save Changes
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    disabled={!isEditing}
                    leftIcon="lucide:user"
                  />
                  <Input
                    label="Last Name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    disabled={!isEditing}
                    leftIcon="lucide:user"
                  />
                </div>

                <Input
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!isEditing}
                  leftIcon="lucide:mail"
                />

                <Input
                  label="Phone Number"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!isEditing}
                  leftIcon="lucide:phone"
                  helperText="Optional - for account recovery"
                />
              </div>

              {/* Security Section */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-base font-semibold text-content-primary mb-4">Security</h3>
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group">
                    <div className="flex items-center space-x-3">
                      <Icon icon="lucide:key" className="w-5 h-5 text-content-tertiary group-hover:text-content-secondary" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-content-primary">Change Password</p>
                        <p className="text-xs text-content-tertiary">Update your password regularly</p>
                      </div>
                    </div>
                    <Icon icon="lucide:chevron-right" className="w-5 h-5 text-content-tertiary group-hover:text-content-secondary" />
                  </button>

                  <button className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group">
                    <div className="flex items-center space-x-3">
                      <Icon icon="lucide:shield" className="w-5 h-5 text-content-tertiary group-hover:text-content-secondary" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-content-primary">Two-Factor Authentication</p>
                        <p className="text-xs text-content-tertiary">Add extra security to your account</p>
                      </div>
                    </div>
                    <Icon icon="lucide:chevron-right" className="w-5 h-5 text-content-tertiary group-hover:text-content-secondary" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

