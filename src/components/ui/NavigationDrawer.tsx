'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigations, useCreateNavigation, useUpdateNavigation, useDeleteNavigation, usePagesBySite, useCreateNavigationItem, useUpdateNavigationItem, type Navigation, type NavigationItem } from '@/hooks/useNavigation';
import { Button } from './Button';
import { Input } from './Input';

// Form schemas
const navigationSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: z.enum(['header', 'footer', 'custom']),
  status: z.enum(['published', 'draft', 'archived']),
});

const navigationItemSchema = z.object({
  type: z.enum(['page', 'url']),
  title: z.string().min(1, 'Title is required'),
  page: z.string().optional(),
  url: z.string().optional(),
  open_in_new_tab: z.boolean().optional(),
  icon: z.string().optional(),
  label: z.string().optional(),
  sort: z.number().optional(),
}).refine((data) => {
  if (data.type === 'page') return !!data.page;
  if (data.type === 'url') return !!data.url;
  return true;
}, {
  message: "Page or URL is required based on type",
  path: ["page", "url"]
});

type NavigationFormData = z.infer<typeof navigationSchema>;
type NavigationItemFormData = z.infer<typeof navigationItemSchema>;

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  siteId: number;
  selectedNavigation?: Navigation | null;
  onNavigationSelect?: (navigation: Navigation) => void;
}

interface NavigationItemPayload {
  navigation: string;
  type: 'page' | 'url';
  title: string;
  page?: string;
  url?: string;
  open_in_new_tab?: boolean;
  icon?: string;
  label?: string;
  sort?: number;
  translations: Array<{
    languages_code: string;
    title: string;
  }>;
}

