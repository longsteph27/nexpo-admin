import { siteApi } from '@/lib/api';
import type { ApiResponse } from '@/lib/api';

// Re-export pages-related API functions from siteApi
export const pagesApi = {
  createPage: siteApi.createPage,
  getPagesBySite: siteApi.getPagesBySite,
  getPage: siteApi.getPage,
  updatePage: siteApi.updatePage,
  updatePageBlocks: siteApi.updatePageBlocks,
  getBlocksByPage: siteApi.getBlocksByPage,
  upsertPageBlock: siteApi.upsertPageBlock,
} as const;

export type { ApiResponse };


