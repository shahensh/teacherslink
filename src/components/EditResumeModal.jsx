import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { X, Plus, Trash2, Save, Eye, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { resumeApi } from '../api/resumeApi';

const EditResumeModal = ({ isOpen, onClose, teacherId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: {
      personalInfo: {
        name: '',
        email: '',
        phone: '',
        gender: '',
        dateOfBirth: '',
        address: {
          city: '',
          state: '',
          country: 'India'
        }
      },
      professionalInfo: {
        headline: '',
        bio: '',
        skills: [],
        subjects: [],
        languages: [],
        achievements: []
      },
      education: [{}],
      experience: [{}],
      certifications: [{}],
      socialLinks: {
        linkedin: '',
        portfolio: '',
        github: ''
      }
    }
  });

  const { fields: eduFields, append: addEdu, remove: removeEdu } = useFieldArray({
    control,
    name: "education"
  });

  const { fields: expFields, append: addExp, remove: removeExp } = useFieldArray({
    control,
    name: "experience"
  });

  const { fields: certFields, append: addCert, remove: removeCert } = useFieldArray({
    control,
    name: "certifications"
  });

  // Load existing resume data
  useEffect(() => {
    if (isOpen) {
      loadResumeData();
    }
  }, [isOpen]);

  const loadResumeData = async () => {
    try {
      setIsLoading(true);
      const response = await resumeApi.getMyResume();
      if (response.success && response.data) {
        // Format dates for HTML date inputs (YYYY-MM-DD format)
        const formatDateForInput = (dateString) => {
          if (!dateString) return '';
          try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';
            return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
          } catch (error) {
            console.log('Error formatting date:', dateString, error);
            return '';
          }
        };

        // Process the resume data to format dates properly
        const processedData = {
          ...response.data,
          personalInfo: {
            ...response.data.personalInfo,
            dateOfBirth: formatDateForInput(response.data.personalInfo?.dateOfBirth)
          },
          education: response.data.education?.map(edu => ({
            ...edu,
            // yearOfPassing is a number field, not a date
            yearOfPassing: edu.yearOfPassing || edu.year || ''
          })) || [{}],
          experience: response.data.experience?.map(exp => ({
            ...exp,
            // Map the correct field names for experience dates
            from: formatDateForInput(exp.from || exp.startDate),
            to: formatDateForInput(exp.to || exp.endDate)
          })) || [{}],
          certifications: response.data.certifications?.map(cert => ({
            ...cert,
            // year is a number field, not a date
            year: cert.year || ''
          })) || [{}]
        };

        console.log('EditResumeModal - Processed resume data:', processedData);
        
        // Load resume data
        reset(processedData);
        
        // Also load current teacher profile to get profile image
        try {
          const token = localStorage.getItem('token');
          const teacherResponse = await fetch('/api/teachers/me', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          if (teacherResponse.ok) {
            const teacherData = await teacherResponse.json();
            if (teacherData.success && teacherData.teacher?.personalInfo?.profileImage) {
              // Update the form with the current profile image
              reset({
                ...processedData,
                personalInfo: {
                  ...processedData.personalInfo,
                  profileImage: teacherData.teacher.personalInfo.profileImage
                }
              });
            }
          }
        } catch (teacherError) {
          console.log('Could not load teacher profile image:', teacherError);
        }
      }
    } catch (error) {
      console.error('Error loading resume:', error);
      // Don't show error toast if resume doesn't exist yet
      if (error.response?.status !== 404) {
        toast.error('Failed to load resume data');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setIsSaving(true);
      
      // Process skills, subjects, languages, achievements from strings to arrays
      if (data.professionalInfo.skills && typeof data.professionalInfo.skills === 'string') {
        data.professionalInfo.skills = data.professionalInfo.skills.split(',').map(s => s.trim()).filter(s => s);
      }
      if (data.professionalInfo.subjects && typeof data.professionalInfo.subjects === 'string') {
        data.professionalInfo.subjects = data.professionalInfo.subjects.split(',').map(s => s.trim()).filter(s => s);
      }
      if (data.professionalInfo.languages && typeof data.professionalInfo.languages === 'string') {
        data.professionalInfo.languages = data.professionalInfo.languages.split(',').map(s => s.trim()).filter(s => s);
      }
      if (data.professionalInfo.achievements && typeof data.professionalInfo.achievements === 'string') {
        data.professionalInfo.achievements = data.professionalInfo.achievements.split(',').map(s => s.trim()).filter(s => s);
      }

      // Handle profile photo upload
      if (data.profilePhoto && data.profilePhoto.length > 0) {
        console.log('EditResumeModal - Uploading profile photo...');
        
        // Create FormData for file upload
        const formData = new FormData();
        
        // Add the profile photo
        formData.append('profilePhoto', data.profilePhoto[0]);
        
        // Upload profile photo to teacher profile first
        const token = localStorage.getItem('token');
        const photoResponse = await fetch('/api/teachers/update', {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        });
        
        if (photoResponse.ok) {
          const photoResult = await photoResponse.json();
          console.log('EditResumeModal - Photo upload result:', photoResult);
          
          if (photoResult.success && photoResult.teacher?.personalInfo?.profileImage) {
            // Update the resume data with the new profile image URL
            data.personalInfo.profileImage = photoResult.teacher.personalInfo.profileImage;
            console.log('EditResumeModal - Updated resume data with profile image:', data.personalInfo.profileImage);
          }
        } else {
          console.error('EditResumeModal - Photo upload failed:', photoResponse.status);
        }
      }

      console.log('EditResumeModal - Final resume data being sent:', JSON.stringify(data, null, 2));
      const response = await resumeApi.createOrUpdateResume(data);
      console.log('EditResumeModal - Resume API response:', response);
      
      if (response.success) {
        toast.success('Resume updated successfully!');
        
        // If profile photo was uploaded, also update the teacher profile
        if (data.profilePhoto && data.profilePhoto.length > 0) {
          try {
            console.log('EditResumeModal - Updating teacher profile with new photo...');
            
            const formData = new FormData();
            formData.append('profilePhoto', data.profilePhoto[0]);
            
            const token = localStorage.getItem('token');
            const teacherUpdateResponse = await fetch('/api/teachers/update', {
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${token}`
              },
              body: formData
            });
            
            if (teacherUpdateResponse.ok) {
              const teacherUpdateResult = await teacherUpdateResponse.json();
              console.log('EditResumeModal - Teacher profile updated:', teacherUpdateResult);
              toast.success('Profile photo updated successfully!');
            } else {
              console.error('EditResumeModal - Failed to update teacher profile');
            }
          } catch (error) {
            console.error('EditResumeModal - Error updating teacher profile:', error);
          }
        }
        
        onClose();
      } else {
        toast.error(response.message || 'Failed to update resume');
      }
    } catch (error) {
      console.error('Error saving resume:', error);
      toast.error('Failed to save resume');
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewPDF = async () => {
    try {
      const response = await resumeApi.getMyResume();
      if (response.success && response.data) {
        await resumeApi.viewResumePDF(response.data._id);
      } else {
        toast.error('Please save your resume first');
      }
    } catch (error) {
      console.error('Error viewing PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await resumeApi.getMyResume();
      if (response.success && response.data) {
        await resumeApi.downloadResumePDF(response.data._id, 'my_resume.pdf');
      } else {
        toast.error('Please save your resume first');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Edit Resume</h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleViewPDF}
              className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Eye className="w-4 h-4 mr-2" />
              View PDF
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center px-3 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Personal Information</h3>
                
                {/* Profile Photo Upload */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Profile Photo</label>
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <input
                        {...register("profilePhoto")}
                        type="file"
                        accept="image/*"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-sm text-gray-500 mt-1">Upload a professional profile photo (JPG, PNG, GIF - Max 2MB)</p>
                    </div>
                    {watch("personalInfo.profileImage") && (
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-300">
                        <img 
                          src={watch("personalInfo.profileImage")} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <input
                      {...register("personalInfo.name", { required: "Name is required" })}
                      placeholder="Full Name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.personalInfo?.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.personalInfo.name.message}</p>
                    )}
                  </div>
                  <div>
                    <input
                      {...register("personalInfo.email", { required: "Email is required" })}
                      placeholder="Email Address"
                      type="email"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.personalInfo?.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.personalInfo.email.message}</p>
                    )}
                  </div>
                  <div>
                    <input
                      {...register("personalInfo.phone", { required: "Phone is required" })}
                      placeholder="Phone Number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.personalInfo?.phone && (
                      <p className="text-red-500 text-sm mt-1">{errors.personalInfo.phone.message}</p>
                    )}
                  </div>
                  <div>
                    <input
                      {...register("personalInfo.gender")}
                      placeholder="Gender (Optional)"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <input
                      {...register("personalInfo.dateOfBirth")}
                      type="date"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <input
                      {...register("personalInfo.address.city")}
                      placeholder="City"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <input
                      {...register("personalInfo.address.state")}
                      placeholder="State"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <input
                      {...register("personalInfo.address.country")}
                      placeholder="Country"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Professional Information</h3>
                <div className="space-y-4">
                  <input
                    {...register("professionalInfo.headline")}
                    placeholder="Professional Headline (e.g., 'Maths Teacher with 5+ years experience')"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <textarea
                    {...register("professionalInfo.bio")}
                    placeholder="Professional Summary / Bio"
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    {...register("professionalInfo.skills")}
                    placeholder="Skills (comma separated)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    {...register("professionalInfo.subjects")}
                    placeholder="Subjects (comma separated)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    {...register("professionalInfo.languages")}
                    placeholder="Languages (comma separated)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    {...register("professionalInfo.achievements")}
                    placeholder="Achievements / Awards (comma separated)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Education */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Education</h3>
                  <button
                    type="button"
                    onClick={() => addEdu({})}
                    className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Education
                  </button>
                </div>
                {eduFields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-200 rounded-lg">
                    <input
                      {...register(`education.${index}.degree`)}
                      placeholder="Degree"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      {...register(`education.${index}.university`)}
                      placeholder="University"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      {...register(`education.${index}.yearOfPassing`)}
                      placeholder="Year"
                      type="number"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="flex items-center space-x-2">
                      <input
                        {...register(`education.${index}.grade`)}
                        placeholder="Grade"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => removeEdu(index)}
                        className="p-2 text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Experience */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Experience</h3>
                  <button
                    type="button"
                    onClick={() => addExp({})}
                    className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Experience
                  </button>
                </div>
                {expFields.map((field, index) => (
                  <div key={field.id} className="space-y-4 p-4 border border-gray-200 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        {...register(`experience.${index}.schoolName`)}
                        placeholder="Institution/School Name"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        {...register(`experience.${index}.role`)}
                        placeholder="Role/Position"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        {...register(`experience.${index}.from`)}
                        type="date"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <div className="flex items-center space-x-2">
                        <input
                          {...register(`experience.${index}.to`)}
                          type="date"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => removeExp(index)}
                          className="p-2 text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <textarea
                      {...register(`experience.${index}.description`)}
                      placeholder="Job Description"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                ))}
              </div>

              {/* Certifications */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Certifications</h3>
                  <button
                    type="button"
                    onClick={() => addCert({})}
                    className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Certification
                  </button>
                </div>
                {certFields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-gray-200 rounded-lg">
                    <input
                      {...register(`certifications.${index}.title`)}
                      placeholder="Certificate Title"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      {...register(`certifications.${index}.issuer`)}
                      placeholder="Issuing Organization"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="flex items-center space-x-2">
                      <input
                        {...register(`certifications.${index}.year`)}
                        placeholder="Year"
                        type="number"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => removeCert(index)}
                        className="p-2 text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Social Links */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Social Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    {...register("socialLinks.linkedin")}
                    placeholder="LinkedIn URL"
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    {...register("socialLinks.portfolio")}
                    placeholder="Portfolio/Website URL"
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    {...register("socialLinks.github")}
                    placeholder="GitHub URL"
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Resume
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditResumeModal;



