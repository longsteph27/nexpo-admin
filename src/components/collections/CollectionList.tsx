'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { collectionsAPI } from '@/lib/collections-api';
import { CollectionName, CollectionItem, CollectionInfo } from '@/types/collections';
// import CollectionForm from './CollectionForm';
// import CollectionItemModal from './CollectionItemModal';

interface CollectionListProps {
  collection: CollectionName;
  collectionInfo: CollectionInfo;
}

export default function CollectionList({ collection, collectionInfo }: CollectionListProps) {
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CollectionItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Special handling for events collection
      if (collection === 'events') {
        const response = await collectionsAPI.getCollectionItems(collection, {
          limit: itemsPerPage,
          page: currentPage,
          fields: ['id', 'name', 'description', 'start_date', 'end_date', 'location', 'status'],
          sort: ['sort'],
          filter: {
            status: { _neq: 'archived' }
          },
          search: searchTerm || undefined,
        });
        
        // Handle nested data structure: response.data.data contains the actual items
        const itemsData = (response.data as { data?: CollectionItem[] })?.data || response.data || [];
        setItems(Array.isArray(itemsData) ? itemsData : []);
        setTotalCount(response.meta?.total_count || 0);
      } else {
        const response = await collectionsAPI.getCollectionItems(collection, {
          limit: itemsPerPage,
          offset: (currentPage - 1) * itemsPerPage,
          search: searchTerm || undefined,
        });
        
        // Handle nested data structure: response.data.data contains the actual items
        const itemsData = (response.data as { data?: CollectionItem[] })?.data || response.data || [];
        setItems(Array.isArray(itemsData) ? itemsData : []);
        setTotalCount(response.meta?.total_count || 0);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || 'Failed to fetch items');
    } finally {
      setLoading(false);
    }
  }, [collection, currentPage, searchTerm]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleCreate = async (data: Record<string, unknown>) => {
    try {
      await collectionsAPI.createItem(collection, data);
      setShowCreateForm(false);
      fetchItems();
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || 'Failed to create item');
    }
  };

  const handleUpdate = async (id: string | number, data: Record<string, unknown>) => {
    try {
      await collectionsAPI.updateItem(collection, id, data);
      setSelectedItem(null);
      fetchItems();
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || 'Failed to update item');
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      await collectionsAPI.deleteItem(collection, id);
      fetchItems();
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || 'Failed to delete item');
    }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Icon icon="mdi:loading" className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {collectionInfo.icon && (
              <Icon 
                icon={collectionInfo.icon} 
                className="w-6 h-6"
                style={{ color: collectionInfo.color }}
              />
            )}
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {collectionInfo.displayName}
              </h2>
              {collectionInfo.description && (
                <p className="text-sm text-gray-500">{collectionInfo.description}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Icon icon="mdi:plus" className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="relative">
          <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="px-6 py-4 bg-red-50 border-b border-red-200">
          <div className="flex items-center space-x-2 text-red-600">
            <Icon icon="mdi:alert-circle" className="w-4 h-4" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Items List */}
      <div className="divide-y divide-gray-200">
        {items.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            <Icon icon="mdi:database-off" className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No items found</p>
            {searchTerm && (
              <p className="text-sm mt-2">Try adjusting your search terms</p>
            )}
          </div>
        ) : (
          Array.isArray(items) && items.map((item, index) => (
            <motion.div
              key={item.id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">
                        {item.title || item.name || item.id || `Item ${index + 1}`}
                      </h3>
                      {item.description && (
                        <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                        {item.created_at && (
                          <span>Created: {new Date(item.created_at).toLocaleDateString()}</span>
                        )}
                        {item.updated_at && (
                          <span>Updated: {new Date(item.updated_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedItem(item)}
                    className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                    title="View/Edit"
                  >
                    <Icon icon="mdi:eye" className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id!)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Icon icon="mdi:delete" className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} items
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Form Modal */}
      {/* {showCreateForm && (
        <CollectionForm
          collection={collection}
          collectionInfo={collectionInfo}
          onSubmit={handleCreate}
          onClose={() => setShowCreateForm(false)}
        />
      )} */}

      {/* Edit Modal */}
      {/* {selectedItem && (
        <CollectionItemModal
          collection={collection}
          collectionInfo={collectionInfo}
          item={selectedItem}
          onUpdate={handleUpdate}
          onClose={() => setSelectedItem(null)}
        />
      )} */}
    </div>
  );
}
