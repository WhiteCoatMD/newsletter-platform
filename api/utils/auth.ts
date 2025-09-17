// Simple authentication utility for Vercel functions
export function getUserFromToken(authHeader: string) {
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Invalid authorization header');
  }

  const token = authHeader.substring(7);

  // For our admin user, use the known ID
  if (token === '68ca06c9182ba9cdc01f135d') {
    return {
      id: '68ca06c9182ba9cdc01f135d',
      email: 'mitch@whitecoat-md.com',
      firstName: 'Mitch',
      lastName: 'Bratton',
      role: 'admin'
    };
  }

  throw new Error('Invalid token');
}

export function requireModerator(user: any) {
  if (user.role !== 'admin' && user.role !== 'moderator') {
    throw new Error('Moderator privileges required');
  }
}