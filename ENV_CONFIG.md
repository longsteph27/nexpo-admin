# Environment Configuration

This document describes the environment variables used to configure authentication modes for different deployment environments.

## Environment Variables

### Required Variables

| Variable | Description | Default | Values |
|----------|-------------|---------|--------|
| `NEXT_PUBLIC_DIRECTUS_URL` | Directus API URL | `https://app.nexpo.vn` | Any valid URL |
| `NEXT_PUBLIC_DIRECTUS_AUTH_MODE` | Authentication mode | `json` | `json` \| `session` |
| `NEXT_PUBLIC_DIRECTUS_AUTO_REFRESH` | Enable automatic token refresh | `true` | `true` \| `false` |
| `NODE_ENV` | Environment mode | `development` | `development` \| `production` |

## Configuration Examples

### Local Development (.env.local)

```bash
# Local Development Environment
NEXT_PUBLIC_DIRECTUS_URL=https://app.nexpo.vn
NEXT_PUBLIC_DIRECTUS_AUTH_MODE=json
NEXT_PUBLIC_DIRECTUS_AUTO_REFRESH=true
NODE_ENV=development
```

### Production Deployment (.env.production)

```bash
# Production Environment
NEXT_PUBLIC_DIRECTUS_URL=https://app.nexpo.vn
NEXT_PUBLIC_DIRECTUS_AUTH_MODE=session
NEXT_PUBLIC_DIRECTUS_AUTO_REFRESH=true
NODE_ENV=production
```

## Authentication Modes

### JSON Mode (Local Development)
- **Use Case**: Local development and testing
- **Token Storage**: Stored in Zustand store and localStorage
- **Security**: Tokens are accessible via JavaScript
- **Refresh**: Manual token refresh handling
- **Benefits**: Easy debugging, full control over tokens

### Session Mode (Production)
- **Use Case**: Production deployment
- **Token Storage**: Handled by Directus via HTTP-only cookies
- **Security**: Tokens are not accessible via JavaScript (XSS protection)
- **Refresh**: Automatic session refresh by Directus SDK
- **Benefits**: Enhanced security, automatic token management

## Deployment Instructions

### For Local Development
1. Create `.env.local` file with JSON mode configuration
2. Run `npm run dev`
3. App will use JSON authentication mode

### For Production Deployment
1. Set environment variables in your deployment platform:
   - `NEXT_PUBLIC_DIRECTUS_AUTH_MODE=session`
   - `NEXT_PUBLIC_DIRECTUS_AUTO_REFRESH=true`
   - `NODE_ENV=production`
2. Deploy the application
3. App will use session authentication mode

## Security Considerations

### JSON Mode
- ⚠️ **Risk**: Tokens stored in localStorage are vulnerable to XSS attacks
- ✅ **Use Case**: Development and testing only
- 🔧 **Mitigation**: Ensure proper XSS protection in production

### Session Mode
- ✅ **Security**: Tokens stored in HTTP-only cookies
- ✅ **Use Case**: Production deployment
- 🔧 **Benefits**: Automatic CSRF protection, no JavaScript access to tokens

## Troubleshooting

### Common Issues

1. **Authentication not working in production**
   - Check that `NEXT_PUBLIC_DIRECTUS_AUTH_MODE=session` is set
   - Verify Directus server supports session authentication

2. **Tokens not persisting in development**
   - Ensure `NEXT_PUBLIC_DIRECTUS_AUTH_MODE=json` is set
   - Check localStorage is available in browser

3. **CORS issues with session mode**
   - Configure Directus CORS settings for your domain
   - Ensure credentials are included in requests

### Debug Mode

To debug authentication issues, check the browser console for:
- Environment configuration logs
- Authentication mode being used
- Token storage/retrieval logs
