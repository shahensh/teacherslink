import React, { useState } from 'react';
import { FileText, MapPin, Clock, List, Plus, X, AlertCircle, Building } from 'lucide-react';

const AdditionalDetailsForm = ({ formData, updateFormData, errors, validationErrors }) => {
  const [newResponsibility, setNewResponsibility] = useState('');
  const [newStep, setNewStep] = useState('');
  const [newDocument, setNewDocument] = useState('');

  const handleInputChange = (field, value) => {
    updateFormData('additionalDetails', {
      [field]: value
    });
  };

  const handleNestedInputChange = (section, field, value) => {
    updateFormData('additionalDetails', {
      [section]: {
        ...formData.additionalDetails[section],
        [field]: value
      }
    });
  };

  const addResponsibility = () => {
    if (newResponsibility.trim() && !formData.additionalDetails.responsibilities.includes(newResponsibility.trim())) {
      const updatedResponsibilities = [...formData.additionalDetails.responsibilities, newResponsibility.trim()];
      updateFormData('additionalDetails', { responsibilities: updatedResponsibilities });
      setNewResponsibility('');
    }
  };

  const removeResponsibility = (index) => {
    const updatedResponsibilities = formData.additionalDetails.responsibilities.filter((_, i) => i !== index);
    updateFormData('additionalDetails', { responsibilities: updatedResponsibilities });
  };

  const addStep = () => {
    if (newStep.trim() && !formData.additionalDetails.applicationProcess.steps.includes(newStep.trim())) {
      const updatedSteps = [...formData.additionalDetails.applicationProcess.steps, newStep.trim()];
      updateFormData('additionalDetails', {
        applicationProcess: {
          ...formData.additionalDetails.applicationProcess,
          steps: updatedSteps
        }
      });
      setNewStep('');
    }
  };

  const removeStep = (index) => {
    const updatedSteps = formData.additionalDetails.applicationProcess.steps.filter((_, i) => i !== index);
    updateFormData('additionalDetails', {
      applicationProcess: {
        ...formData.additionalDetails.applicationProcess,
        steps: updatedSteps
      }
    });
  };

  const addDocument = () => {
    if (newDocument.trim() && !formData.additionalDetails.applicationProcess.documents.includes(newDocument.trim())) {
      const updatedDocuments = [...formData.additionalDetails.applicationProcess.documents, newDocument.trim()];
      updateFormData('additionalDetails', {
        applicationProcess: {
          ...formData.additionalDetails.applicationProcess,
          documents: updatedDocuments
        }
      });
      setNewDocument('');
    }
  };

  const removeDocument = (index) => {
    const updatedDocuments = formData.additionalDetails.applicationProcess.documents.filter((_, i) => i !== index);
    updateFormData('additionalDetails', {
      applicationProcess: {
        ...formData.additionalDetails.applicationProcess,
        documents: updatedDocuments
      }
    });
  };

  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    }
  };

  const commonResponsibilities = [
    'Develop and implement lesson plans', 'Assess student progress and provide feedback',
    'Maintain classroom discipline and order', 'Communicate with parents and guardians',
    'Participate in professional development', 'Collaborate with other teachers and staff',
    'Use technology to enhance learning', 'Create a positive learning environment',
    'Adapt teaching methods to meet student needs', 'Maintain accurate student records'
  ];

  const commonSteps = [
    'Submit online application', 'Upload resume and cover letter',
    'Complete initial screening', 'Participate in phone/video interview',
    'In-person interview with hiring committee', 'Teaching demonstration',
    'Reference checks', 'Background check', 'Final decision and offer'
  ];

  const commonDocuments = [
    'Resume/CV', 'Cover Letter', 'Teaching License', 'College Transcripts',
    'Letters of Recommendation', 'Portfolio/Sample Work', 'Background Check',
    'Health Certificate', 'References List', 'Teaching Philosophy Statement'
  ];

  const addCommonResponsibility = (responsibility) => {
    if (!formData.additionalDetails.responsibilities.includes(responsibility)) {
      const updatedResponsibilities = [...formData.additionalDetails.responsibilities, responsibility];
      updateFormData('additionalDetails', { responsibilities: updatedResponsibilities });
    }
  };

  const addCommonStep = (step) => {
    if (!formData.additionalDetails.applicationProcess.steps.includes(step)) {
      const updatedSteps = [...formData.additionalDetails.applicationProcess.steps, step];
      updateFormData('additionalDetails', {
        applicationProcess: {
          ...formData.additionalDetails.applicationProcess,
          steps: updatedSteps
        }
      });
    }
  };

  const addCommonDocument = (document) => {
    if (!formData.additionalDetails.applicationProcess.documents.includes(document)) {
      const updatedDocuments = [...formData.additionalDetails.applicationProcess.documents, document];
      updateFormData('additionalDetails', {
        applicationProcess: {
          ...formData.additionalDetails.applicationProcess,
          documents: updatedDocuments
        }
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Additional Details</h2>
        <p className="text-gray-600">Complete your job posting with detailed information</p>
      </div>

      {/* Job Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Job Description *
        </label>
        <div className="relative">
          <FileText className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
          <textarea
            id="description"
            value={formData.additionalDetails.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className={`
              w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
              ${validationErrors.description ? 'border-red-500' : 'border-gray-300'}
            `}
            rows={6}
            placeholder="Provide a detailed description of the role, including what makes this position unique and what the successful candidate will accomplish..."
            maxLength={5000}
          />
        </div>
        {validationErrors.description && (
          <div className="flex items-center mt-2 text-red-600">
            <AlertCircle className="w-4 h-4 mr-1" />
            <span className="text-sm">{validationErrors.description}</span>
          </div>
        )}
        <p className="text-xs text-gray-500 mt-1">
          {formData.additionalDetails.description.length}/5000 characters
        </p>
      </div>

      {/* Location Options */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <MapPin className="w-5 h-5 mr-2 text-blue-600" />
          Work Location
        </h3>
        
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.additionalDetails.location.remote}
              onChange={(e) => handleNestedInputChange('location', 'remote', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Remote</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.additionalDetails.location.hybrid}
              onChange={(e) => handleNestedInputChange('location', 'hybrid', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">In School</span>
          </label>
        </div>
      </div>

      {/* Schedule */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-green-600" />
          Work Schedule
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="hours" className="block text-sm font-medium text-gray-700 mb-2">
              Working Hours
            </label>
            <input
              type="text"
              id="hours"
              value={formData.additionalDetails.schedule.hours}
              onChange={(e) => handleNestedInputChange('schedule', 'hours', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 8:00 AM - 4:00 PM"
            />
          </div>
          
          <div>
            <label htmlFor="flexibility" className="block text-sm font-medium text-gray-700 mb-2">
              Schedule Flexibility
            </label>
            <select
              id="flexibility"
              value={formData.additionalDetails.schedule.flexibility}
              onChange={(e) => handleNestedInputChange('schedule', 'flexibility', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Fixed">Fixed Schedule</option>
              <option value="Flexible">Flexible Schedule</option>
              <option value="Part-time flexible">Part-time Flexible</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Responsibilities */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <List className="w-5 h-5 mr-2 text-purple-600" />
          Key Responsibilities
        </h3>
        
        {/* Add New Responsibility */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newResponsibility}
            onChange={(e) => setNewResponsibility(e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, addResponsibility)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Add a responsibility (e.g., Develop lesson plans)"
          />
          <button
            type="button"
            onClick={addResponsibility}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Common Responsibilities */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Common Responsibilities:</p>
          <div className="flex flex-wrap gap-2">
            {commonResponsibilities.map((responsibility) => (
              <button
                key={responsibility}
                type="button"
                onClick={() => addCommonResponsibility(responsibility)}
                disabled={formData.additionalDetails.responsibilities.includes(responsibility)}
                className={`
                  px-3 py-1 text-xs rounded-full border transition-colors
                  ${formData.additionalDetails.responsibilities.includes(responsibility)
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-purple-50 hover:border-purple-300'
                  }
                `}
              >
                {responsibility}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Responsibilities */}
        {formData.additionalDetails.responsibilities.length > 0 && (
          <div>
            <p className="text-sm text-gray-600 mb-2">Selected Responsibilities:</p>
            <ul className="space-y-2">
              {formData.additionalDetails.responsibilities.map((responsibility, index) => (
                <li key={index} className="flex items-start">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3 flex-shrink-0" />
                  <span className="text-gray-700 flex-1">{responsibility}</span>
                  <button
                    type="button"
                    onClick={() => removeResponsibility(index)}
                    className="ml-2 text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Application Process */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Building className="w-5 h-5 mr-2 text-orange-600" />
          Application Process
        </h3>
        
        {/* Application Steps */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Application Steps</h4>
          
          {/* Add New Step */}
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newStep}
              onChange={(e) => setNewStep(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, addStep)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add a step (e.g., Submit application)"
            />
            <button
              type="button"
              onClick={addStep}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Common Steps */}
          <div className="mb-3">
            <p className="text-sm text-gray-600 mb-2">Common Steps:</p>
            <div className="flex flex-wrap gap-2">
              {commonSteps.map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => addCommonStep(step)}
                  disabled={formData.additionalDetails.applicationProcess.steps.includes(step)}
                  className={`
                    px-3 py-1 text-xs rounded-full border transition-colors
                    ${formData.additionalDetails.applicationProcess.steps.includes(step)
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-orange-50 hover:border-orange-300'
                    }
                  `}
                >
                  {step}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Steps */}
          {formData.additionalDetails.applicationProcess.steps.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Selected Steps:</p>
              <ol className="space-y-2">
                {formData.additionalDetails.applicationProcess.steps.map((step, index) => (
                  <li key={index} className="flex items-start">
                    <span className="w-6 h-6 bg-orange-600 text-white text-sm rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-gray-700 flex-1">{step}</span>
                    <button
                      type="button"
                      onClick={() => removeStep(index)}
                      className="ml-2 text-red-600 hover:text-red-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* Required Documents */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Required Documents</h4>
          
          {/* Add New Document */}
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newDocument}
              onChange={(e) => setNewDocument(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, addDocument)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add a document (e.g., Resume)"
            />
            <button
              type="button"
              onClick={addDocument}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Common Documents */}
          <div className="mb-3">
            <p className="text-sm text-gray-600 mb-2">Common Documents:</p>
            <div className="flex flex-wrap gap-2">
              {commonDocuments.map((document) => (
                <button
                  key={document}
                  type="button"
                  onClick={() => addCommonDocument(document)}
                  disabled={formData.additionalDetails.applicationProcess.documents.includes(document)}
                  className={`
                    px-3 py-1 text-xs rounded-full border transition-colors
                    ${formData.additionalDetails.applicationProcess.documents.includes(document)
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300'
                    }
                  `}
                >
                  {document}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Documents */}
          {formData.additionalDetails.applicationProcess.documents.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Selected Documents:</p>
              <div className="flex flex-wrap gap-2">
                {formData.additionalDetails.applicationProcess.documents.map((document, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {document}
                    <button
                      type="button"
                      onClick={() => removeDocument(index)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Interview Process */}
        <div>
          <label htmlFor="interviewProcess" className="block text-sm font-medium text-gray-700 mb-2">
            Interview Process Description
          </label>
          <textarea
            id="interviewProcess"
            value={formData.additionalDetails.applicationProcess.interviewProcess}
            onChange={(e) => handleNestedInputChange('applicationProcess', 'interviewProcess', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            placeholder="Describe the interview process, including number of rounds, types of interviews, and timeline..."
          />
        </div>
      </div>

      {/* Internal Notes */}
      <div>
        <label htmlFor="internalNotes" className="block text-sm font-medium text-gray-700 mb-2">
          Internal Notes (Optional)
        </label>
        <textarea
          id="internalNotes"
          value={formData.additionalDetails.internalNotes}
          onChange={(e) => handleInputChange('internalNotes', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
          placeholder="Add any internal notes or special instructions for your team..."
        />
        <p className="text-xs text-gray-500 mt-1">
          These notes will not be visible to applicants
        </p>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">💡 Tips for Better Results</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Write a compelling job description that highlights your school's culture</li>
          <li>• Be specific about responsibilities and expectations</li>
          <li>• Clearly outline the application process to set candidate expectations</li>
          <li>• Include all required documents to streamline the application process</li>
        </ul>
      </div>
    </div>
  );
};

export default AdditionalDetailsForm;
