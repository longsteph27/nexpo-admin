'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Block } from '../types';

interface UsePageBuilderBlocksProps {
  pageBlocks?: any[];
}

export function usePageBuilderBlocks({ pageBlocks }: UsePageBuilderBlocksProps) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isLoadingBlocks, setIsLoadingBlocks] = useState(false);

  // Load blocks when page data is fetched
  useEffect(() => {
    if (pageBlocks) {
      setIsLoadingBlocks(true);
      console.log('[usePageBuilderBlocks] Blocks from server:', pageBlocks.map(b => ({ id: b.id, collection: b.collection })));

      // Simulate loading time for better UX
      setTimeout(() => {
        const sortedBlocks = pageBlocks
          .filter((block: any) => !block.hide_block)
          .sort((a: any, b: any) => a.sort - b.sort)
          .map((block: any) => ({
            id: String(block.id),
            collection: block.collection,
            sort: block.sort,
            item: block.item,
          }));

        setBlocks(sortedBlocks);
        setIsLoadingBlocks(false);
      }, 500);
    }
  }, [pageBlocks]);

  const addBlock = useCallback((block: Block, index?: number) => {
    setBlocks(prevBlocks => {
      const newBlocks = [...prevBlocks];
      const insertIndex = index ?? prevBlocks.length;
      newBlocks.splice(insertIndex, 0, block);
      return newBlocks.map((b, i) => ({ ...b, sort: i }));
    });
  }, []);

  const updateBlock = useCallback((blockId: string, updatedData: any) => {
    setBlocks(prevBlocks =>
      prevBlocks.map(block =>
        block.id === blockId
          ? { ...block, item: updatedData }
          : block
      )
    );
  }, []);

  const replaceBlock = useCallback((blockId: string, updatedBlock: Block) => {
    console.log('[replaceBlock] Called with:', { blockId, updatedBlock });
    setBlocks(prevBlocks => {
      console.log('[replaceBlock] Previous blocks:', prevBlocks);
      const existingIndex = prevBlocks.findIndex(b => String(b.id) === blockId);

      if (existingIndex === -1) {
        // Block not found, shouldn't happen but safety check
        console.error('[replaceBlock] Block not found for replace:', blockId);
        return prevBlocks;
      }

      console.log('[replaceBlock] Found block at index:', existingIndex);
      console.log('[replaceBlock] Old block:', prevBlocks[existingIndex]);
      console.log('[replaceBlock] New block:', updatedBlock);

      const newBlocks = [...prevBlocks];
      newBlocks[existingIndex] = updatedBlock;

      console.log('[replaceBlock] New blocks array:', newBlocks);
      return newBlocks;
    });
  }, []);

  const deleteBlock = useCallback((index: number) => {
    setBlocks(prevBlocks =>
      prevBlocks.filter((_, i) => i !== index).map((b, i) => ({ ...b, sort: i }))
    );
  }, []);

  const moveBlock = useCallback((index: number, direction: 'up' | 'down') => {
    setBlocks(prevBlocks => {
      const newBlocks = [...prevBlocks];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;

      if (targetIndex < 0 || targetIndex >= newBlocks.length) {
        return prevBlocks;
      }

      [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
      return newBlocks.map((b, i) => ({ ...b, sort: i }));
    });
  }, []);

  const insertBlockAt = useCallback((block: Block, index: number) => {
    setBlocks(prevBlocks => {
      const newBlocks = [...prevBlocks];
      newBlocks.splice(index, 0, block);
      return newBlocks.map((b, i) => ({ ...b, sort: i }));
    });
  }, []);

  const reorderBlocks = useCallback((oldIndex: number, newIndex: number) => {
    setBlocks(prevBlocks => {
      const newBlocks = [...prevBlocks];
      const [movedBlock] = newBlocks.splice(oldIndex, 1);
      newBlocks.splice(newIndex, 0, movedBlock);
      return newBlocks.map((b, i) => ({ ...b, sort: i }));
    });
  }, []);

  return {
    blocks,
    isLoadingBlocks,
    setBlocks,
    addBlock,
    updateBlock,
    replaceBlock,
    deleteBlock,
    moveBlock,
    insertBlockAt,
    reorderBlocks,
  };
}


