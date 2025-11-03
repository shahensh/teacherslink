import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Save, Eye, Send, AlertCircle } from 'lucide-react';
import { useJobPosting } from '../../context/JobPostingContext';
import { jobApi } from '../../api/jobApi';
import ProgressStepper from './ProgressStepper';
import JobPreview from './JobPreview';
import BasicInfoForm from './forms/BasicInfoForm';
import RequirementsForm from './forms/RequirementsForm';
import BenefitsForm from './forms/BenefitsForm';
import AdditionalDetailsForm from './forms/AdditionalDetailsForm';
import toast from 'react-hot-toast';

const JobPostingWizard = ({ jobId = null, mode = 'create' }) => {
  const navigate = useNavigate();
  const {
    formData,
    currentStep,
    totalSteps,
    isSubmitting,
    isSaving,
    hasUnsavedChanges,
    lastSaved,
    validationErrors,
    updateFormData,
    nextStep,
    prevStep,
    setStep,
    validateStep,
    createJob,
    updateJob,
    resetForm
  } = useJobPosting();

  const [showPreview, setShowPreview] = useState(false);
  const [isDraft, setIsDraft] = useState(false);

  const stepComponents = [
    BasicInfoForm,
    RequirementsForm,
    BenefitsForm,
    AdditionalDetailsForm
  ];

  const stepTitles = [
    'Basic Information',
    'Requirements & Skills',
    'Compensation & Benefits',
    'Additional Details'
  ];

  useEffect(() => {
    // Auto-save functionality
    if (hasUnsavedChanges) {
      const timer = setTimeout(() => {
        handleSaveDraft();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [hasUnsavedChanges]);

  // Prefill form in edit mode
  useEffect(() => {
    const loadJobForEdit = async () => {
      if (mode !== 'edit' || !jobId) return;
      try {
        const response = await jobApi.getJob(jobId);
        const job = response.data || response;
        if (!job) return;

        // Map API job to form structure
        const mapped = {
          basicInfo: {
            title: job.title || '',
            department: job.department || '',
            employmentType: job.employmentType || 'full-time',
            startDate: job.startDate ? new Date(job.startDate).toISOString().split('T')[0] : '',
            applicationDeadline: job.applicationDeadline ? new Date(job.applicationDeadline).toISOString().split('T')[0] : '',
            city: job.location?.city || '',
            state: job.location?.state || ''
          },
          requirements: {
            education: job.requirements?.education || '',
            experience: job.requirements?.experience || '',
            certifications: job.requirements?.certifications || [],
            skills: job.requirements?.skills || []
          },
          benefits: {
            salary: {
              min: job.salary?.min ?? '',
              max: job.salary?.max ?? '',
              currency: job.salary?.currency || 'USD',
              negotiable: !!job.salary?.negotiable
            },
            benefits: job.benefits || [],
            perks: job.perks || []
          },
          additionalDetails: {
            description: job.description || '',
            responsibilities: job.responsibilities || [],
            location: {
              remote: !!job.location?.remote,
              hybrid: !!job.location?.hybrid,
              address: job.location?.address || '',
              city: job.location?.city || '',
              state: job.location?.state || '',
              zipCode: job.location?.zipCode || '',
              country: job.location?.country || 'United States'
            },
            schedule: {
              hours: job.schedule?.hours || '',
              days: job.schedule?.days || [],
              flexibility: job.schedule?.flexibility || 'Fixed'
            },
            applicationProcess: {
              steps: job.applicationProcess?.steps || [],
              documents: job.applicationProcess?.documents || [],
              interviewProcess: job.applicationProcess?.interviewProcess || ''
            },
            tags: job.tags || [],
            urgent: !!job.urgent,
            internalNotes: job.internalNotes || ''
          }
        };

        // Load into context
        updateFormData('basicInfo', mapped.basicInfo);
        updateFormData('requirements', mapped.requirements);
        updateFormData('benefits', mapped.benefits);
        updateFormData('additionalDetails', mapped.additionalDetails);
      } catch (err) {
        console.error('Failed to load job for edit:', err);
        toast.error('Failed to load draft job');
      }
    };

    loadJobForEdit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, jobId]);

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps - 1) {
        nextStep();
      } else {
        handleSubmit();
      }
    } else {
      toast.error('Please fix the validation errors before proceeding');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      prevStep();
    }
  };

  const handleStepClick = (step) => {
    if (step < currentStep || validateStep(currentStep)) {
      setStep(step);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setIsDraft(true);
      // Here you would implement draft saving logic
      toast.success('Draft saved successfully');
    } catch (error) {
      toast.error('Failed to save draft');
    } finally {
      setIsDraft(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const jobData = {
        ...formData.basicInfo,
        requirements: formData.requirements,
        salary: formData.benefits.salary,
        benefits: formData.benefits.benefits,
        perks: formData.benefits.perks,
        location: {
          ...formData.additionalDetails.location,
          city: formData.basicInfo.city,
          state: formData.basicInfo.state
        },
        schedule: formData.additionalDetails.schedule,
        description: formData.additionalDetails.description,
        responsibilities: formData.additionalDetails.responsibilities,
        applicationProcess: formData.additionalDetails.applicationProcess,
        tags: formData.additionalDetails.tags,
        urgent: formData.additionalDetails.urgent,
        internalNotes: formData.additionalDetails.internalNotes
      };

      if (mode === 'create') {
        await createJob(jobData);
        navigate('/school/jobs');
      } else {
        await updateJob(jobId, jobData);
        navigate('/school/jobs');
      }
    } catch (error) {
      console.error('Error submitting job:', error);
    }
  };

  const handlePublish = async () => {
    try {
      const jobData = {
        ...formData.basicInfo,
        requirements: formData.requirements,
        salary: formData.benefits.salary,
        benefits: formData.benefits.benefits,
        perks: formData.benefits.perks,
        location: {
          ...formData.additionalDetails.location,
          city: formData.basicInfo.city,
          state: formData.basicInfo.state
        },
        schedule: formData.additionalDetails.schedule,
        description: formData.additionalDetails.description,
        responsibilities: formData.additionalDetails.responsibilities,
        applicationProcess: formData.additionalDetails.applicationProcess,
        tags: formData.additionalDetails.tags,
        urgent: formData.additionalDetails.urgent,
        internalNotes: formData.additionalDetails.internalNotes
      };

      if (mode === 'create') {
        const created = await createJob(jobData);
        const newJobId = created?.data?._id || created?.data?.id;
        if (newJobId) {
          await jobApi.publishJob(newJobId);
        }
        navigate('/school/jobs');
      } else {
        await updateJob(jobId, jobData);
        await jobApi.publishJob(jobId);
        navigate('/school/jobs');
      }
    } catch (error) {
      console.error('Error publishing job:', error);
    }
  };

  const CurrentStepComponent = stepComponents[currentStep];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {mode === 'create' ? 'Post a New Job' : 'Edit Job Posting'}
              </h1>
              <p className="text-gray-600 mt-2">
                {mode === 'create' 
                  ? 'Create an attractive job posting to find the best candidates'
                  : 'Update your job posting details'
                }
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              {/* Auto-save indicator */}
              {hasUnsavedChanges && (
                <div className="flex items-center text-orange-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Unsaved changes
                </div>
              )}
              
              {lastSaved && (
                <div className="text-green-600 text-sm">
                  Saved {new Date(lastSaved).toLocaleTimeString()}
                </div>
              )}

              {/* Preview Button */}
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Eye className="w-4 h-4 mr-2" />
                {showPreview ? 'Hide Preview' : 'Preview'}
              </button>

              {/* Save Draft Button */}
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Draft'}
              </button>
            </div>
          </div>
        </div>

        {/* Progress Stepper */}
        <ProgressStepper
          currentStep={currentStep}
          totalSteps={totalSteps}
          steps={stepTitles.map((title, index) => ({
            id: index,
            title,
            description: `Step ${index + 1} of ${totalSteps}`
          }))}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {stepTitles[currentStep]}
                </h2>
                <p className="text-gray-600 mt-1">
                  Step {currentStep + 1} of {totalSteps}
                </p>
              </div>

              <CurrentStepComponent
                formData={formData}
                updateFormData={updateFormData}
                errors={{}}
                validationErrors={validationErrors}
              />

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t">
                <button
                  type="button"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  className="flex items-center px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </button>

                <div className="flex items-center space-x-3">
                  {currentStep === totalSteps - 1 ? (
                    <>
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {isSubmitting ? 'Saving...' : 'Save as Draft'}
                      </button>
                      <button
                        type="button"
                        onClick={handlePublish}
                        disabled={isSubmitting}
                        className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {isSubmitting ? 'Publishing...' : 'Publish Job'}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Preview Sidebar */}
          <div className="lg:col-span-1">
            {showPreview ? (
              <div className="sticky top-8">
                <JobPreview formData={formData} />
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Tips</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">💡 Writing Tips</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Use clear, specific language</li>
                      <li>• Highlight unique benefits</li>
                      <li>• Be transparent about requirements</li>
                      <li>• Include growth opportunities</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">📈 Best Practices</h4>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>• Set realistic deadlines</li>
                      <li>• Include salary ranges</li>
                      <li>• Mention school culture</li>
                      <li>• Be specific about location</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-medium text-yellow-900 mb-2">⚠️ Common Mistakes</h4>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      <li>• Vague job descriptions</li>
                      <li>• Unrealistic requirements</li>
                      <li>• Missing salary information</li>
                      <li>• Unclear application process</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobPostingWizard;




