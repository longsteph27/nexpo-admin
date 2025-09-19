# Directus API Structure & Calling Guide

## 🎯 Quick Reference

### API Endpoints Structure
```
/api/
├── collections    → GET  /api/collections
├── search         → GET  /api/search
├── fields         → GET  /api/fields  
├── relations      → GET  /api/relations
└── feedback       → POST /api/feedback
```

## 📡 How to Call APIs

### 1. Collections API

**Purpose**: Get all sites/collections

```bash
# cURL
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/collections

# JavaScript/Fetch
const response = await fetch('/api/collections', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});
const collections = await response.json();
```

**Response**:
```json
[
  {
    "id": "6",
    "name": "YBA Event Site", 
    "slug": "yba",
    "status": "published",
    "domain": "yba.test"
  }
]
```

### 2. Search API

**Purpose**: Search across multiple content types

```bash
# Search posts and pages
curl "http://localhost:3000/api/search?collections=posts,pages&search=event"

# Get raw data
curl "http://localhost:3000/api/search?collections=posts&raw=true"

# Search help articles
curl "http://localhost:3000/api/search?collections=help_articles&search=setup"
```

**JavaScript**:
```javascript
// Search functionality
const searchResults = await fetch('/api/search?collections=posts,pages&search=event');
const results = await searchResults.json();

// Raw data
const rawData = await fetch('/api/search?collections=posts&raw=true');
const data = await rawData.json();
```

**Query Parameters**:
- `collections`: Comma-separated list (posts,pages,projects,categories,help_articles)
- `search`: Search term
- `raw`: Return raw Directus data (true/false)

**Response**:
```json
[
  {
    "type": "post",
    "title": "Event Planning Guide",
    "description": "Complete guide to planning successful events", 
    "image": "image-id",
    "url": "/posts/event-planning-guide"
  }
]
```

### 3. Fields API

**Purpose**: Get form field definitions

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/fields
```

**JavaScript**:
```javascript
const formFields = await fetch('/api/fields', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});
const fields = await formFields.json();
```

**Response**:
```json
[
  {
    "id": "field-id",
    "name": "email",
    "type": "email", 
    "required": true,
    "validation": "email"
  }
]
```

### 4. Relations API

**Purpose**: Get navigation and relationship data

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/relations
```

**JavaScript**:
```javascript
const navigation = await fetch('/api/relations', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});
const navData = await navigation.json();
```

**Response**:
```json
[
  {
    "id": "header",
    "title": "Header Navigation",
    "type": "header",
    "items": [
      {
        "id": "nav-item-id",
        "title": "Speakers",
        "url": "/",
        "type": "url"
      }
    ]
  }
]
```

### 5. Feedback API

**Purpose**: Submit user feedback (POST only)

```bash
# Create new feedback
curl -X POST "http://localhost:3000/api/feedback" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Page Title",
    "url": "/current-page", 
    "rating": 5,
    "visitor_id": "session-id",
    "comments": "User feedback text"
  }'

# Update existing feedback
curl -X POST "http://localhost:3000/api/feedback" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "feedback-id",
    "title": "Updated Title",
    "rating": 4,
    "comments": "Updated feedback"
  }'
```

**JavaScript**:
```javascript
// Create feedback
const newFeedback = await fetch('/api/feedback', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Page Title',
    url: '/current-page',
    rating: 5,
    visitor_id: 'session-id',
    comments: 'User feedback text'
  })
});

// Update feedback
const updateFeedback = await fetch('/api/feedback', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    id: 'feedback-id',
    title: 'Updated Title',
    rating: 4,
    comments: 'Updated feedback'
  })
});
```

## 🏗️ Directus Service Layer Structure

### Service Functions Location
```
src/services/directus.ts
```

### Available Functions

```typescript
// Collections
getCollections()                    // Get all sites
getCollectionById(id: string)       // Get site by ID
getCollectionFields(collection)    // Get fields for collection
getCollectionRelations(collection)  // Get relations for collection

// Fields
getFields()                        // Get all form fields

// Relations  
getRelations()                     // Get navigation data
getRelationsByCollection(collection) // Get relations by collection
```

### Usage Examples

```typescript
import { 
  getCollections, 
  getFields, 
  getRelations 
} from '@/services/directus';

// In your component or API route
const collections = await getCollections();
const fields = await getFields();
const relations = await getRelations();
```

## 🔧 Directus Client Structure

### Client Configuration
```
src/directus/client.ts
```

```typescript
import { createDirectus, rest, staticToken } from '@directus/sdk'
import type { Schema } from './types'

const directus = createDirectus<Schema>(
  process.env.NEXT_PUBLIC_DIRECTUS_URL!
)
  .with(rest())
  .with(staticToken(process.env.NEXT_PUBLIC_DIRECTUS_TOKEN!))

export default directus
```

