import React from 'react';
import { AlertTriangle, X, CheckCircle, Info } from 'lucide-react';

const ContentModerationModal = ({ 
  isOpen, 
  onClose, 
  violations, 
  onApprove, 
  onReject,
  type = 'error' // 'error', 'warning', 'info'
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="w-6 h-6 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
      case 'info':
        return <Info className="w-6 h-6 text-blue-500" />;
      default:
        return <AlertTriangle className="w-6 h-6 text-red-500" />;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'error':
        return 'Content Not Allowed';
      case 'warning':
        return 'Content Review Required';
      case 'info':
        return 'Content Notice';
      default:
        return 'Content Review';
    }
  };

  const getMessage = () => {
    switch (type) {
      case 'error':
        return 'Your post contains inappropriate content and cannot be published. Please review our community guidelines and try again.';
      case 'warning':
        return 'Your post may contain questionable content. Please review before publishing.';
      case 'info':
        return 'Your post has been reviewed and approved.';
      default:
        return 'Your post requires review.';
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case 'error':
        return 'bg-red-600 hover:bg-red-700';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700';
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700';
      default:
        return 'bg-gray-600 hover:bg-gray-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            {getIcon()}
            <h3 className="text-lg font-semibold text-gray-900">{getTitle()}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 mb-4">{getMessage()}</p>
          
          {violations && violations.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Issues Found:</h4>
              <ul className="space-y-1">
                {violations.map((violation, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>{violation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Community Guidelines */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Community Guidelines:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• No profanity or vulgar language</li>
              <li>• No inappropriate images or content</li>
              <li>• No spam or promotional content</li>
              <li>• Respect other users and maintain professionalism</li>
              <li>• No personal information or contact details</li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          {type === 'warning' && onApprove && (
            <button
              onClick={onApprove}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Publish Anyway
            </button>
          )}
          
          <button
            onClick={onReject || onClose}
            className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors ${getButtonColor()}`}
          >
            {type === 'error' ? 'Edit Post' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContentModerationModal;