export default function NavigationDrawer({ 
  isOpen, 
  onClose, 
  siteId,
  onNavigationSelect 
}: NavigationDrawerProps) {
  const [activeTab, setActiveTab] = useState<'list' | 'form' | 'items'>('list');
  const [editingNavigation, setEditingNavigation] = useState<Navigation | null>(null);
  const [editingItem, setEditingItem] = useState<NavigationItem | null>(null);
  const [selectedNavForItems, setSelectedNavForItems] = useState<Navigation | null>(null);

  // Queries
  const { data: navigations = [], isLoading } = useNavigations(siteId);
  const { data: pages = [] } = usePagesBySite(siteId);

  // Mutations
  const createNavigation = useCreateNavigation();
  const updateNavigation = useUpdateNavigation();
  const deleteNavigation = useDeleteNavigation();
  const createNavigationItem = useCreateNavigationItem();
  const updateNavigationItem = useUpdateNavigationItem();

  // Forms
  const navigationForm = useForm<NavigationFormData>({
    resolver: zodResolver(navigationSchema),
    defaultValues: {
      title: '',
      type: 'header',
      status: 'draft',
    },
  });

  const navigationItemForm = useForm<NavigationItemFormData>({
    resolver: zodResolver(navigationItemSchema),
    defaultValues: {
      type: 'page',
      title: '',
      open_in_new_tab: false,
      sort: 0,
    },
  });

  // Reset forms when editing changes
  React.useEffect(() => {
    if (editingNavigation) {
      navigationForm.reset({
        title: editingNavigation.title || '',
        type: editingNavigation.type,
        status: editingNavigation.status,
      });
    } else {
      navigationForm.reset({
        title: '',
        type: 'header',
        status: 'draft',
      });
    }
  }, [editingNavigation, navigationForm]);

  React.useEffect(() => {
    if (editingItem) {
      navigationItemForm.reset({
        type: editingItem.type,
        title: editingItem.translations?.[0]?.title || '',
        page: editingItem.page || '',
        url: editingItem.url || '',
        open_in_new_tab: editingItem.open_in_new_tab || false,
        icon: editingItem.icon || '',
        label: editingItem.label || '',
        sort: editingItem.sort || 0,
      });
    } else {
      navigationItemForm.reset({
        type: 'page',
        title: '',
        open_in_new_tab: false,
        sort: 0,
      });
    }
  }, [editingItem, navigationItemForm]);

  const handleNavigationSubmit = async (data: NavigationFormData) => {
    try {
      const navigationData = {
        ...data,
        site_id: siteId,
      };

      if (editingNavigation) {
        await updateNavigation.mutateAsync({
          id: editingNavigation.id,
          navigationData,
        });
      } else {
        await createNavigation.mutateAsync(navigationData);
      }

      setEditingNavigation(null);
      setActiveTab('list');
      navigationForm.reset();
    } catch (error) {
      console.error('Failed to save navigation:', error);
    }
  };

  const handleNavigationItemSubmit = async (data: NavigationItemFormData) => {
    if (!selectedNavForItems) return;

    try {
      const itemData: NavigationItemPayload = {
        ...data,
        navigation: selectedNavForItems.id,
        translations: [
          {
            languages_code: 'en-US',
            title: data.title,
          },
        ],
      };

      if (editingItem) {
        await updateNavigationItem.mutateAsync({
          id: editingItem.id,
          itemData: itemData as any,
        });
      } else {
        await createNavigationItem.mutateAsync(itemData as any);
      }

      setEditingItem(null);
      navigationItemForm.reset();
    } catch (error) {
      console.error('Failed to save navigation item:', error);
    }
  };

  const handleDeleteNavigation = async (navigation: Navigation) => {
    if (confirm(`Are you sure you want to delete "${navigation.title}"?`)) {
      try {
        await deleteNavigation.mutateAsync(navigation.id);
      } catch (error) {
        console.error('Failed to delete navigation:', error);
      }
    }
  };

  const handleNavigationClick = (navigation: Navigation) => {
    if (onNavigationSelect) {
      onNavigationSelect(navigation);
    }
    onClose();
  };

  const handleManageItems = (navigation: Navigation) => {
    setSelectedNavForItems(navigation);
    setActiveTab('items');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-content-primary';
      case 'archived': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-content-primary';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'header': return 'lucide:menu';
      case 'footer': return 'lucide:footer';
      case 'custom': return 'lucide:settings';
      default: return 'lucide:menu';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Icon icon="lucide:navigation" className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-content-primary">Navigation Manager</h2>
                  <p className="text-sm text-content-tertiary">Manage site navigation menus</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Icon icon="lucide:x" className="w-5 h-5 text-content-tertiary" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('list')}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'list'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-content-tertiary hover:text-content-primary'
                }`}
              >
                <Icon icon="lucide:list" className="w-4 h-4 inline mr-2" />
                Navigations
              </button>
              <button
                onClick={() => setActiveTab('form')}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'form'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-content-tertiary hover:text-content-primary'
                }`}
              >
                <Icon icon="lucide:plus" className="w-4 h-4 inline mr-2" />
                {editingNavigation ? 'Edit' : 'Create'}
              </button>
              {selectedNavForItems && (
                <button
                  onClick={() => setActiveTab('items')}
                  className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'items'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-content-tertiary hover:text-content-primary'
                  }`}
                >
                  <Icon icon="lucide:menu" className="w-4 h-4 inline mr-2" />
                  Items
                </button>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'list' && (
                <div className="h-full overflow-y-auto p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-content-primary">Navigation Menus</h3>
                    <Button
                      onClick={() => {
                        setEditingNavigation(null);
                        setActiveTab('form');
                      }}
                      className="gradient-primary"
                    >
                      <Icon icon="lucide:plus" className="w-4 h-4 mr-2" />
                      New Navigation
                    </Button>
                  </div>

                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : navigations.length === 0 ? (
                    <div className="text-center py-12">
                      <Icon icon="lucide:navigation" className="w-16 h-16 text-content-tertiary mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-content-primary mb-2">No Navigations</h4>
                      <p className="text-content-tertiary mb-6">Create your first navigation menu</p>
                      <Button
                        onClick={() => {
                          setEditingNavigation(null);
                          setActiveTab('form');
                        }}
                        className="gradient-primary"
                      >
                        <Icon icon="lucide:plus" className="w-4 h-4 mr-2" />
                        Create Navigation
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {navigations.map((navigation: any) => (
                        <motion.div
                          key={navigation.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                <Icon icon={getTypeIcon(navigation.type)} className="w-5 h-5 text-content-secondary" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-content-primary">
                                  {navigation.title || `${navigation.type} Navigation`}
                                </h4>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(navigation.status)}`}>
                                    {navigation.status}
                                  </span>
                                  <span className="text-xs text-content-tertiary capitalize">
                                    {navigation.type}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleManageItems(navigation as Navigation)}
                                className="p-2 text-content-tertiary hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Manage Items"
                              >
                                <Icon icon="lucide:menu" className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingNavigation(navigation as Navigation);
                                  setActiveTab('form');
                                }}
                                className="p-2 text-content-tertiary hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Icon icon="lucide:edit" className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteNavigation(navigation as Navigation)}
                                className="p-2 text-content-tertiary hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Icon icon="lucide:trash-2" className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleNavigationClick(navigation as Navigation)}
                                className="p-2 text-content-tertiary hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Select"
                              >
                                <Icon icon="lucide:check" className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'form' && (
                <div className="h-full overflow-y-auto p-6">
                  <div className="max-w-md mx-auto">
                    <h3 className="text-lg font-semibold text-content-primary mb-6">
                      {editingNavigation ? 'Edit Navigation' : 'Create New Navigation'}
                    </h3>

                    <form onSubmit={navigationForm.handleSubmit(handleNavigationSubmit)} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-content-primary mb-2">
                          Title
                        </label>
                        <Input
                          {...navigationForm.register('title')}
                          placeholder="Navigation title"
                          error={navigationForm.formState.errors.title?.message}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-content-primary mb-2">
                          Type
                        </label>
                        <select
                          {...navigationForm.register('type')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="header">Header</option>
                          <option value="footer">Footer</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-content-primary mb-2">
                          Status
                        </label>
                        <select
                          {...navigationForm.register('status')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>

                      <div className="flex space-x-3 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setEditingNavigation(null);
                            setActiveTab('list');
                          }}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          className="flex-1 gradient-primary"
                          loading={createNavigation.isPending || updateNavigation.isPending}
                        >
                          {editingNavigation ? 'Update' : 'Create'}
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {activeTab === 'items' && selectedNavForItems && (
                <div className="h-full overflow-y-auto p-6">
                  <div className="max-w-md mx-auto">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-semibold text-content-primary">Navigation Items</h3>
                        <p className="text-sm text-content-tertiary">{selectedNavForItems.title}</p>
                      </div>
                      <Button
                        onClick={() => {
                          setEditingItem(null);
                        }}
                        className="gradient-primary"
                      >
                        <Icon icon="lucide:plus" className="w-4 h-4 mr-2" />
                        Add Item
                      </Button>
                    </div>

                    <form onSubmit={navigationItemForm.handleSubmit(handleNavigationItemSubmit)} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-content-primary mb-2">
                          Title
                        </label>
                        <Input
                          {...navigationItemForm.register('title')}
                          placeholder="Item title"
                          error={navigationItemForm.formState.errors.title?.message}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-content-primary mb-2">
                          Type
                        </label>
                        <select
                          {...navigationItemForm.register('type')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="page">Page</option>
                          <option value="url">URL</option>
                        </select>
                      </div>

                      {navigationItemForm.watch('type') === 'page' && (
                        <div>
                          <label className="block text-sm font-medium text-content-primary mb-2">
                            Page
                          </label>
                          <select
                            {...navigationItemForm.register('page')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select a page</option>
                            {pages.map((page: any) => (
                              <option key={page.id} value={page.id}>
                                {page.translations?.[0]?.title || `Page ${page.id}`}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {navigationItemForm.watch('type') === 'url' && (
                        <div>
                          <label className="block text-sm font-medium text-content-primary mb-2">
                            URL
                          </label>
                          <Input
                            {...navigationItemForm.register('url')}
                            placeholder="https://example.com"
                            error={navigationItemForm.formState.errors.url?.message}
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-content-primary mb-2">
                          Icon
                        </label>
                        <Input
                          {...navigationItemForm.register('icon')}
                          placeholder="lucide:home"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-content-primary mb-2">
                          Label
                        </label>
                        <Input
                          {...navigationItemForm.register('label')}
                          placeholder="Optional label"
                        />
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          {...navigationItemForm.register('open_in_new_tab')}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label className="ml-2 text-sm text-content-primary">
                          Open in new tab
                        </label>
                      </div>

                      <div className="flex space-x-3 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setEditingItem(null);
                            setSelectedNavForItems(null);
                            setActiveTab('list');
                          }}
                          className="flex-1"
                        >
                          Back
                        </Button>
                        <Button
                          type="submit"
                          className="flex-1 gradient-primary"
                          loading={createNavigationItem.isPending || updateNavigationItem.isPending}
                        >
                          {editingItem ? 'Update' : 'Create'}
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
