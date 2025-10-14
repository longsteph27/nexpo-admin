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

export function getRandomPastelStyle(): React.CSSProperties {
  const randomPastel = () => {
    const hue = Math.floor(Math.random() * 360);
    const saturation = 55 + Math.random() * 15; // pastel sáng nhưng rõ
    const lightness = 60 + Math.random() * 15;  // sáng vừa, không trắng
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  // Sinh 3–5 đám loang
  const gradients = Array.from({ length: 4 }, () => {
    const x = Math.floor(Math.random() * 100);
    const y = Math.floor(Math.random() * 100);
    const color = randomPastel();
    const size = 40 + Math.random() * 35; // vùng loang tương đối lớn
    return `radial-gradient(circle at ${x}% ${y}%, ${color} 0%, transparent ${size}%)`;
  });

  return {
    background: gradients.join(','),
    backgroundBlendMode: 'soft-light', // dịu hơn overlay/screen
  };
}

export function getOpaquePastelStyle(): React.CSSProperties {
  const baseHue = Math.floor(Math.random() * 360);
  
  // Tạo background với nhiều màu solid (không gradient)
  const colorStops = [];
  const numColors = 4 + Math.floor(Math.random() * 3);
  
  for (let i = 0; i < numColors; i++) {
    const hue = baseHue + (i * 360 / numColors);
    const saturation = 60 + Math.floor(Math.random() * 25);
    const lightness = 75 + Math.floor(Math.random() * 15);
    const x = Math.floor(Math.random() * 100);
    const y = Math.floor(Math.random() * 100);
    
    colorStops.push(
      `radial-gradient(circle at ${x}% ${y}%, hsl(${hue} ${saturation}% ${lightness}%) 0%, transparent 40%)`
    );
  }

  return {
    backgroundImage: colorStops.join(', '),
    backgroundBlendMode: 'multiply',
    backgroundColor: `hsl(${baseHue} 35% 80%)` // Fallback color
  };
}