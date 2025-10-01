export const getPageInfo = (title: string, subtitle: string, pathname: string) => {
    if (title && subtitle) return { title, subtitle };

    switch (pathname) {
      case '/dashboard':
        return { title: 'Event Management', subtitle: 'Manage your events and settings' };
      case '/dashboard/create':
        return { title: 'Create Event', subtitle: 'Set up a new event' };
      case '/events':
        return { title: 'Events', subtitle: 'Manage and organize your events' };
      case '/events/create':
      case '/events/create/step1':
        return { title: 'Create Event', subtitle: 'Set up a new event' };
      case '/workspace':
        return { title: 'Workspace', subtitle: 'Your workspace dashboard' };
      case '/matching':
        return { title: 'Matching', subtitle: 'Find and match opportunities' };
      default:
        return { title: 'NEXPO Admin', subtitle: 'Event management platform' };
    }
  };

export const getDirectusAssetUrl = (fileId?: string | number | null) => {
  if (!fileId) return '';
  return `https://app.nexpo.vn/assets/${fileId}?format=webp`;
};