### Direct Usage

```typescript
import directus from '@/directus/client'
import { readItems, createItem, updateItem } from '@directus/sdk'

// Read data
const data = await directus.request(
  readItems('collection_name', {
    fields: ['*'],
    filter: {
      status: {
        _eq: 'published'
      }
    }
  })
);

// Create data
const newItem = await directus.request(
  createItem('collection_name', {
    title: 'New Item',
    content: 'Item content'
  })
);

// Update data
const updatedItem = await directus.request(
  updateItem('collection_name', 'item-id', {
    title: 'Updated Title'
  })
);
```

## 📊 Query Builders Structure

### Query Files Location
```
src/directus/queries/
├── pages.ts        // Page queries
├── navigation.ts   // Navigation queries  
├── sites.ts        // Site queries
└── globals.ts      // Global queries
```

### Example Query Functions

```typescript
// src/directus/queries/pages.ts
export async function fetchPage(slug: string, lang: string) {
  return directus.request(
    readItems('pages', {
      fields: ['*', 'blocks.*', 'translations.*'],
      filter: {
        slug: { _eq: slug },
        status: { _eq: 'published' }
      }
    })
  );
}

// src/directus/queries/navigation.ts  
export async function getNavigation(siteId: string, type: string) {
  return directus.request(
    readItems('navigation', {
      fields: ['*', 'items.*', 'items.translations.*'],
      filter: {
        site_id: { _eq: siteId },
        type: { _eq: type },
        status: { _eq: 'published' }
      }
    })
  );
}
```

## 🔐 Authentication Structure

### Environment Variables Required
```env
NEXT_PUBLIC_DIRECTUS_URL=https://app.nexpo.vn
NEXT_PUBLIC_DIRECTUS_TOKEN=xDGh7_ZnoHmHmqC-RRR-CtJI6QoDcRRj
```

### Token Usage

```typescript
// In API routes
const headers = {
  'Authorization': `Bearer ${process.env.NEXT_PUBLIC_DIRECTUS_TOKEN}`
};

// In service functions
const directus = createDirectus<Schema>(process.env.NEXT_PUBLIC_DIRECTUS_URL!)
  .with(rest())
  .with(staticToken(process.env.NEXT_PUBLIC_DIRECTUS_TOKEN!));
```

## 🎯 Common Patterns

### 1. Multi-Language Queries

```typescript
// Get content with specific language
const content = await directus.request(
  readItems('collection', {
    fields: ['*', 'translations.*'],
    filter: {
      translations: {
        languages_code: {
          _eq: 'en-US'
        }
      }
    }
  })
);
```

### 2. Multi-Tenant Queries

```typescript
// Get content for specific site
const siteContent = await directus.request(
  readItems('collection', {
    fields: ['*'],
    filter: {
      site_id: {
        _eq: 'site-id'
      },
      status: {
        _eq: 'published'
      }
    }
  })
);
```

### 3. Search Queries

```typescript
// Search across collections
const searchResults = await directus.request(
  readItems('collection', {
    fields: ['*'],
    search: 'search-term',
    filter: {
      status: {
        _eq: 'published'
      }
    }
  })
);
```

### 4. Pagination Queries

```typescript
// Paginated results
const paginatedData = await directus.request(
  readItems('collection', {
    fields: ['*'],
    limit: 10,
    offset: 0,
    sort: ['-date_created'],
    filter: {
      status: {
        _eq: 'published'
      }
    }
  })
);
```

## 🚨 Error Handling Structure

### API Route Error Handling

```typescript
export async function GET() {
  try {
    const data = await yourServiceFunction();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
```

### Service Function Error Handling

```typescript
export async function safeApiCall<T>(
  apiCall: () => Promise<T>,
  fallbackValue?: T
): Promise<T | undefined> {
  try {
    return await apiCall();
  } catch (error) {
    console.error('Directus API Error:', error);
    return fallbackValue;
  }
}
```

## 📋 Quick Commands

### Test All APIs

```bash
# Test collections
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/collections

# Test search
curl "http://localhost:3000/api/search?collections=posts&search=test"

# Test fields  
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/fields

# Test relations
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/relations

# Test feedback
curl -X POST "http://localhost:3000/api/feedback" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","rating":5,"comments":"Test feedback"}'
```

### Health Check

```bash
# Check if Directus is accessible
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://app.nexpo.vn/server/info
```

---

**Quick Start**: Replace `YOUR_TOKEN` with actual token and `localhost:3000` with your domain.
