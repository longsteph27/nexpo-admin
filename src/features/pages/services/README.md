# Page Payload Manager Service

Service để quản lý payload tạm thời cho Pages với cơ chế tự động track changes và build payload theo cấu trúc create/update/delete của Directus.

## Mục đích

- **Tự động track changes**: Mọi thay đổi được track tự động, không cần logic phức tạp
- **Chỉ thêm thay đổi thực sự**: Chỉ thêm vào payload khi có thay đổi thực sự so với original data
- **Dễ sử dụng**: API đơn giản, dễ thêm mới, cập nhật, xóa
- **Type-safe**: Sử dụng types từ `directus-collections.ts`

## Cấu trúc

### Fields có cơ chế create/update/delete:
- `translations` (PageTranslationPayload) - với `create`, `update`, `delete`
- `blocks` (PageBlocksPayload) - với `create`, `update`, `delete`

### Fields bình thường (direct update):
- `sort`, `status`, `site_id` - cập nhật trực tiếp

## Sử dụng

### 1. Khởi tạo trong Component

```typescript
import { usePagePayloadManager } from '@/features/pages/hooks/usePagePayloadManager';

const {
  updateTranslationPermalink,
  updateField,
  upsertBlock,
  removeBlock,
  rebuildBlocks,
  getPayload,
  hasChanges,
  reset,
} = usePagePayloadManager({
  page: pageData,
  eventId: Number(eventId),
  tenantId: selectedTenant?.id,
});
```

### 2. Update Translation Permalink

```typescript
// Khi user edit permalink
updateTranslationPermalink('en-US', '/new-permalink', 'Page Title');
```

### 3. Update Direct Fields

```typescript
// Update sort, status, site_id
updateField('sort', 5);
updateField('status', 'published');
updateField('site_id', siteId);
```

### 4. Track Block Changes

**Automatic (Recommended):**
```typescript
// Blocks payload tự động rebuild khi blocks state thay đổi
// Sử dụng useEffect trong PageBuilder để rebuild
useEffect(() => {
  if (page && blocks) {
    rebuildBlocks(blocks);
  }
}, [blocks, page?.id]);
```

**Manual:**
```typescript
// Thêm/update block
upsertBlock(block, blockIndex);

// Xóa block
removeBlock(blockId);
```

### 5. Submit Payload

```typescript
// Lấy payload cuối cùng
const payload = getPayload();

// Check có changes không
if (hasChanges()) {
  await pagesApi.updatePage(pageId, payload);
  reset(); // Clear sau khi save thành công
}
```

## Flow trong PageBuilder

### Current Implementation:

1. **Khởi tạo**: `usePagePayloadManager` được init với original page data
2. **Track changes tự động**:
   - Blocks: `useEffect` tự động gọi `rebuildBlocks()` khi blocks thay đổi
   - Permalink: Gọi `updateTranslationPermalink()` khi user edit
   - Fields: Gọi `updateField()` khi cần (chưa implement trong UI)
3. **Submit**: `getPayload()` được truyền vào `usePageBuilderSave`
4. **Reset**: Gọi `reset()` sau khi save thành công

## API Reference

### `updateTranslationPermalink(languageCode, permalink, title?)`
- Update hoặc create translation với permalink mới
- Tự động detect update hay create dựa trên original data

### `updateField(field, value)`
- Update direct fields: `sort`, `status`, `site_id`
- Chỉ update nếu value khác original

### `upsertBlock(block, blockIndex)`
- Add block mới hoặc update block hiện có
- Tự động process block translations với create/update/delete structure
- Tự động add `event_id` và `tenant_id`

### `removeBlock(blockId)`
- Mark block để delete (cho existing blocks)
- Temp blocks sẽ được filter trong `rebuildBlocks()`

### `rebuildBlocks(currentBlocks, eventId, tenantId)`
- Rebuild toàn bộ blocks payload từ current blocks array
- So sánh với original để detect create/update/delete
- Recommended: gọi trong `useEffect` khi blocks thay đổi

### `getPayload(): PageUpdatePayload | null`
- Lấy final payload ready để submit
- Chỉ include fields có changes
- Remove undefined arrays

### `hasChanges(): boolean`
- Check xem có pending changes không

### `reset()`
- Clear tất cả pending changes
- Reset về initial state

## Example: Complete Flow

```typescript
// 1. Init
const payloadManager = usePagePayloadManager({
  page: pageData,
  eventId: 123,
  tenantId: 456,
});

// 2. User thao tác
// - Edit permalink
payloadManager.updateTranslationPermalink('en-US', '/new-page');

// - Add block
const newBlock = { id: 'temp-123', collection: 'block_hero', item: {...} };
insertBlockAt(newBlock, 0); // Update local state
// useEffect sẽ tự động gọi rebuildBlocks()

// - Update block
replaceBlock(blockId, updatedBlock);
// useEffect sẽ tự động gọi rebuildBlocks()

// - Delete block
removeBlock(blockId);
deleteBlock(index); // Update local state

// 3. Submit
const payload = payloadManager.getPayload();
if (payload && Object.keys(payload).length > 0) {
  await pagesApi.updatePage(pageId, payload);
  payloadManager.reset();
}
```

## Benefits

1. **Separation of Concerns**: Payload management tách biệt khỏi UI logic
2. **Automatic Tracking**: Không cần manually build payload
3. **Only Real Changes**: Chỉ track thay đổi thực sự
4. **Type Safety**: Full TypeScript support
5. **Easy to Extend**: Dễ thêm fields hoặc collections mới

## Future Extensions

Service này có thể được extend cho các collections khác:
- `SitePayloadManager` cho sites
- `NavigationPayloadManager` cho navigation
- Generic `PayloadManager<T>` cho bất kỳ collection nào


