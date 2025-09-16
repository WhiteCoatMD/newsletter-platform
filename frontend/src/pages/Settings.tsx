import React, { useState } from 'react';
import { UserIcon, BellIcon, KeyIcon, CreditCardIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    name: 'Admin User',
    email: 'admin@newsbuildr.com',
    company: 'NewsBuildr',
    website: 'https://newsbuildr.com',
    accountType: 'admin'
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailReports: true,
    sendNotifications: true,
    marketingEmails: false,
    securityAlerts: true
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'notifications', label: 'Notifications', icon: BellIcon },
    { id: 'api', label: 'API Keys', icon: KeyIcon },
    { id: 'billing', label: 'Billing', icon: CreditCardIcon },
    { id: 'security', label: 'Security', icon: ShieldCheckIcon },
  ];

  const handleSaveProfile = () => {
    toast.success('Profile updated successfully!');
  };

  const handleSaveNotifications = () => {
    toast.success('Notification preferences updated!');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

      <div className="bg-white rounded-lg shadow-sm border">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                  <input
                    type="text"
                    value={profileData.company}
                    onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                  <input
                    type="url"
                    value={profileData.website}
                    onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveProfile}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-gray-900">Notification Preferences</h2>

              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={notificationSettings.emailReports}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, emailReports: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Email performance reports</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={notificationSettings.sendNotifications}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, sendNotifications: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Send completion notifications</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={notificationSettings.marketingEmails}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, marketingEmails: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Marketing emails and updates</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={notificationSettings.securityAlerts}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, securityAlerts: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Security alerts</span>
                </label>
              </div>

              <button
                onClick={handleSaveNotifications}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Save Preferences
              </button>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-gray-900">API Keys</h2>

              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <p className="text-sm text-yellow-700">
                  Your OpenAI API key is configured and working properly.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">OpenAI API Key</label>
                  <div className="flex space-x-3">
                    <input
                      type="password"
                      placeholder="sk-..."
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                      Update
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Newsletter API Key</label>
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value="ns_live_abc123...xyz789"
                      disabled
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
                    />
                    <button className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700">
                      Regenerate
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-gray-900">Account & Subscription</h2>

              <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
                <div className="flex items-center space-x-2">
                  <div className="bg-purple-600 text-white px-2 py-1 rounded text-xs font-medium">ADMIN</div>
                  <h3 className="font-medium text-purple-800">Unlimited Plan</h3>
                </div>
                <p className="text-sm text-purple-700 mt-1">Full platform access • No limits • Priority support</p>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Usage This Month</h3>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Emails sent</span>
                      <span className="text-green-600">47,650 / Unlimited ∞</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>AI generations</span>
                      <span className="text-green-600">324 / Unlimited ∞</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>API calls</span>
                      <span className="text-green-600">12,450 / Unlimited ∞</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Storage used</span>
                      <span className="text-green-600">2.4 GB / Unlimited ∞</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h4 className="font-medium text-blue-800">Admin Features Enabled</h4>
                  <ul className="text-sm text-blue-700 mt-2 space-y-1">
                    <li>• Unlimited email sends</li>
                    <li>• Unlimited AI content generation</li>
                    <li>• Advanced analytics & reporting</li>
                    <li>• Priority email delivery</li>
                    <li>• Custom integrations</li>
                    <li>• White-label options</li>
                  </ul>
                </div>

                <div className="flex space-x-3">
                  <button className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700">
                    Admin Dashboard
                  </button>
                  <button className="border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50">
                    System Logs
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-gray-900">Security Settings</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Change Password</h3>
                  <div className="space-y-3">
                    <input
                      type="password"
                      placeholder="Current password"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="password"
                      placeholder="New password"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                    Update Password
                  </button>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Two-Factor Authentication</h3>
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                    <span className="text-sm">Enable 2FA for added security</span>
                    <button className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
                      Enable
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Active Sessions</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                      <div>
                        <p className="text-sm font-medium">Current session</p>
                        <p className="text-xs text-gray-500">Chrome on Windows • 192.168.1.100</p>
                      </div>
                      <span className="text-xs text-green-600">Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;