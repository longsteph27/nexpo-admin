# Directus Collections TypeScript Types

File này chứa TypeScript types cho tất cả Directus collections, được tạo từ schema files trong `docs/`.

## Mục đích

- **Loại bỏ `:any` types** trong codebase
- **Type safety** tốt hơn khi làm việc với Directus API
- **IDE autocomplete** và IntelliSense support
- **Dễ debug** hơn với rõ ràng về field types và nullability

## Cấu trúc

### 1. Core Types

```typescript
import type { Page, PageTranslation, Navigation, NavigationItem } from '@/types/directus-collections';
```

### 2. API Payload Types

```typescript
import type { 
  PageUpdatePayload,
  PageTranslationPayload,
  NavigationUpdatePayload 
} from '@/types/directus-collections';
```

### 3. Helper Functions

```typescript
import { 
  extractLanguageCode,
  normalizePageTranslation 
} from '@/types/directus-collections';
```

## Sử dụng trong Code

### Trước (với `any`):

```typescript
const page: any = await getPage(pageId);
const permalink = page?.translations?.[0]?.permalink;
```

### Sau (với types):

```typescript
import type { Page, PageTranslation } from '@/types/directus-collections';

const page: Page = await getPage(pageId);
const permalink = page.translations?.[0]?.permalink; // Type-safe!
```

### Xử lý Languages Code

Languages code có thể ở nhiều format:
- String: `'en-US'`
- Object: `{ code: 'en-US' }`

Sử dụng helper function:

```typescript
import { extractLanguageCode } from '@/types/directus-collections';

// Thay vì:
const langCode = trans.languages_code?.code || trans.languages_code;

// Dùng:
const langCode = extractLanguageCode(trans.languages_code);
```

## Collections được định nghĩa

- ✅ **Pages** (`Page`, `PageTranslation`, `PageBlock`)
- ✅ **Sites** (`Site`, `SiteTranslation`)
- ✅ **Navigation** (`Navigation`, `NavigationItem`, `NavigationItemTranslation`)
- ✅ **Common Types** (`DirectusStatus`, `LanguageCode`, `DirectusTimestamp`)

## Cập nhật Types

Khi schema thay đổi trong Directus:

1. Export schema mới từ Directus vào `docs/schema-*.json`
2. Cập nhật types trong `src/types/directus-collections.ts`
3. Chạy TypeScript compiler để kiểm tra lỗi: `tsc --noEmit`

## Ví dụ Migration

### PageBuilder.tsx

**Trước:**
```typescript
const pageTranslations = (page as any)?.translations || [];
pageTranslations.forEach((trans: any) => {
  const langCode = trans.languages_code?.code || trans.languages_code;
  // ...
});
```

**Sau:**
```typescript
import type { Page, PageTranslation } from '@/types/directus-collections';
import { extractLanguageCode } from '@/types/directus-collections';

const pageTranslations: PageTranslation[] = page?.translations || [];
pageTranslations.forEach((trans: PageTranslation) => {
  const langCode = extractLanguageCode(trans.languages_code);
  // ...
});
```

## Best Practices

1. **Luôn import types** thay vì dùng `any`
2. **Sử dụng helper functions** cho languages_code normalization
3. **Kiểm tra nullability** - nhiều fields là `| null`
4. **Sử dụng type guards** khi cần check format của data

## Type Guards

```typescript
import { isLanguageCodeObject } from '@/types/directus-collections';

if (isLanguageCodeObject(langCode)) {
  // TypeScript biết đây là { code: string }
  console.log(langCode.code);
} else {
  // TypeScript biết đây là string
  console.log(langCode);
}
```

