import React from 'react';
import { Calendar, Building, Briefcase, AlertCircle, MapPin } from 'lucide-react';

const BasicInfoForm = ({ formData, updateFormData, errors, validationErrors }) => {
  const departments = [
    'Elementary', 'Middle School', 'High School', 'Special Education',
    'Mathematics', 'Science', 'English', 'Social Studies', 'Art',
    'Music', 'Physical Education', 'Technology', 'Administration',
    'Counseling', 'Library', 'Other'
  ];

  const employmentTypes = [
    { value: 'full-time', label: 'Full-time' },
    { value: 'part-time', label: 'Part-time' },
    { value: 'contract', label: 'Contract' },
    { value: 'substitute', label: 'Substitute' },
    { value: 'temporary', label: 'Temporary' }
  ];

  const handleInputChange = (field, value) => {
    updateFormData('basicInfo', { [field]: value });
  };

  const getMinDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 2);
    return maxDate.toISOString().split('T')[0];
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Basic Job Information</h2>
        <p className="text-gray-600">Let's start with the essential details about your job posting</p>
      </div>

      {/* Job Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Job Title *
        </label>
        <div className="relative">
          <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            id="title"
            value={formData.basicInfo.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className={`
              w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
              ${validationErrors.title ? 'border-red-500' : 'border-gray-300'}
            `}
            placeholder="e.g., Mathematics Teacher, Elementary School Principal"
            maxLength={100}
          />
        </div>
        {validationErrors.title && (
          <div className="flex items-center mt-2 text-red-600">
            <AlertCircle className="w-4 h-4 mr-1" />
            <span className="text-sm">{validationErrors.title}</span>
          </div>
        )}
        <p className="text-xs text-gray-500 mt-1">
          {formData.basicInfo.title.length}/100 characters
        </p>
      </div>

      {/* Department */}
      <div>
        <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
          Department *
        </label>
        <div className="relative">
          <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <select
            id="department"
            value={formData.basicInfo.department}
            onChange={(e) => handleInputChange('department', e.target.value)}
            className={`
              w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
              ${validationErrors.department ? 'border-red-500' : 'border-gray-300'}
            `}
          >
            <option value="">Select Department</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
        {validationErrors.department && (
          <div className="flex items-center mt-2 text-red-600">
            <AlertCircle className="w-4 h-4 mr-1" />
            <span className="text-sm">{validationErrors.department}</span>
          </div>
        )}
      </div>

      {/* Employment Type */}
      <div>
        <label htmlFor="employmentType" className="block text-sm font-medium text-gray-700 mb-2">
          Employment Type *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {employmentTypes.map((type) => (
            <label
              key={type.value}
              className={`
                relative flex items-center p-3 border rounded-lg cursor-pointer transition-all
                ${formData.basicInfo.employmentType === type.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
                }
              `}
            >
              <input
                type="radio"
                name="employmentType"
                value={type.value}
                checked={formData.basicInfo.employmentType === type.value}
                onChange={(e) => handleInputChange('employmentType', e.target.value)}
                className="sr-only"
              />
              <span className="text-sm font-medium">{type.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Job Location */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
        <div className="flex items-center mb-4">
          <MapPin className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Job Location</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Specify the location where the teacher will be working
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* City */}
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
              City *
            </label>
            <input
              type="text"
              id="city"
              value={formData.basicInfo.city || ''}
              onChange={(e) => handleInputChange('city', e.target.value)}
              className={`
                w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
                ${validationErrors.city ? 'border-red-500' : 'border-gray-300'}
              `}
              placeholder="e.g., Hyderabad, Mumbai, Delhi"
            />
            {validationErrors.city && (
              <div className="flex items-center mt-2 text-red-600">
                <AlertCircle className="w-4 h-4 mr-1" />
                <span className="text-sm">{validationErrors.city}</span>
              </div>
            )}
          </div>

          {/* State */}
          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
              State *
            </label>
            <input
              type="text"
              id="state"
              value={formData.basicInfo.state || ''}
              onChange={(e) => handleInputChange('state', e.target.value)}
              className={`
                w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
                ${validationErrors.state ? 'border-red-500' : 'border-gray-300'}
              `}
              placeholder="e.g., Telangana, Maharashtra, Delhi"
            />
            {validationErrors.state && (
              <div className="flex items-center mt-2 text-red-600">
                <AlertCircle className="w-4 h-4 mr-1" />
                <span className="text-sm">{validationErrors.state}</span>
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-3">
          💡 Teachers can filter jobs by location to find opportunities near them
        </p>
      </div>

      {/* Start Date */}
      <div>
        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
          Start Date *
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="date"
            id="startDate"
            value={formData.basicInfo.startDate}
            onChange={(e) => handleInputChange('startDate', e.target.value)}
            min={getMinDate()}
            max={getMaxDate()}
            className={`
              w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
              ${validationErrors.startDate ? 'border-red-500' : 'border-gray-300'}
            `}
          />
        </div>
        {validationErrors.startDate && (
          <div className="flex items-center mt-2 text-red-600">
            <AlertCircle className="w-4 h-4 mr-1" />
            <span className="text-sm">{validationErrors.startDate}</span>
          </div>
        )}
      </div>

      {/* Application Deadline */}
      <div>
        <label htmlFor="applicationDeadline" className="block text-sm font-medium text-gray-700 mb-2">
          Application Deadline *
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="date"
            id="applicationDeadline"
            value={formData.basicInfo.applicationDeadline}
            onChange={(e) => handleInputChange('applicationDeadline', e.target.value)}
            min={getMinDate()}
            max={getMaxDate()}
            className={`
              w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
              ${validationErrors.applicationDeadline ? 'border-red-500' : 'border-gray-300'}
            `}
          />
        </div>
        {validationErrors.applicationDeadline && (
          <div className="flex items-center mt-2 text-red-600">
            <AlertCircle className="w-4 h-4 mr-1" />
            <span className="text-sm">{validationErrors.applicationDeadline}</span>
          </div>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Applications will be accepted until this date
        </p>
      </div>

      {/* Urgent Hiring */}
      <div className="flex items-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <input
          type="checkbox"
          id="urgent"
          checked={formData.additionalDetails.urgent}
          onChange={(e) => updateFormData('additionalDetails', { urgent: e.target.checked })}
          className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
        />
        <label htmlFor="urgent" className="ml-3 text-sm text-yellow-800">
          <span className="font-medium">Urgent Hiring</span>
          <p className="text-xs text-yellow-700 mt-1">
            Mark this job as urgent to attract more candidates quickly
          </p>
        </label>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">💡 Tips for Better Results</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use clear, specific job titles that candidates will search for</li>
          <li>• Set application deadlines at least 2-3 weeks from posting date</li>
          <li>• Mark urgent positions to get priority placement in search results</li>
        </ul>
      </div>
    </div>
  );
};

export default BasicInfoForm;




