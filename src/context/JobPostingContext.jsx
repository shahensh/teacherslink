import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { jobApi } from '../api/jobApi';
import toast from 'react-hot-toast';

const JobPostingContext = createContext();

// Initial state
const initialState = {
  // Form data
  formData: {
    basicInfo: {
      title: '',
      department: '',
      employmentType: 'full-time',
      startDate: '',
      applicationDeadline: '',
      city: '',
      state: ''
    },
    requirements: {
      education: '',
      experience: '',
      certifications: [],
      skills: []
    },
    benefits: {
      salary: {
        min: '',
        max: '',
        currency: 'USD',
        negotiable: false
      },
      benefits: [],
      perks: []
    },
    additionalDetails: {
      description: '',
      responsibilities: [],
      location: {
        remote: false,
        hybrid: false
      },
      schedule: {
        hours: '',
        days: [],
        flexibility: 'Fixed'
      },
      applicationProcess: {
        steps: [],
        documents: [],
        interviewProcess: ''
      },
      tags: [],
      urgent: false,
      internalNotes: ''
    }
  },
  
  // UI state
  currentStep: 0,
  totalSteps: 4,
  isDraft: false,
  isSubmitting: false,
  isSaving: false,
  
  // Templates
  templates: [],
  selectedTemplate: null,
  templateCategories: [],
  
  // Analytics
  analytics: null,
  
  // Auto-save
  lastSaved: null,
  hasUnsavedChanges: false,
  
  // Error handling
  errors: {},
  validationErrors: {}
};

// Action types
const actionTypes = {
  // Form actions
  UPDATE_FORM_DATA: 'UPDATE_FORM_DATA',
  SET_FORM_DATA: 'SET_FORM_DATA',
  RESET_FORM: 'RESET_FORM',
  
  // Step actions
  NEXT_STEP: 'NEXT_STEP',
  PREV_STEP: 'PREV_STEP',
  SET_STEP: 'SET_STEP',
  
  // Template actions
  SET_TEMPLATES: 'SET_TEMPLATES',
  SELECT_TEMPLATE: 'SELECT_TEMPLATE',
  SET_TEMPLATE_CATEGORIES: 'SET_TEMPLATE_CATEGORIES',
  
  // State actions
  SET_LOADING: 'SET_LOADING',
  SET_SUBMITTING: 'SET_SUBMITTING',
  SET_SAVING: 'SET_SAVING',
  SET_DRAFT: 'SET_DRAFT',
  
  // Auto-save actions
  SET_LAST_SAVED: 'SET_LAST_SAVED',
  SET_UNSAVED_CHANGES: 'SET_UNSAVED_CHANGES',
  
  // Error actions
  SET_ERRORS: 'SET_ERRORS',
  CLEAR_ERRORS: 'CLEAR_ERRORS',
  SET_VALIDATION_ERRORS: 'SET_VALIDATION_ERRORS',
  
  // Analytics actions
  SET_ANALYTICS: 'SET_ANALYTICS'
};

