'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { COLLECTIONS } from '@/types/collections';
import { getCollectionInfo, getAllGroups } from '@/lib/collection-metadata';

function DashboardContent() {
  const router = useRouter();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const allGroups = getAllGroups();
  const groups = allGroups.filter(group => group !== 'blocks');
  
  // Filter out block collections as they will be managed within events
  const visibleCollections = COLLECTIONS.filter(col => {
    const info = getCollectionInfo(col);
    return info.group !== 'blocks';
  });
  
  const collections = selectedGroup 
    ? visibleCollections.filter(col => getCollectionInfo(col).group === selectedGroup)
    : visibleCollections;

  const handleCollectionClick = (collection: string) => {
    // Events has its own dedicated page
    if (collection === 'events') {
      router.push('/events');
    } else {
      router.push(`/collections/${collection}`);
    }
  };

  return (
    <>
      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Welcome to NEXPO Collections Dashboard
              </h2>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Total Collections</p>
                      <p className="text-2xl font-bold">{COLLECTIONS.length}</p>
                    </div>
                    <Icon icon="mdi:database" className="w-8 h-8 text-blue-200" />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Groups</p>
                      <p className="text-2xl font-bold">{groups.length}</p>
                    </div>
                    <Icon icon="mdi:folder-multiple" className="w-8 h-8 text-green-200" />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">Content Collections</p>
                      <p className="text-2xl font-bold">{visibleCollections.filter(c => getCollectionInfo(c).group === 'content').length}</p>
                    </div>
                    <Icon icon="mdi:file-document" className="w-8 h-8 text-purple-200" />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm">Page Collections</p>
                      <p className="text-2xl font-bold">{visibleCollections.filter(c => getCollectionInfo(c).group === 'pages').length}</p>
                    </div>
                    <Icon icon="mdi:web" className="w-8 h-8 text-orange-200" />
                  </div>
                </motion.div>
              </div>

              {/* Group Filter */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Filter by Group</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedGroup(null)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      !selectedGroup 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    All Collections
                  </button>
                  {groups.map(group => (
                    <button
                      key={group}
                      onClick={() => setSelectedGroup(group)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                        selectedGroup === group 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {group}
                    </button>
                  ))}
                </div>
              </div>

              {/* Info Note about Block Collections */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Icon icon="mdi:information" className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-800 mb-1">Block Collections</h4>
                    <p className="text-sm text-blue-700">
                      Block collections (buttons, forms, galleries, etc.) are managed within the Events creation and editing flow, 
                      not as standalone collections. They will be available when creating or editing events.
                    </p>
                  </div>
                </div>
              </div>

              {/* Collections Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {collections.map((collection, index) => {
                  const info = getCollectionInfo(collection);
                  return (
                    <motion.button
                      key={collection}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleCollectionClick(collection)}
                      className="bg-white border border-gray-300 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all duration-200 text-left"
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        {info.icon && (
                          <Icon 
                            icon={info.icon} 
                            className="w-6 h-6"
                            style={{ color: info.color }}
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">
                            {info.displayName}
                          </h4>
                          {info.group && (
                            <span className="text-xs text-gray-500 capitalize">
                              {info.group}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {info.description && (
                        <p className="text-xs text-gray-600 mb-2">
                          {info.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className={`px-2 py-1 rounded ${
                          info.isSingleton ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {info.isSingleton ? 'Singleton' : 'Multiple'}
                        </span>
                        {info.hasArchive && (
                          <span className="px-2 py-1 rounded bg-green-100 text-green-700">
                            Archived
                          </span>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
