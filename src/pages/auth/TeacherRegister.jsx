import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Upload, User, Mail, Phone, BookOpen, Briefcase, Award, Globe } from "lucide-react";
import toast from "react-hot-toast";
import GlassCard from "../../components/GlassCard";
import LiquidBackground from "../../components/LiquidBackground";
import { useAuth } from "../../context/AuthContext";
import './teacherRegister.css';

const TeacherRegister = () => {
  const navigate = useNavigate();
  const { register: registerTeacher, isLoading } = useAuth();
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors }
  } = useForm({ defaultValues: { education: [{}], experience: [{ current: false }], certifications: [{}] } });

  const { fields: eduFields, append: addEdu } = useFieldArray({ control, name: "education" });
  const { fields: expFields, append: addExp } = useFieldArray({ control, name: "experience" });
  const { fields: certFields, append: addCert } = useFieldArray({ control, name: "certifications" });

  const onSubmit = async (data) => {
    try {
      console.log("Teacher 3-Step Form Data:", data);
      console.log("Experience data:", data.experience);
      if (data.experience && data.experience[0]) {
        console.log("First experience entry:", data.experience[0]);
        console.log("Current field value:", data.experience[0].current, "Type:", typeof data.experience[0].current);
      }
  
      // Create FormData for file uploads
      const formData = new FormData();
  
      // Transform and append data in the correct format for the backend
      const transformedData = {
        // Personal Info
        'personalInfo.firstName': data.name?.split(' ')[0] || '',
        'personalInfo.lastName': data.name?.split(' ').slice(1).join(' ') || '',
        'personalInfo.phone': data.phone || '',
        'personalInfo.bio': data.bio || '',
        'personalInfo.headline': data.headline || '',
        'personalInfo.gender': data.gender && data.gender.trim() ? data.gender.charAt(0).toUpperCase() + data.gender.slice(1).toLowerCase() : undefined,
        'personalInfo.dateOfBirth': data.dob || '',
        'personalInfo.address.city': data.address?.city || '',
        'personalInfo.address.state': data.address?.state || '',
        'personalInfo.address.country': data.address?.country || '',
        'personalInfo.linkedin': data.linkedin || '',
        'personalInfo.portfolio': data.portfolio || '',
        
        // Professional Info
        'professionalInfo.skills': data.skills ? data.skills.split(',').map(s => s.trim()) : [],
        'professionalInfo.specialization': data.subjects ? data.subjects.split(',').map(s => s.trim()) : [],
        'professionalInfo.achievements': data.achievements ? data.achievements.split(',').map(s => s.trim()).map(achievement => ({
          title: achievement,
          description: '',
          date: null,
          image: ''
        })) : [],
        'professionalInfo.languages': data.languages ? data.languages.split(',').map(s => s.trim()) : [],
        'professionalInfo.qualification': data.education ? data.education.map(edu => ({
          degree: edu.degree || '',
          institution: edu.university || '',
          year: edu.yearOfPassing ? parseInt(edu.yearOfPassing) : null,
          grade: edu.grade || ''
        })) : [],
        'professionalInfo.experience': data.experience ? data.experience.map(exp => ({
          school: exp.schoolName || '',
          position: exp.role || '',
          startDate: exp.from || null,
          endDate: exp.current ? null : (exp.to || null), // If current, no end date
          current: exp.current === true || exp.current === 'true' || exp.current === 'on', // Handle string/boolean conversion
          description: exp.description || ''
        })) : [],
        'professionalInfo.certifications': data.certifications ? data.certifications.map(cert => ({
          name: cert.title || '',
          issuer: cert.issuer || '',
          date: cert.year ? new Date(cert.year, 0, 1) : null,
          expiryDate: null
        })) : [],
      };
  
      // Append transformed data
      Object.keys(transformedData).forEach((key) => {
        const value = transformedData[key];
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach((item, index) => {
              if (typeof item === 'object' && item !== null) {
                Object.keys(item).forEach(subKey => {
                  formData.append(`${key}[${index}][${subKey}]`, item[subKey] || '');
                });
              } else {
                formData.append(`${key}[${index}]`, item || '');
              }
            });
          } else {
            formData.append(key, value);
          }
        }
      });
  
      // Append files if they exist
      if (data.profilePhoto && data.profilePhoto.length > 0) {
        formData.append('profilePhoto', data.profilePhoto[0]);
      }
  
      console.log('Sending form data to backend...');
      
      // Call backend update API
      const token = localStorage.getItem('token');
      const response = await fetch('/api/teachers/update', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
  
      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Backend response:', result);
  
      if (result.success) {
        // Also save the data to resume system
        try {
          const { resumeApi } = await import('../../api/resumeApi');
          
          // Transform the form data to resume format
          const resumeData = {
            personalInfo: {
              name: data.name || '',
              email: data.email || '',
              phone: data.phone || '',
              gender: data.gender || '',
              dateOfBirth: data.dob || null,
              address: {
                city: data.address?.city || '',
                state: data.address?.state || '',
                country: data.address?.country || 'India',
              },
            },
            professionalInfo: {
              headline: data.headline || '',
              bio: data.bio || '',
              skills: data.skills ? data.skills.split(',').map(s => s.trim()) : [],
              subjects: data.subjects ? data.subjects.split(',').map(s => s.trim()) : [],
              achievements: data.achievements ? data.achievements.split(',').map(s => s.trim()) : [],
              languages: data.languages ? data.languages.split(',').map(s => s.trim()) : [],
            },
            education: data.education ? data.education.map(edu => ({
              degree: edu.degree || '',
              university: edu.university || '',
              yearOfPassing: edu.yearOfPassing ? parseInt(edu.yearOfPassing) : null,
              grade: edu.grade || ''
            })) : [],
            experience: data.experience ? data.experience.map(exp => ({
              schoolName: exp.schoolName || '',
              role: exp.role || '',
              from: exp.from || null,
              to: exp.current ? null : (exp.to || null),
              current: exp.current === true || exp.current === 'true' || exp.current === 'on',
              description: exp.description || ''
            })) : [],
            certifications: data.certifications ? data.certifications.map(cert => ({
              title: cert.title || '',
              issuer: cert.issuer || '',
              year: cert.year ? parseInt(cert.year) : null,
              expiryDate: null
            })) : [],
            socialLinks: {
              linkedin: data.linkedin || '',
              portfolio: data.portfolio || '',
              github: ''
            }
          };
          
          await resumeApi.createOrUpdateResume(resumeData);
          console.log('Resume data saved successfully');
        } catch (resumeError) {
          console.error('Error saving resume data:', resumeError);
          // Don't fail the entire registration if resume save fails
        }
        
        toast.success('Profile updated successfully!');
        navigate('/teacher');
      } else {
        console.error('Backend error:', result);
        toast.error(result.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Frontend error:', error);
      toast.error('Something went wrong while updating profile: ' + error.message);
    }
  };
  

  return (
    <LiquidBackground className="flex justify-center items-center py-12 px-4">
      <div className="max-w-3xl w-full relative">
        <GlassCard>
          <h2 className="text-2xl font-bold mb-6 text-center">Teacher Registration</h2>

          {/* Step Progress Indicator */}
          <div className="flex justify-between mb-6">
            {["Personal Info", "Career Details", "Profile Photo & Links"].map((title, index) => (
              <div key={index} className={`flex-1 text-center font-semibold text-sm ${step === index + 1 ? "text-blue-600" : "text-gray-400"}`}>
                {index + 1}. {title}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* STEP 1 - PERSONAL INFO */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold mb-3">Personal Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input {...register("name", { required: "Name is required" })} placeholder="Full Name" className="form-input" />
                  <input {...register("email", { required: "Email is required" })} placeholder="Email Address" type="email" className="form-input" />
                  <input {...register("phone", { required: "Phone is required" })} placeholder="Phone Number" className="form-input" />
                  <select {...register("gender")} className="form-input">
                    <option value="">Select Gender (Optional)</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  <input {...register("dob")} type="date" className="form-input" placeholder="Date of Birth" />
                </div>

                <input {...register("address.city")} placeholder="City" className="form-input" />
                <input {...register("address.state")} placeholder="State" className="form-input" />
                <input {...register("address.country")} placeholder="Country" className="form-input" />

                <div className="flex justify-end">
                  <button type="button" onClick={() => setStep(2)} className="btn-primary">Next</button>
                </div>
              </div>
            )}

            {/* STEP 2 - CAREER DETAILS */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold mb-3">Education & Experience</h3>

                {/* Education Section */}
                <div>
                  <h4 className="font-semibold mb-2">Education</h4>
                  {eduFields.map((field, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
                      <input {...register(`education.${index}.degree`)} placeholder="Degree" className="form-input" />
                      <input {...register(`education.${index}.university`)} placeholder="University" className="form-input" />
                      <input {...register(`education.${index}.yearOfPassing`)} placeholder="Year" className="form-input" />
                      <input {...register(`education.${index}.grade`)} placeholder="Grade" className="form-input" />
                    </div>
                  ))}
                  <button type="button" onClick={() => addEdu({})} className="btn-secondary">+ Add Education</button>
                </div>

                {/* Experience Section */}
                <div>
                  <h4 className="font-semibold mb-2">Experience</h4>
                  {expFields.map((field, index) => (
                    <div key={index} className="space-y-2 mb-4 p-4 border rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                        <input {...register(`experience.${index}.schoolName`)} placeholder="Institution" className="form-input" />
                        <input {...register(`experience.${index}.role`)} placeholder="Role" className="form-input" />
                        <input {...register(`experience.${index}.from`)} type="date" className="form-input" />
                        <input {...register(`experience.${index}.to`)} type="date" className="form-input" />
                      </div>
                      <div className="flex items-center gap-2">
                        <input 
                          {...register(`experience.${index}.current`)} 
                          type="checkbox" 
                          id={`current-${index}`}
                          className="form-checkbox"
                        />
                        <label htmlFor={`current-${index}`} className="text-sm text-gray-600">
                          Click here
                        </label>
                      </div>
                      <input {...register(`experience.${index}.description`)} placeholder="Description" className="form-input" />
                    </div>
                  ))}
                  <button type="button" onClick={() => addExp({})} className="btn-secondary">+ Add Experience</button>
                </div>

                {/* Skills, Subjects */}
                <input {...register("skills")} placeholder="Skills (comma separated)" className="form-input" />
                <input {...register("subjects")} placeholder="Subjects (comma separated)" className="form-input" />

                {/* Bio */}
                <input {...register("headline")} placeholder="Headline (short title)" className="form-input" />
                <textarea {...register("bio")} placeholder="Professional Summary / Bio" className="form-textarea" />

                {/* Certifications */}
                <div>
                  <h4 className="font-semibold mb-2">Certifications</h4>
                  {certFields.map((field, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                      <input {...register(`certifications.${index}.title`)} placeholder="Certificate Title" className="form-input" />
                      <input {...register(`certifications.${index}.issuer`)} placeholder="Issuer" className="form-input" />
                      <input {...register(`certifications.${index}.year`)} placeholder="Year" className="form-input" />
                    </div>
                  ))}
                  <button type="button" onClick={() => addCert({})} className="btn-secondary">+ Add Certification</button>
                </div>

                <input {...register("achievements")} placeholder="Achievements / Awards (comma separated)" className="form-input" />
                <input {...register("languages")} placeholder="Languages (comma separated)" className="form-input" />

                <div className="flex justify-between">
                  <button type="button" onClick={() => setStep(1)} className="btn-secondary">Back</button>
                  <button type="button" onClick={() => setStep(3)} className="btn-primary">Next</button>
                </div>
              </div>
            )}

            {/* STEP 3 - UPLOADS & LINKS */}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold mb-3">Profile Photo & Links</h3>

                <div>
                  <label className="font-semibold">Profile Image</label>
                  <input {...register("profilePhoto")} type="file" accept="image/*" className="form-input" />
                  <p className="text-sm text-gray-600 mt-1">Upload a professional profile photo (JPG, PNG, GIF - Max 2MB)</p>
                </div>

                <input {...register("linkedin")} placeholder="LinkedIn URL" className="form-input" />
                <input {...register("portfolio")} placeholder="Portfolio / Website" className="form-input" />

                <div className="flex justify-between mt-4">
                  <button type="button" onClick={() => setStep(2)} className="btn-secondary">Back</button>
                  <button type="submit" disabled={isLoading} className="btn-primary">
                    {isLoading ? "Creating Account..." : "Complete Registration"}
                  </button>
                </div>
              </div>
            )}
          </form>
        </GlassCard>
      </div>
    </LiquidBackground>
  );
};

export default TeacherRegister;
