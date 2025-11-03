import React, { useState } from 'react';
import { notificationApi } from '../api/notificationApi';
import toast from 'react-hot-toast';

const NotificationTest = () => {
  const [testData, setTestData] = useState({
    userId: '',
    type: 'shortlist',
    title: '🎉 Congratulations! You\'ve been shortlisted!',
    message: 'Your application has been shortlisted by ABC International School. They are interested in your profile and may contact you soon.',
    schoolName: 'ABC International School',
    jobTitle: 'Mathematics Teacher'
  });

  const handleSendTestNotification = async () => {
    try {
      const response = await notificationApi.createNotification({
        userId: testData.userId,
        type: testData.type,
        title: testData.title,
        message: testData.message,
        data: {
          schoolName: testData.schoolName,
          jobTitle: testData.jobTitle
        }
      });

      if (response.success) {
        toast.success('Test notification sent successfully!');
      } else {
        toast.error('Failed to send test notification');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error('Error sending test notification: ' + error.message);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Test Notification System</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Teacher User ID
          </label>
          <input
            type="text"
            value={testData.userId}
            onChange={(e) => setTestData({...testData, userId: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter teacher's user ID"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notification Type
          </label>
          <select
            value={testData.type}
            onChange={(e) => setTestData({...testData, type: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="shortlist">Shortlist</option>
            <option value="reject">Reject</option>
            <option value="interview">Interview</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            value={testData.title}
            onChange={(e) => setTestData({...testData, title: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <textarea
            value={testData.message}
            onChange={(e) => setTestData({...testData, message: e.target.value})}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            School Name
          </label>
          <input
            type="text"
            value={testData.schoolName}
            onChange={(e) => setTestData({...testData, schoolName: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Job Title
          </label>
          <input
            type="text"
            value={testData.jobTitle}
            onChange={(e) => setTestData({...testData, jobTitle: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={handleSendTestNotification}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          Send Test Notification
        </button>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-md">
        <h3 className="font-medium text-gray-800 mb-2">How to Test:</h3>
        <ol className="text-sm text-gray-600 space-y-1">
          <li>1. Get a teacher's user ID from the database</li>
          <li>2. Fill in the form above</li>
          <li>3. Click "Send Test Notification"</li>
          <li>4. The teacher should see the notification in real-time</li>
        </ol>
      </div>
    </div>
  );
};

export default NotificationTest;



