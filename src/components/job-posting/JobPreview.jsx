import React from 'react';
import { MapPin, Clock, DollarSign, Users, Calendar, Briefcase, Award, Star } from 'lucide-react';

const JobPreview = ({ formData, isMobile = false }) => {
  const { basicInfo, requirements, benefits, additionalDetails } = formData;

  const formatSalary = () => {
    if (!benefits.salary.min && !benefits.salary.max) return 'Salary not specified';
    
    const min = benefits.salary.min ? `₹${benefits.salary.min.toLocaleString('en-IN')}` : '';
    const max = benefits.salary.max ? `₹${benefits.salary.max.toLocaleString('en-IN')}` : '';
    
    if (min && max) return `${min} - ${max}`;
    if (min) return `${min}+`;
    if (max) return `Up to ${max}`;
    
    return 'Salary not specified';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg border ${isMobile ? 'p-4' : 'p-6'}`}>
      {/* Header */}
      <div className="border-b pb-4 mb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {basicInfo.title || 'Job Title'}
            </h2>
            <p className="text-lg text-gray-600 mb-2">
              {basicInfo.department || 'Department'}
            </p>
            <div className="flex items-center text-sm text-gray-500">
              <Briefcase className="w-4 h-4 mr-1" />
              <span className="capitalize">{basicInfo.employmentType || 'Employment Type'}</span>
            </div>
          </div>
          {additionalDetails.urgent && (
            <div className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
              Urgent
            </div>
          )}
        </div>
      </div>

      {/* Job Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Salary */}
        <div className="flex items-center p-3 bg-green-50 rounded-lg">
          <DollarSign className="w-5 h-5 text-green-600 mr-3" />
          <div>
            <p className="text-sm text-gray-600">Salary</p>
            <p className="font-semibold text-green-700">{formatSalary()}</p>
          </div>
        </div>

        {/* Start Date */}
        <div className="flex items-center p-3 bg-blue-50 rounded-lg">
          <Calendar className="w-5 h-5 text-blue-600 mr-3" />
          <div>
            <p className="text-sm text-gray-600">Start Date</p>
            <p className="font-semibold text-blue-700">{formatDate(basicInfo.startDate)}</p>
          </div>
        </div>

        {/* Application Deadline */}
        <div className="flex items-center p-3 bg-orange-50 rounded-lg">
          <Clock className="w-5 h-5 text-orange-600 mr-3" />
          <div>
            <p className="text-sm text-gray-600">Application Deadline</p>
            <p className="font-semibold text-orange-700">{formatDate(basicInfo.applicationDeadline)}</p>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center p-3 bg-purple-50 rounded-lg">
          <MapPin className="w-5 h-5 text-purple-600 mr-3" />
          <div>
            <p className="text-sm text-gray-600">Location</p>
            <p className="font-semibold text-purple-700">
              {basicInfo.city && basicInfo.state 
                ? `${basicInfo.city}, ${basicInfo.state}` 
                : 'Location not specified'}
            </p>
            <p className="text-xs text-purple-600 mt-0.5">
              {additionalDetails.location.remote ? '📍 Remote' : 
               additionalDetails.location.hybrid ? '🏫 In School' : '🏢 On-site'}
            </p>
          </div>
        </div>
      </div>

      {/* Description */}
      {additionalDetails.description && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Job Description</h3>
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 leading-relaxed">
              {additionalDetails.description}
            </p>
          </div>
        </div>
      )}

      {/* Requirements */}
      {(requirements.education || requirements.experience || requirements.skills.length > 0) && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Requirements</h3>
          <div className="space-y-3">
            {requirements.education && (
              <div className="flex items-start">
                <Award className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Education</p>
                  <p className="text-gray-700">{requirements.education}</p>
                </div>
              </div>
            )}
            
            {requirements.experience && (
              <div className="flex items-start">
                <Users className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Experience</p>
                  <p className="text-gray-700">{requirements.experience}</p>
                </div>
              </div>
            )}
            
            {requirements.skills.length > 0 && (
              <div className="flex items-start">
                <Star className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Skills</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {requirements.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Responsibilities */}
      {additionalDetails.responsibilities.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Responsibilities</h3>
          <ul className="space-y-2">
            {additionalDetails.responsibilities.map((responsibility, index) => (
              <li key={index} className="flex items-start">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0" />
                <span className="text-gray-700">{responsibility}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Benefits */}
      {(benefits.benefits.length > 0 || benefits.perks.length > 0) && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Benefits & Perks</h3>
          
          {benefits.benefits.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Benefits</h4>
              <div className="flex flex-wrap gap-2">
                {benefits.benefits.map((benefit, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                  >
                    {benefit}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {benefits.perks.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Perks</h4>
              <div className="flex flex-wrap gap-2">
                {benefits.perks.map((perk, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full"
                  >
                    {perk}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Application Process */}
      {additionalDetails.applicationProcess.steps.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Application Process</h3>
          <ol className="space-y-2">
            {additionalDetails.applicationProcess.steps.map((step, index) => (
              <li key={index} className="flex items-start">
                <span className="w-6 h-6 bg-blue-600 text-white text-sm rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                  {index + 1}
                </span>
                <span className="text-gray-700">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Tags */}
      {additionalDetails.tags.length > 0 && (
        <div className="border-t pt-4">
          <div className="flex flex-wrap gap-2">
            {additionalDetails.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default JobPreview;




