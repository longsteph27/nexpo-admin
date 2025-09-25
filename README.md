# NEXPO Admin Panel

A modern admin panel for the NEXPO event management platform, built with Next.js 15, TypeScript, and Directus CMS.

## Features

- 🔐 **Authentication System** - Login with email/password or Google OAuth
- 📊 **Event Management Dashboard** - Create, view, and manage events
- 🎨 **Modern UI** - Built with Tailwind CSS and DaisyUI
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🚀 **Real-time Updates** - Connected to Directus CMS backend
- ✨ **Smooth Animations** - Framer Motion animations throughout

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + DaisyUI
- **Backend**: Directus CMS (`https://app.nexpo.vn`)
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod validation
- **Animations**: Framer Motion
- **Icons**: Iconify React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd nexpo-admin-panel
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Dashboard pages
│   ├── login/             # Authentication pages
│   └── ...
├── components/            # Reusable UI components
│   ├── layout/           # Layout components
│   └── ui/               # UI components
├── lib/                  # Utility libraries
│   └── directus.ts       # Directus SDK configuration
└── store/                # Zustand stores
    └── auth.ts           # Authentication store
```

## Key Features

### Authentication
- Email/password login
- Google OAuth integration (ready for implementation)
- Persistent login state with Zustand
- Protected routes

### Event Management
- Create new events with multi-step form
- View all events with filtering (All, Live, Past, Draft, Cancelled)
- Event status management
- Event image upload support
- Responsive event cards

### Dashboard Layout
- Collapsible sidebar navigation
- Responsive design for mobile/desktop
- User profile display
- Quick actions and shortcuts

## Environment Setup

The application is pre-configured to connect to:
- **Directus Backend**: `https://app.nexpo.vn`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Default Login Credentials

For development/testing:
- **Email**: `duchuu.dsgnr@gmail.com`
- **Password**: (Enter your password)

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

This project is private and proprietary to the NEXPO platform.