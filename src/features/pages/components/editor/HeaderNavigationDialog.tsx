'use client';

import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button-base';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { navigationApi, siteApi } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ChildItemsDialog from './ChildItemsDialog';

interface NavigationItem {
  id?: string;
  type: 'page' | 'url';
  url?: string;
  page?: any;
  sort: number;
  open_in_new_tab?: boolean;
  icon?: string;
  label?: string;
  has_children?: boolean;
  children?: NavigationItem[];
  parent?: string | null;
  translations: Array<{
    languages_code: string;
    title: string;
  }>;
}

interface HeaderNavigationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  siteId: number;
  headerNavigation: any;
  activeLang: 'en-US' | 'vi-VN';
  onUpdate?: () => void;
  onSaveChanges?: (items: NavigationItem[], preparedData?: { navigationId: string | null; siteId: number; headerNavigation: any; payload: any }) => void; // Callback to save changes to parent component without API call
}

// Common icon options for navigation
const ICON_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'lucide:home', label: 'Home' },
  { value: 'lucide:info', label: 'Info' },
  { value: 'lucide:mail', label: 'Mail' },
  { value: 'lucide:phone', label: 'Phone' },
  { value: 'lucide:users', label: 'Users' },
  { value: 'lucide:settings', label: 'Settings' },
  { value: 'lucide:file-text', label: 'File' },
  { value: 'lucide:image', label: 'Image' },
  { value: 'lucide:video', label: 'Video' },
  { value: 'lucide:link', label: 'Link' },
  { value: 'lucide:external-link', label: 'External Link' },
  { value: 'lucide:download', label: 'Download' },
  { value: 'lucide:upload', label: 'Upload' },
  { value: 'lucide:search', label: 'Search' },
  { value: 'lucide:heart', label: 'Heart' },
  { value: 'lucide:star', label: 'Star' },
  { value: 'lucide:bell', label: 'Bell' },
  { value: 'lucide:menu', label: 'Menu' },
  { value: 'lucide:shopping-cart', label: 'Shopping Cart' },
];