// Reducer
const jobPostingReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.UPDATE_FORM_DATA:
      console.log('Reducer: UPDATE_FORM_DATA', action.section, action.data);
      return {
        ...state,
        formData: {
          ...state.formData,
          [action.section]: {
            ...state.formData[action.section],
            ...action.data
          }
        },
        hasUnsavedChanges: true
      };
    
    case actionTypes.SET_FORM_DATA:
      return {
        ...state,
        formData: action.data,
        hasUnsavedChanges: false
      };
    
    case actionTypes.RESET_FORM:
      return {
        ...state,
        formData: initialState.formData,
        currentStep: 0,
        isDraft: false,
        hasUnsavedChanges: false,
        errors: {},
        validationErrors: {}
      };
    
    case actionTypes.NEXT_STEP:
      return {
        ...state,
        currentStep: Math.min(state.currentStep + 1, state.totalSteps - 1)
      };
    
    case actionTypes.PREV_STEP:
      return {
        ...state,
        currentStep: Math.max(state.currentStep - 1, 0)
      };
    
    case actionTypes.SET_STEP:
      return {
        ...state,
        currentStep: action.step
      };
    
    case actionTypes.SET_TEMPLATES:
      return {
        ...state,
        templates: action.templates
      };
    
    case actionTypes.SELECT_TEMPLATE:
      return {
        ...state,
        selectedTemplate: action.template,
        formData: action.template ? {
          ...initialState.formData,
          ...action.template.templateData
        } : state.formData,
        hasUnsavedChanges: !!action.template
      };
    
    case actionTypes.SET_TEMPLATE_CATEGORIES:
      return {
        ...state,
        templateCategories: action.categories
      };
    
    case actionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.loading
      };
    
    case actionTypes.SET_SUBMITTING:
      return {
        ...state,
        isSubmitting: action.submitting
      };
    
    case actionTypes.SET_SAVING:
      return {
        ...state,
        isSaving: action.saving
      };
    
    case actionTypes.SET_DRAFT:
      return {
        ...state,
        isDraft: action.isDraft
      };
    
    case actionTypes.SET_LAST_SAVED:
      return {
        ...state,
        lastSaved: action.timestamp,
        hasUnsavedChanges: false
      };
    
    case actionTypes.SET_UNSAVED_CHANGES:
      return {
        ...state,
        hasUnsavedChanges: action.hasChanges
      };
    
    case actionTypes.SET_ERRORS:
      return {
        ...state,
        errors: action.errors
      };
    
    case actionTypes.CLEAR_ERRORS:
      return {
        ...state,
        errors: {},
        validationErrors: {}
      };
    
    case actionTypes.SET_VALIDATION_ERRORS:
      return {
        ...state,
        validationErrors: action.errors
      };
    
    case actionTypes.SET_ANALYTICS:
      return {
        ...state,
        analytics: action.analytics
      };
    
    default:
      return state;
  }
};

