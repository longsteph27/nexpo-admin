# Events API Documentation

Based on the analysis of `schema-events.json`, this document explains how to call the API to get events data from the Directus backend.

## Events Collection Structure

The events collection in Directus has the following fields:

### Core Fields
- `id` (integer, primary key) - Auto-generated unique identifier
- `tenant_id` (integer, optional) - Foreign key to tenants table
- `name` (string, required) - Event name (max 255 characters)
- `description` (text, optional) - Rich text description with markdown support
- `start_date` (timestamp, required) - Event start date and time
- `end_date` (timestamp, optional) - Event end date and time
- `location` (string, optional) - Event location (max 255 characters)
- `status` (string, required) - Event status with choices:
  - `draft` (default) - Event is in draft mode
  - `published` - Event is live/published
  - `archived` - Event is archived
- `sort` (integer, optional) - Sort order for display

### Relationship Fields
- `event_users` (alias, one-to-many) - Related event users
- `sites` (alias, one-to-many) - Related sites
- `forms` (alias, one-to-many) - Related forms

### System Fields
- `user_created` (uuid, optional) - User who created the event
- `date_created` (timestamp, optional) - Creation timestamp
- `user_updated` (uuid, optional) - User who last updated the event
- `date_updated` (timestamp, optional) - Last update timestamp

## API Usage

### 1. Import the Events API Service

```typescript
import { eventsApi, Event, EventFilters } from '@/lib/events-api';
```

### 2. Get All Events

```typescript
// Get all events with default pagination
const response = await eventsApi.getEvents();

// Get events with custom filters
const response = await eventsApi.getEvents({
  page: 1,
  limit: 20,
  status: 'published',
  search: 'design',
  sort: '-start_date'
});
```

### 3. Get Events by Status

```typescript
// Get draft events
const draftEvents = await eventsApi.getEventsByStatus('draft');

// Get published events
const publishedEvents = await eventsApi.getEventsByStatus('published');

// Get archived events
const archivedEvents = await eventsApi.getEventsByStatus('archived');
```

### 4. Search Events

```typescript
// Search events by name
const searchResults = await eventsApi.searchEvents('Vietnam Design');
```

### 5. Get Upcoming Events

```typescript
// Get published events with start_date in the future
const upcomingEvents = await eventsApi.getUpcomingEvents();
```

### 6. Get Past Events

```typescript
// Get published events with end_date in the past
const pastEvents = await eventsApi.getPastEvents();
```

### 7. Get Single Event

```typescript
// Get event by ID
const event = await eventsApi.getEventById(123);
```

### 8. Create Event

```typescript
const newEvent = await eventsApi.createEvent({
  name: 'Vietnam Design Connect 2025',
  description: 'Annual design conference',
  start_date: '2025-09-12T09:00:00Z',
  end_date: '2025-09-14T18:00:00Z',
  location: 'SECC - Saigon Exhibition & Convention Center',
  status: 'draft',
  tenant_id: 1
});
```

### 9. Update Event

```typescript
const updatedEvent = await eventsApi.updateEvent(123, {
  name: 'Updated Event Name',
  status: 'published'
});
```

### 10. Delete Event

```typescript
await eventsApi.deleteEvent(123);
```

### 11. Get Events Count

```typescript
const counts = await eventsApi.getEventsCount();
console.log(counts);
// Output: { draft: 5, published: 10, archived: 3, total: 18 }
```

## API Response Format

### Events Response
```typescript
interface EventsResponse {
  data: Event[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

### Event Object
```typescript
interface Event {
  id: number;
  tenant_id?: number;
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  location?: string;
  status: 'draft' | 'published' | 'archived';
  sort?: number;
  event_users?: EventUser[];
  sites?: Site[];
  forms?: Form[];
  user_created?: string;
  date_created?: string;
  user_updated?: string;
  date_updated?: string;
}
```

## Filter Options

### EventFilters Interface
```typescript
interface EventFilters {
  page?: number;           // Page number (default: 1)
  limit?: number;          // Items per page (default: 15)
  status?: 'draft' | 'published' | 'archived' | 'all'; // Filter by status
  search?: string;         // Search in event names
  sort?: string;          // Sort field (e.g., '-date_created', 'start_date')
  fields?: string[];      // Specific fields to return
}
```

## Direct API Calls

If you need to make direct API calls without using the service:

### GET /api/events
```typescript
const response = await fetch('/api/events?page=1&limit=15&status=published', {
  method: 'GET',
  credentials: 'include'
});
const data = await response.json();
```

### POST /api/events
```typescript
const response = await fetch('/api/events', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include',
  body: JSON.stringify({
    name: 'Event Name',
    start_date: '2025-01-01T10:00:00Z',
    status: 'draft'
  })
});
```

### GET /api/events/[id]
```typescript
const response = await fetch('/api/events/123', {
  method: 'GET',
  credentials: 'include'
});
```

### PUT /api/events/[id]
```typescript
const response = await fetch('/api/events/123', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include',
  body: JSON.stringify({
    name: 'Updated Event Name'
  })
});
```

### DELETE /api/events/[id]
```typescript
const response = await fetch('/api/events/123', {
  method: 'DELETE',
  credentials: 'include'
});
```

## Error Handling

All API methods throw errors that should be caught:

```typescript
try {
  const events = await eventsApi.getEvents();
  // Handle success
} catch (error) {
  console.error('Failed to fetch events:', error.message);
  // Handle error
}
```

## Permission Integration

The API automatically checks user permissions before performing operations:

- **Read operations**: Check if user has `read` permission for events collection
- **Create operations**: Check if user has `create` permission for events collection
- **Update operations**: Check if user has `update` permission for events collection
- **Delete operations**: Check if user has `delete` permission for events collection

If permissions are insufficient, the API will return a 403 Forbidden error.

## Example Usage in React Components

```typescript
import { useState, useEffect } from 'react';
import { eventsApi, Event } from '@/lib/events-api';

function EventsList() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await eventsApi.getEvents({
          status: 'published',
          sort: '-start_date'
        });
        setEvents(response.data);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {events.map(event => (
        <div key={event.id}>
          <h3>{event.name}</h3>
          <p>{event.description}</p>
          <p>Start: {new Date(event.start_date).toLocaleDateString()}</p>
          <p>Location: {event.location}</p>
        </div>
      ))}
    </div>
  );
}
```

This API service provides a complete interface for working with events data in your Directus-based application, with proper TypeScript support, error handling, and permission integration.
