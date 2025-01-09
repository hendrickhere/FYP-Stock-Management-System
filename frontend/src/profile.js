import React, { useState, useEffect, useContext } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/card';
import Header from './header';
import Sidebar from './sidebar';
import { User, Mail, Shield } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import axios from './axiosConfig';
import { GlobalContext } from './globalContext';
import { motion } from 'framer-motion';
import { useScrollDirection } from './useScrollDirection';

const syncedTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
  delay: 0,
  duration: 0.3,
};

function Profile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const { scrollDirection, isAtTop } = useScrollDirection();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex flex-col h-screen w-full">
      <Header scrollDirection={scrollDirection} isAtTop={isAtTop} /> 
      <div className="flex flex-row flex-grow">
        <Sidebar scrollDirection={scrollDirection} isAtTop={isAtTop} />
        <MainContent isMobile={isMobile} scrollDirection={scrollDirection} isAtTop={isAtTop} />
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
}

function MainContent({ isMobile, scrollDirection, isAtTop }) {
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({});
  const [originalData, setOriginalData] = useState({
    username: '',
    email: '',
    role: ''
  });
  const { username: contextUsername, setUsername: setContextUsername } = useContext(GlobalContext);
  
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    role: ''
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get('/user/current');
        setProfileData(response.data);
        setOriginalData(response.data); 
      } catch (error) {
        toast.error("Failed to load profile data");
      }
    };
  
    fetchUserData();
  }, []);

  const hasDataChanged = () => {
    return profileData.username !== originalData.username || 
           profileData.email !== originalData.email;
  };

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!profileData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!profileData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(profileData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Update to use react-hot-toast
    if (Object.keys(newErrors).length > 0) {
      toast.error("Please check the highlighted fields");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error("Please correct validation errors before saving");
      return;
    }
  
    if (!hasDataChanged()) {
      setIsEditing(false);
      return;
    }
  
    try {
      const response = await axios.put('/user/profile/update', {
        username: profileData.username,
        email: profileData.email
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
  
      if (response.data.success) {
        setContextUsername(profileData.username);
  
        const currentUserData = JSON.parse(sessionStorage.getItem('userData') || '{}');
        const updatedUserData = {
          ...currentUserData,
          username: profileData.username,
          email: profileData.email
        };
        sessionStorage.setItem('userData', JSON.stringify(updatedUserData));
  
        toast.success("Profile updated successfully");
        
        setIsEditing(false);
        setProfileData(prevData => ({
          ...prevData,
          ...response.data.user
        }));
        setOriginalData(response.data.user);
  
        const event = new Event('storage');
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.log('Full error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update profile';
      toast.error(errorMessage);
      
      console.error('Profile update error:', {
        error,
        response: error.response?.data,
        status: error.response?.status
      });
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get('/user/current');
        setProfileData(response.data);
      } catch (error) {
        const errorMessage = error.response?.status === 404 
          ? "Unable to load profile data. Please log in again."
          : "Failed to load profile data. Please try again.";

        toast.error(errorMessage);

        console.error('Profile fetch error:', error);
      }
    };
  
    fetchUserData();
  }, []);

  return (
    <main className="flex-1">
      <div className="scroll-container h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar">
        <motion.div
          className="p-6"
          animate={{
            marginLeft: isMobile 
              ? "0" 
              : scrollDirection === "down" && !isAtTop 
              ? "4rem" 
              : "13rem",
            marginTop: scrollDirection === "down" && !isAtTop ? "0" : "0",
          }}
          transition={syncedTransition}
        >

          {/* Content Area */}
          <motion.div
            className="w-full rounded-lg shadow-sm overflow-hidden"
            animate={{
              width: isMobile
                ? "100%"
                : scrollDirection === "down" && !isAtTop
                ? "calc(100vw - 8rem)"
                : "calc(100vw - 17rem)",
            }}
            transition={syncedTransition}
          >
            <div className="p-6">
              <div className="max-w-2xl mx-auto">
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
                      <div>
                        <input
                          type="text"
                          value={profileData.username}
                          onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                          className="w-full p-2 border rounded-md"
                        />
                        {errors.username && (
                          <p className="text-sm text-red-500 mt-1">{errors.username}</p>
                        )}
                      </div>
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
                      <div>
                        <input
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                          className="w-full p-2 border rounded-md"
                        />
                        {errors.email && (
                          <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                        )}
                      </div>
                    ) : (
                      <p>{profileData.email}</p>
                    )}
                  </div>

                  {/* Role - Display only */}
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
                        disabled={!hasDataChanged()}
                        className={`px-4 py-2 text-sm text-white rounded-md ${
                          hasDataChanged() 
                            ? 'bg-blue-500 hover:bg-blue-600' 
                            : 'bg-gray-400 cursor-not-allowed'
                        }`}
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
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}

export default Profile;