import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  PencilSquareIcon,
  ChartBarIcon,
  UsersIcon,
  DocumentDuplicateIcon,
  CogIcon,
  BoltIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  ArrowRightOnRectangleIcon,
  UserIcon,
  QuestionMarkCircleIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Get current user from localStorage
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Create', href: '/posts/new', icon: PencilSquareIcon },
    { name: 'Newsletters', href: '/newsletters', icon: EnvelopeIcon },
    { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
    { name: 'Subscribers', href: '/subscribers', icon: UsersIcon },
    { name: 'Templates', href: '/templates', icon: DocumentDuplicateIcon },
    { name: 'Content Library', href: '/content', icon: BookOpenIcon },
    { name: 'Community', href: '/community', icon: ChatBubbleLeftRightIcon },
    { name: 'Help Guide', href: '/help', icon: QuestionMarkCircleIcon },
    { name: 'Settings', href: '/settings', icon: CogIcon }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm border-r border-gray-200 flex flex-col h-screen">
          <div className="flex items-center h-16 px-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <BoltIcon className="w-8 h-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">NewsBuildr</h1>
            </div>
          </div>

          <nav className="mt-8 flex-1">
            <div className="px-4 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      isActive
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    } group flex items-center px-3 py-2 text-sm font-medium border-l-4 rounded-r-md`}
                  >
                    <item.icon
                      className={`${
                        isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                      } flex-shrink-0 -ml-1 mr-3 h-5 w-5`}
                    />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* User info and logout */}
          <div className="px-4 py-4 border-t border-gray-200">
            {user && (
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <img
                      src={user.avatarUrl}
                      alt={user.firstName}
                      className="w-8 h-8 rounded-full"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user.email}
                    </p>
                    {user.role === 'admin' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                        Admin
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                >
                  <ArrowRightOnRectangleIcon className="flex-shrink-0 -ml-1 mr-3 h-5 w-5 text-gray-400" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1">
          <main>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;