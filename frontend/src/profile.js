import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/card';
import Header from './header';
import Sidebar from './sidebar';
import { User, Mail, Shield } from 'lucide-react';

function Profile() {
  return (
    <div className="flex flex-col h-screen w-full">
      <Header /> 
      <div className="flex flex-row flex-grow">
        <Sidebar />
        <MainContent />
      </div>
    </div>
  );
}

function MainContent() {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    username: 'johndoe',
    email: 'john.doe@example.com',
    role: 'manager' 
  });

  const handleSave = () => {
    
    setIsEditing(false);
  };

  return (
    <div className="flex-auto ml-52 p-8">
      <div className="max-w-2xl">
        {/* Profile Header */}
        <div className="flex items-center gap-6 mb-8">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
            <User className="w-10 h-10 text-gray-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold capitalize">{profileData.username}</h1>
            <p className="text-gray-500 capitalize">{profileData.role}</p>
          </div>
        </div>

        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Username */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-500">
                <User className="w-4 h-4" />
                <span className="text-sm">Username</span>
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.username}
                  onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                  className="w-full p-2 border rounded-md"
                />
              ) : (
                <p>{profileData.username}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-500">
                <Mail className="w-4 h-4" />
                <span className="text-sm">Email</span>
              </div>
              {isEditing ? (
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                  className="w-full p-2 border rounded-md"
                />
              ) : (
                <p>{profileData.email}</p>
              )}
            </div>

            {/* Role - Display only, not editable */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-500">
                <Shield className="w-4 h-4" />
                <span className="text-sm">Role</span>
              </div>
              <p className="capitalize">{profileData.role}</p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-4">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Save Changes
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Edit Profile
              </button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default Profile;