export default function HeaderNavigationDialog({
  isOpen,
  onClose,
  siteId,
  headerNavigation,
  activeLang,
  onUpdate,
  onSaveChanges
}: HeaderNavigationDialogProps) {
  const queryClient = useQueryClient();
  const [items, setItems] = useState<NavigationItem[]>([]);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [itemEditLang, setItemEditLang] = useState<Record<string, 'en-US' | 'vi-VN'>>({});
  const [showIconPicker, setShowIconPicker] = useState<Record<string, boolean>>({});
  const [childItemsDialog, setChildItemsDialog] = useState<{
    isOpen: boolean;
    parentItemId: string;
    parentItemPath: number[];
    children: NavigationItem[];
  } | null>(null);

  // Fetch pages for site
  const { data: pagesData } = useQuery({
    queryKey: ['site-pages', siteId],
    queryFn: async () => {
      const result = await siteApi.getPagesBySite(siteId);
      return result.success ? result.data : [];
    },
    enabled: isOpen && !!siteId,
  });

  // Initialize items from headerNavigation
  useEffect(() => {
    if (headerNavigation?.items && Array.isArray(headerNavigation.items)) {
      // Build hierarchical structure from flat items
      const buildHierarchy = (itemsList: any[]): NavigationItem[] => {
        const itemMap = new Map();
        const rootItems: NavigationItem[] = [];

        // First pass: create all items
        itemsList.forEach((item: any) => {
          const navItem: NavigationItem = {
            id: item.id,
            type: item.type,
            url: item.url,
            page: item.page,
            sort: item.sort || 0,
            open_in_new_tab: item.open_in_new_tab || false,
            icon: item.icon || undefined,
            label: item.label || undefined,
            has_children: item.has_children || false,
            children: [],
            parent: item.parent || null,
            translations: item.translations || []
          };
          itemMap.set(item.id, navItem);
        });

        // Second pass: build hierarchy
        itemsList.forEach((item: any) => {
          const navItem = itemMap.get(item.id);
          if (!item.parent) {
            rootItems.push(navItem);
          } else {
            const parent = itemMap.get(item.parent);
            if (parent) {
              if (!parent.children) parent.children = [];
              parent.children.push(navItem);
              parent.has_children = true;
            }
          }
        });

        // Sort by sort field
        const sortItems = (items: NavigationItem[]) => {
          items.sort((a, b) => (a.sort || 0) - (b.sort || 0));
          items.forEach(item => {
            if (item.children) {
              sortItems(item.children);
            }
          });
        };
        sortItems(rootItems);

        return rootItems;
      };

      setItems(buildHierarchy(headerNavigation.items));
    } else {
      setItems([]);
    }
  }, [headerNavigation]);

  // Prepare navigation data for saving (without actual API call)
  // Returns prepared payload that can be saved later
  const prepareNavigationData = (itemsData: NavigationItem[]) => {
      // Flatten items including children for saving
      const flattenItems = (items: NavigationItem[], parentId: string | null = null, startSort = 0): { item: NavigationItem; sort: number; isNew: boolean }[] => {
        const result: { item: NavigationItem; sort: number; isNew: boolean }[] = [];
        items.forEach((item, i) => {
          const sort = startSort + i;
          const isNew = !item.id || item.id.startsWith('temp-');
          result.push({ item: { ...item, sort, parent: parentId }, sort, isNew });
          
          // Add children if has_children is true
          if (item.has_children && item.children && item.children.length > 0) {
            const parentItemId = isNew ? null : item.id; // Use null for new items, will be set after creation
            const children = flattenItems(item.children, parentItemId, sort + 1);
            result.push(...children);
          }
        });
        return result;
      };

      const flatItems = flattenItems(itemsData);
      
      // Prepare items data (without IDs for new items)
      const prepareItemData = (item: NavigationItem, sort: number, parentIdOverride?: string | null) => ({
        type: item.type,
        url: item.type === 'url' ? (item.url || null) : null,
        page: item.type === 'page' ? (item.page?.id || null) : null,
        sort,
        open_in_new_tab: item.type === 'url' ? (item.open_in_new_tab || false) : false,
        icon: item.icon || null,
        label: item.label || null,
        has_children: item.has_children || false,
        parent: parentIdOverride !== undefined ? parentIdOverride : (item.parent || null),
        translations: item.translations.map((t: any) => ({
          languages_code: t.languages_code,
          title: t.title
        }))
      });

      // Determine navigation ID (will be created/validated during actual save)
      const navigationId = headerNavigation?.id || null; // Will be created if null

      // Step 2: Prepare items for batch operations
      // Get existing item IDs from headerNavigation
      const existingItems = new Map<string, any>();
      if (headerNavigation?.items && Array.isArray(headerNavigation.items)) {
        // Flatten existing items to map
        const flattenExisting = (items: any[], parentId: string | null = null) => {
          items.forEach((item: any) => {
            if (item.id && !item.id.startsWith('temp-')) {
              existingItems.set(item.id, { ...item, parent: parentId });
            }
            if (item.children && Array.isArray(item.children)) {
              flattenExisting(item.children, item.id);
            }
          });
        };
        flattenExisting(headerNavigation.items);
      }

      // Separate items into create, update, delete
      const itemsToCreate: any[] = [];
      const itemsToUpdate: any[] = [];
      const itemsToDelete: string[] = [];
      
      // Track created items for parent relationships
      const createdItemsMap = new Map<string, string>(); // tempId -> actualId
      let currentSort = 0;

      // Separate root items and children for processing
      const rootItems: typeof flatItems = [];
      const childItems: typeof flatItems = [];
      
      flatItems.forEach((entry) => {
        if (!entry.item.parent || entry.item.parent.startsWith('temp-')) {
          rootItems.push(entry);
        } else {
          childItems.push(entry);
        }
      });

      // Process root items first
      rootItems.forEach(({ item, sort, isNew }) => {
        const itemData = prepareItemData(item, currentSort++, null);
        
        if (isNew) {
          itemsToCreate.push(itemData);
        } else if (item.id && existingItems.has(item.id)) {
          itemsToUpdate.push({
            id: item.id,
            ...itemData
          });
        }
      });

      // Process child items (after parents are created)
      childItems.forEach(({ item, sort, isNew }) => {
        let parentId = item.parent;
        if (parentId && parentId.startsWith('temp-')) {
          // Parent is also new - will be null initially, update after creation
          parentId = null; // Will be updated in second pass
        }
        
        const itemData = prepareItemData(item, currentSort++, parentId);
        
        if (isNew) {
          itemsToCreate.push(itemData);
        } else if (item.id && existingItems.has(item.id)) {
          itemsToUpdate.push({
            id: item.id,
            ...itemData
          });
        }
      });

      // Find items to delete (existing items not in current list)
      const currentItemIds = new Set(
        flatItems
          .map(({ item }) => item.id)
          .filter(id => id && !id?.startsWith('temp-')) as string[]
      );
      existingItems.forEach((_, id) => {
        if (!currentItemIds.has(id)) {
          itemsToDelete.push(id);
        }
      });

      // Step 3: Update navigation with items using Directus batch operations
      // Directus tự động link items với navigation, không cần navigation field trong create
      const updatePayload: any = {};
      
      if (itemsToCreate.length > 0 || itemsToUpdate.length > 0 || itemsToDelete.length > 0) {
        updatePayload.items = {};
        
        if (itemsToCreate.length > 0) {
          // Directus sẽ tự động tạo ID và link với navigation
          updatePayload.items.create = itemsToCreate;
        }
        
        if (itemsToUpdate.length > 0) {
          updatePayload.items.update = itemsToUpdate;
        }
        
        if (itemsToDelete.length > 0) {
          updatePayload.items.delete = itemsToDelete;
        }
        
      }

      // Return prepared payload for later saving
      return {
        navigationId,
        siteId,
        headerNavigation,
        payload: updatePayload
      };
    };

  // Create or update navigation (only if onSaveChanges is not provided)
  const saveNavigation = useMutation({
    mutationFn: async (data: { items: NavigationItem[] }) => {
      const prepared = prepareNavigationData(data.items);
      
      // Step 1: Create or get navigation ID
      let navigationId: string;
      if (prepared.navigationId) {
        navigationId = prepared.navigationId;
      } else {
        // Create new navigation first
        const navigationData: any = {
          type: 'header',
          site: prepared.siteId,
          status: 'published'
        };

        const result = await navigationApi.createNavigation(navigationData);
        if (!result.success) throw new Error(result.error as string);
        const createdData = result.data as any;
        navigationId = typeof createdData === 'string' ? createdData : (createdData?.id || createdData);
      }
      
      if (prepared.payload.items && Object.keys(prepared.payload.items).length > 0) {
        const updateResult = await navigationApi.updateNavigation(navigationId, prepared.payload);
        if (!updateResult.success) throw new Error(updateResult.error as string);
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['site-navigation', siteId] });
      
      return { success: true };
    },
    onSuccess: () => {
      toast.success('Header navigation saved successfully');
      onUpdate?.();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save header navigation');
    }
  });

  const addItem = () => {
    const newItem: NavigationItem = {
      id: `temp-${Date.now()}`,
      type: 'page',
      sort: items.length,
      has_children: false,
      children: [],
      parent: null,
      translations: [
        { languages_code: 'en-US', title: '' },
        { languages_code: 'vi-VN', title: '' }
      ]
    };
    setItems([...items, newItem]);
    setExpandedItem(newItem.id!);
  };

  const updateChildrenForItem = (parentItemId: string, parentItemPath: number[], newChildren: NavigationItem[]) => {
    const newItems = [...items];
    
    const updateItemChildren = (itemsList: NavigationItem[], path: number[]): NavigationItem[] => {
      if (path.length === 0) {
        return itemsList.map(item => {
          if (item.id === parentItemId) {
            return {
              ...item,
              has_children: newChildren.length > 0,
              children: newChildren.map((child, i) => ({ ...child, sort: i }))
            };
          }
          return item;
        });
      }
      
      return itemsList.map((item, index) => {
        if (index === path[0]) {
          if (path.length === 1 && item.id === parentItemId) {
            return {
              ...item,
              has_children: newChildren.length > 0,
              children: newChildren.map((child, i) => ({ ...child, sort: i }))
            };
          }
          if (item.children && path.length > 1) {
            return {
              ...item,
              children: updateItemChildren(item.children, path.slice(1))
            };
          }
        }
        return item;
      });
    };
    
    setItems(updateItemChildren(newItems, parentItemPath));
  };

  const updateItem = (index: number, field: string, value: any, lang?: 'en-US' | 'vi-VN', path?: number[]) => {
    const newItems = [...items];
    
    let targetItem: NavigationItem | undefined;
    if (path) {
      targetItem = getItemByPath(newItems, path);
    } else {
      targetItem = newItems[index];
    }
    
    if (!targetItem) return;
    
    const finalItemId = targetItem.id || `item-${index}`;
    
    if (field === 'title') {
      const editLang = lang || itemEditLang[finalItemId] || activeLang;
      const transIndex = targetItem.translations.findIndex(
        t => t.languages_code === editLang
      );
      if (transIndex >= 0) {
        targetItem.translations[transIndex].title = value;
      } else {
        targetItem.translations.push({
          languages_code: editLang,
          title: value
        });
      }
    } else if (field === 'has_children') {
      targetItem.has_children = value;
      if (!value) {
        targetItem.children = [];
      }
    } else {
      (targetItem as any)[field] = value;
    }
    
    setItems(newItems);
  };

  const getItemByPath = (itemsList: NavigationItem[], path: number[]): NavigationItem | undefined => {
    let current: NavigationItem | undefined = itemsList[path[0]];
    for (let i = 1; i < path.length; i++) {
      current = current?.children?.[path[i]];
    }
    return current;
  };

  const removeItem = (index: number, path?: number[]) => {
    if (path) {
      // Remove nested item
      const newItems = [...items];
      const parentPath = path.slice(0, -1);
      const childIndex = path[path.length - 1];
      
      if (parentPath.length === 0) {
        newItems.splice(childIndex, 1);
      } else {
        const parent = getItemByPath(newItems, parentPath);
        if (parent?.children) {
          parent.children.splice(childIndex, 1);
          if (parent.children.length === 0) {
            parent.has_children = false;
          }
        }
      }
      setItems(newItems);
    } else {
      setItems(items.filter((_, i) => i !== index));
    }
    setExpandedItem(null);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;
    
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    setItems(newItems.map((item, i) => ({ ...item, sort: i })));
  };

  const getItemEditLang = (item: NavigationItem, index: number) => {
    const itemId = item.id || `item-${index}`;
    return itemEditLang[itemId] || activeLang;
  };

  const setItemEditLangForItem = (itemId: string, lang: 'en-US' | 'vi-VN') => {
    setItemEditLang((prev) => ({ ...prev, [itemId]: lang }));
  };

  const currentTitle = (item: NavigationItem, index: number) => {
    const editLang = getItemEditLang(item, index);
    return item.translations.find(t => t.languages_code === editLang)?.title || '';
  };

  const handleSave = () => {
    // If onSaveChanges callback is provided, use it (defer save to PageBuilder)
    // Otherwise, save immediately (backward compatibility)
    if (onSaveChanges) {
      const prepared = prepareNavigationData(items);
      onSaveChanges(items, prepared);
      onClose();
    } else {
      saveNavigation.mutate({ items });
    }
  };

  const renderItemForm = (item: NavigationItem, index: number, path: number[] = []) => {
    const itemId = item.id || `item-${index}`;
    
    return (
      <div key={itemId} className="border border-neutral-200 rounded-lg overflow-hidden">
        {/* Item Header */}
        <div
          className="flex items-center justify-between px-4 py-3 bg-neutral-50 cursor-pointer hover:bg-neutral-100 transition-colors"
          onClick={() => setExpandedItem(expandedItem === itemId ? null : itemId)}
        >
          <div className="flex items-center space-x-3 flex-1">
            <div className="flex items-center space-x-2">
              {path.length > 0 && <div className="w-4 h-4 border-l-2 border-neutral-300" />}
              <Icon icon="lucide:grip-vertical" className="w-4 h-4 text-neutral-400" />
            </div>
            {item.icon && (
              <Icon icon={item.icon} className="w-4 h-4 text-neutral-600" />
            )}
            <span className="text-sm font-medium text-neutral-900">
              {currentTitle(item, index) || `Item ${index + 1}`}
            </span>
            {item.type === 'url' && (
              <span className="text-xs text-neutral-500">{item.url}</span>
            )}
            {item.type === 'page' && item.page && (
              <span className="text-xs text-neutral-500">
                ({pagesData?.find((p: any) => p.id === item.page?.id)?.translations?.find((t: any) => t.languages_code === activeLang)?.title || 'Page'})
              </span>
            )}
            {item.has_children && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                {item.children?.length || 0} children
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {index > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  moveItem(index, 'up');
                }}
                className="p-1 hover:bg-neutral-200 rounded"
              >
                <Icon icon="lucide:chevron-up" className="w-4 h-4" />
              </button>
            )}
            {index < (path.length === 0 ? items.length : (getItemByPath(items, path.slice(0, -1))?.children?.length || 0)) - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  moveItem(index, 'down');
                }}
                className="p-1 hover:bg-neutral-200 rounded"
              >
                <Icon icon="lucide:chevron-down" className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeItem(index, path);
              }}
              className="p-1 hover:bg-red-100 text-red-600 rounded"
            >
              <Icon icon="lucide:trash-2" className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Item Form */}
        {expandedItem === itemId && (
          <div className="p-4 space-y-4 bg-white">
            {/* Type Selection */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Type <span className="text-red-500">*</span>
              </label>
              <Select
                value={item.type}
                onValueChange={(value) => updateItem(index, 'type', value, undefined, path)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="page">Page</SelectItem>
                  <SelectItem value="url">URL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Page Selection - Only show when type is 'page' */}
            {item.type === 'page' && pagesData && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Select Page
                </label>
                <Select
                  value={item.page?.id || ''}
                  onValueChange={(value) => {
                    const selectedPage = pagesData.find((p: any) => p.id === value);
                    updateItem(index, 'page', selectedPage || null, undefined, path);
                    if (selectedPage) {
                      const editLang = getItemEditLang(item, index);
                      const pageTitle = selectedPage.translations?.find((t: any) => t.languages_code === editLang)?.title || 
                                       selectedPage.translations?.[0]?.title || '';
                      if (!currentTitle(item, index)) {
                        updateItem(index, 'title', pageTitle, editLang, path);
                      }
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="-- Select a page --" />
                  </SelectTrigger>
                  <SelectContent>
                    {pagesData.map((page: any) => {
                      const pageTitle = page.translations?.find((t: any) => t.languages_code === activeLang)?.title || 
                                       page.translations?.[0]?.title || 'Untitled';
                      return (
                        <SelectItem key={page.id} value={page.id}>
                          {pageTitle}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* URL Input - Only show when type is 'url' */}
            {item.type === 'url' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    URL <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={item.url || ''}
                    onChange={(e) => updateItem(index, 'url', e.target.value, undefined, path)}
                    placeholder="https://example.com"
                    className="w-full"
                  />
                </div>

                {/* Open in new tab - Only show when type is 'url' */}
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={item.open_in_new_tab || false}
                      onChange={(e) => updateItem(index, 'open_in_new_tab', e.target.checked, undefined, path)}
                      className="w-4 h-4 text-blue-600 border-neutral-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-neutral-700">Open in new tab</span>
                  </label>
                </div>
              </>
            )}

            {/* Title with Language Switcher */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-neutral-700">
                  Title <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center space-x-1 bg-neutral-100 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => setItemEditLangForItem(itemId, 'en-US')}
                    className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                      getItemEditLang(item, index) === 'en-US'
                        ? 'bg-white text-neutral-900 shadow-sm'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    onClick={() => setItemEditLangForItem(itemId, 'vi-VN')}
                    className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                      getItemEditLang(item, index) === 'vi-VN'
                        ? 'bg-white text-neutral-900 shadow-sm'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    VI
                  </button>
                </div>
              </div>
              <Input
                value={currentTitle(item, index)}
                onChange={(e) => {
                  const editLang = getItemEditLang(item, index);
                  updateItem(index, 'title', e.target.value, editLang, path);
                }}
                placeholder={`Enter title (${getItemEditLang(item, index) === 'en-US' ? 'English' : 'Vietnamese'})`}
                className="w-full"
              />
            </div>

            {/* Icon Selector */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Icon
              </label>
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Input
                    value={item.icon || ''}
                    onChange={(e) => updateItem(index, 'icon', e.target.value, undefined, path)}
                    placeholder="e.g., lucide:home"
                    className="w-full pr-10"
                  />
                  {item.icon && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Icon icon={item.icon} className="w-5 h-5 text-neutral-600" />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowIconPicker({ ...showIconPicker, [itemId]: !showIconPicker[itemId] })}
                  className="px-3 py-2 border border-neutral-300 rounded-md hover:bg-neutral-50 text-sm"
                >
                  <Icon icon="lucide:grid" className="w-4 h-4" />
                </button>
              </div>
              {showIconPicker[itemId] && (
                <div className="mt-2 p-3 border border-neutral-200 rounded-lg bg-neutral-50 max-h-48 overflow-y-auto">
                  <div className="grid grid-cols-4 gap-2">
                    {ICON_OPTIONS.map((icon) => (
                      <button
                        key={icon.value}
                        type="button"
                        onClick={() => {
                          updateItem(index, 'icon', icon.value, undefined, path);
                          setShowIconPicker({ ...showIconPicker, [itemId]: false });
                        }}
                        className={`p-2 rounded border-2 transition-colors ${
                          item.icon === icon.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-neutral-200 hover:border-blue-300'
                        }`}
                        title={icon.label}
                      >
                        {icon.value ? (
                          <Icon icon={icon.value} className="w-5 h-5 mx-auto text-neutral-700" />
                        ) : (
                          <span className="text-xs text-neutral-400">None</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Label (Multiline Text) */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Label
              </label>
              <textarea
                value={item.label || ''}
                onChange={(e) => updateItem(index, 'label', e.target.value, undefined, path)}
                placeholder="Label to help users. Displays below the link in dropdown nav menus."
                rows={3}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              />
              <p className="mt-1 text-xs text-neutral-500">
                Label to help users. Displays below the link in dropdown nav menus.
              </p>
            </div>

            {/* Has Children Checkbox */}
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={item.has_children || false}
                  onChange={(e) => updateItem(index, 'has_children', e.target.checked, undefined, path)}
                  className="w-4 h-4 text-blue-600 border-neutral-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-neutral-700">Has children (dropdown menu)</span>
              </label>
            </div>

            {/* Children Items - Only show when has_children is true */}
            {item.has_children && (
              <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-neutral-700">
                    Child Items ({item.children?.length || 0})
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setChildItemsDialog({
                        isOpen: true,
                        parentItemId: itemId,
                        parentItemPath: path,
                        children: item.children || []
                      });
                    }}
                    className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center space-x-1.5"
                  >
                    <Icon icon="lucide:plus" className="w-3.5 h-3.5" />
                    <span>Manage Children</span>
                  </button>
                </div>
                {item.children && item.children.length > 0 ? (
                  <div className="space-y-1">
                    {item.children.slice(0, 3).map((child, childIndex) => (
                      <div key={child.id || childIndex} className="flex items-center space-x-2 px-2 py-1.5 bg-white rounded border border-neutral-200">
                        {child.icon && (
                          <Icon icon={child.icon} className="w-3.5 h-3.5 text-neutral-600" />
                        )}
                        <span className="text-xs text-neutral-700 flex-1 truncate">
                          {child.translations?.find((t: any) => t.languages_code === activeLang)?.title || 
                           child.translations?.[0]?.title || 
                           `Child ${childIndex + 1}`}
                        </span>
                        <span className="text-xs text-neutral-500">
                          {child.type === 'page' ? 'Page' : 'URL'}
                        </span>
                      </div>
                    ))}
                    {item.children.length > 3 && (
                      <p className="text-xs text-neutral-500 text-center py-1">
                        +{item.children.length - 3} more items
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-500 text-center py-4">
                    No child items. Click &quot;Manage Children&quot; to add nested menu items.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b border-neutral-200">
          <DialogTitle className="flex items-center space-x-3">
            <Icon icon="lucide:menu" className="w-5 h-5 text-neutral-700" />
            <span>Edit Header Navigation</span>
          </DialogTitle>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-3">
            {items.map((item, index) => renderItemForm(item, index, [index]))}

            {items.length === 0 && (
              <div className="text-center py-8 text-neutral-500">
                <Icon icon="lucide:menu" className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No navigation items yet</p>
              </div>
            )}
          </div>

          <button
            onClick={() => addItem()}
            className="mt-4 w-full flex items-center justify-center space-x-2 px-4 py-2 border-2 border-dashed border-neutral-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-sm font-medium text-neutral-700"
          >
            <Icon icon="lucide:plus" className="w-4 h-4" />
            <span>Add Navigation Item</span>
          </button>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t border-neutral-200">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saveNavigation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleSave}
            disabled={saveNavigation.isPending}
          >
            {saveNavigation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Save & Apply'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Child Items Dialog */}
      {childItemsDialog && (
        <ChildItemsDialog
          isOpen={childItemsDialog.isOpen}
          onClose={() => setChildItemsDialog(null)}
          items={childItemsDialog.children}
          pagesData={pagesData}
          activeLang={activeLang}
          onSave={(newItems) => {
            updateChildrenForItem(
              childItemsDialog.parentItemId,
              childItemsDialog.parentItemPath,
              newItems
            );
            setChildItemsDialog(null);
          }}
        />
      )}
    </Dialog>
  );
}
