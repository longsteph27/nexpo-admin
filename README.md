# NEXPO - Directus Clone

A modern Directus clone built with Next.js 15, featuring a beautiful UI/UX with DaisyUI, Framer Motion animations, and full authentication with session management.

## Features

- 🚀 **Next.js 15** - Latest version with App Router
- 🎨 **DaisyUI** - Beautiful UI components
- ✨ **Framer Motion** - Smooth animations and transitions
- 📝 **React Hook Form** - Form handling and validation
- 🎯 **Radix UI** - Accessible component primitives
- 🎪 **Headless UI** - Unstyled, accessible components
- 🎭 **Iconify** - 150,000+ SVG icons
- 🔐 **Directus SDK** - Full authentication with session management
- 🍪 **Session Authentication** - Automatic cookie handling with axios
- 📱 **Responsive Design** - Mobile-first approach
- 🌙 **Modern UI** - Clean, minimalist design inspired by NEXPO

## Tech Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS + DaisyUI
- **Animation**: Framer Motion
- **Forms**: React Hook Form + Zod validation
- **Icons**: Iconify
- **Backend**: Directus CMS
- **HTTP Client**: Axios with session management

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Directus instance running at `https://app.nexpo.vn`

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd clone-directus
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# .env.local
NEXT_PUBLIC_DIRECTUS_URL=https://app.nexpo.vn
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Authentication

The app uses Directus session authentication with automatic cookie handling:

- **Login**: POST to `/auth/login` with `mode=session`
- **Session**: Automatic cookie storage and management
- **User Info**: GET `/users/me` for current user data
- **Logout**: POST to `/auth/logout`

### Session Flow

1. User enters credentials in the login form
2. Axios sends POST request to Directus with `mode=session`
3. Directus responds with session cookie
4. All future requests automatically include the session cookie
5. User data is fetched and stored in React context

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Protected dashboard page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home/login page
├── components/            # React components
│   ├── auth/             # Authentication components
│   └── ProtectedRoute.tsx # Route protection
├── contexts/             # React contexts
│   └── AuthContext.tsx   # Authentication state
├── lib/                  # Utility libraries
│   ├── auth-server.ts    # Server-side auth utilities
│   └── directus.ts       # Directus SDK configuration
└── middleware.ts         # Next.js middleware
```

## Key Components

### LoginForm
- Beautiful login form matching NEXPO design
- Real-time email validation
- Google login button (placeholder)
- Remember me functionality
- Form validation with React Hook Form + Zod

### AuthContext
- Global authentication state management
- Login/logout functions
- User data storage
- Loading states

### ProtectedRoute
- Route protection wrapper
- Automatic redirect to login if not authenticated
- Loading states

## API Configuration

The app uses a custom Directus configuration with axios for session management:

```typescript
// Automatic session cookie handling
export const directusAxios = axios.create({
  baseURL: `${directusUrl}/`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

## Styling

The app uses a custom color palette inspired by the NEXPO design:

- **Primary Blue**: `#1e40af`
- **Gray**: `#374151`
- **Light Gray**: `#9ca3af`

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Code Style

- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Tailwind CSS for styling

## Deployment

The app is ready for deployment on Vercel, Netlify, or any Node.js hosting platform.

### Environment Variables

Make sure to set the following environment variable in production:

```
NEXT_PUBLIC_DIRECTUS_URL=https://app.nexpo.vn
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.