// Provider component
export const JobPostingProvider = ({ children }) => {
  const [state, dispatch] = useReducer(jobPostingReducer, initialState);

  // Actions
  const actions = {
    // Form actions
    updateFormData: (section, data) => {
      console.log('Updating form data:', section, data);
      dispatch({ type: actionTypes.UPDATE_FORM_DATA, section, data });
    },

    setFormData: (data) => {
      dispatch({ type: actionTypes.SET_FORM_DATA, data });
    },

    resetForm: () => {
      dispatch({ type: actionTypes.RESET_FORM });
    },

    // Step actions
    nextStep: () => {
      dispatch({ type: actionTypes.NEXT_STEP });
    },

    prevStep: () => {
      dispatch({ type: actionTypes.PREV_STEP });
    },

    setStep: (step) => {
      dispatch({ type: actionTypes.SET_STEP, step });
    },

    // Template actions
    loadTemplates: async (params = {}) => {
      try {
        const response = await jobApi.getTemplates(params);
        dispatch({ type: actionTypes.SET_TEMPLATES, templates: response.data });
        return response.data;
      } catch (error) {
        console.error('Error loading templates:', error);
        toast.error('Failed to load templates');
        return [];
      }
    },

    selectTemplate: (template) => {
      dispatch({ type: actionTypes.SELECT_TEMPLATE, template });
    },

    loadTemplateCategories: async () => {
      try {
        const response = await jobApi.getTemplateCategories();
        dispatch({ type: actionTypes.SET_TEMPLATE_CATEGORIES, categories: response.data });
        return response.data;
      } catch (error) {
        console.error('Error loading template categories:', error);
        return [];
      }
    },

    // Job actions
    createJob: async (jobData) => {
      dispatch({ type: actionTypes.SET_SUBMITTING, submitting: true });
      try {
        const response = await jobApi.createJob(jobData);
        dispatch({ type: actionTypes.SET_LAST_SAVED, timestamp: new Date() });
        toast.success('Job created successfully!');
        return response;
      } catch (error) {
        console.error('Error creating job:', error);
        toast.error(error.response?.data?.message || 'Failed to create job');
        throw error;
      } finally {
        dispatch({ type: actionTypes.SET_SUBMITTING, submitting: false });
      }
    },

    updateJob: async (jobId, jobData) => {
      dispatch({ type: actionTypes.SET_SUBMITTING, submitting: true });
      try {
        const response = await jobApi.updateJob(jobId, jobData);
        dispatch({ type: actionTypes.SET_LAST_SAVED, timestamp: new Date() });
        toast.success('Job updated successfully!');
        return response;
      } catch (error) {
        console.error('Error updating job:', error);
        toast.error(error.response?.data?.message || 'Failed to update job');
        throw error;
      } finally {
        dispatch({ type: actionTypes.SET_SUBMITTING, submitting: false });
      }
    },

    // Auto-save functionality
    autoSave: async () => {
      if (!state.hasUnsavedChanges) return;
      
      dispatch({ type: actionTypes.SET_SAVING, saving: true });
      try {
        // Here you would implement auto-save logic
        // For now, we'll just simulate it
        await new Promise(resolve => setTimeout(resolve, 1000));
        dispatch({ type: actionTypes.SET_LAST_SAVED, timestamp: new Date() });
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        dispatch({ type: actionTypes.SET_SAVING, saving: false });
      }
    },

    // Validation
    validateStep: (step) => {
      const errors = {};
      
      switch (step) {
        case 0: // Basic Info
          if (!state.formData.basicInfo.title) errors.title = 'Job title is required';
          if (!state.formData.basicInfo.department) errors.department = 'Department is required';
          if (!state.formData.basicInfo.city) errors.city = 'City is required';
          if (!state.formData.basicInfo.state) errors.state = 'State is required';
          if (!state.formData.basicInfo.startDate) errors.startDate = 'Start date is required';
          if (!state.formData.basicInfo.applicationDeadline) errors.applicationDeadline = 'Application deadline is required';
          break;
        
        case 1: // Requirements
          if (!state.formData.requirements.education) errors.education = 'Education requirement is required';
          if (!state.formData.requirements.experience) errors.experience = 'Experience requirement is required';
          break;
        
        case 2: // Benefits
          // Optional validation for benefits
          break;
        
        case 3: // Additional Details
          if (!state.formData.additionalDetails.description) errors.description = 'Job description is required';
          break;
      }
      
      dispatch({ type: actionTypes.SET_VALIDATION_ERRORS, errors });
      return Object.keys(errors).length === 0;
    },

    // Analytics
    loadAnalytics: async (jobId) => {
      try {
        const response = await jobApi.getJobAnalytics(jobId);
        dispatch({ type: actionTypes.SET_ANALYTICS, analytics: response.data });
        return response.data;
      } catch (error) {
        console.error('Error loading analytics:', error);
        toast.error('Failed to load analytics');
        return null;
      }
    }
  };

  // Auto-save effect
  useEffect(() => {
    if (!state.hasUnsavedChanges) return;

    const timer = setTimeout(() => {
      actions.autoSave();
    }, 5000); // Auto-save after 5 seconds of inactivity

    return () => clearTimeout(timer);
  }, [state.hasUnsavedChanges]);

  const value = {
    ...state,
    ...actions
  };

  // Debug log
  console.log('JobPostingContext state:', state);

  return (
    <JobPostingContext.Provider value={value}>
      {children}
    </JobPostingContext.Provider>
  );
};

// Custom hook
export const useJobPosting = () => {
  const context = useContext(JobPostingContext);
  if (!context) {
    throw new Error('useJobPosting must be used within a JobPostingProvider');
  }
  return context;
};

export default JobPostingContext;
