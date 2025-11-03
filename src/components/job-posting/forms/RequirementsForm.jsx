import React, { useState } from 'react';
import { GraduationCap, Briefcase, Award, Star, Plus, X, AlertCircle } from 'lucide-react';

const RequirementsForm = ({ formData, updateFormData, errors, validationErrors }) => {
  const [newSkill, setNewSkill] = useState('');
  const [newCertification, setNewCertification] = useState('');

  const handleInputChange = (field, value) => {
    updateFormData('requirements', { [field]: value });
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.requirements.skills.includes(newSkill.trim())) {
      const updatedSkills = [...formData.requirements.skills, newSkill.trim()];
      updateFormData('requirements', { skills: updatedSkills });
      setNewSkill('');
    }
  };

  const removeSkill = (index) => {
    const updatedSkills = formData.requirements.skills.filter((_, i) => i !== index);
    updateFormData('requirements', { skills: updatedSkills });
  };

  const addCertification = () => {
    if (newCertification.trim() && !formData.requirements.certifications.includes(newCertification.trim())) {
      const updatedCertifications = [...formData.requirements.certifications, newCertification.trim()];
      updateFormData('requirements', { certifications: updatedCertifications });
      setNewCertification('');
    }
  };

  const removeCertification = (index) => {
    const updatedCertifications = formData.requirements.certifications.filter((_, i) => i !== index);
    updateFormData('requirements', { certifications: updatedCertifications });
  };

  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    }
  };

  const commonSkills = [
    'Classroom Management', 'Curriculum Development', 'Student Assessment',
    'Technology Integration', 'Differentiated Instruction', 'Parent Communication',
    'Special Education', 'ESL/ESOL', 'Data Analysis', 'Project-Based Learning',
    'Collaborative Teaching', 'Behavioral Management', 'Educational Technology',
    'Lesson Planning', 'Student Engagement', 'Assessment Design'
  ];

  const addCommonSkill = (skill) => {
    if (!formData.requirements.skills.includes(skill)) {
      const updatedSkills = [...formData.requirements.skills, skill];
      updateFormData('requirements', { skills: updatedSkills });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Requirements & Qualifications</h2>
        <p className="text-gray-600">Define what you're looking for in the ideal candidate</p>
      </div>

      {/* Education Requirements */}
      <div>
        <label htmlFor="education" className="block text-sm font-medium text-gray-700 mb-2">
          Education Requirements *
        </label>
        <div className="relative">
          <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            id="education"
            value={formData.requirements.education}
            onChange={(e) => handleInputChange('education', e.target.value)}
            className={`
              w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
              ${validationErrors.education ? 'border-red-500' : 'border-gray-300'}
            `}
            placeholder="e.g., Bachelor's degree in Mathematics or related field"
          />
        </div>
        {validationErrors.education && (
          <div className="flex items-center mt-2 text-red-600">
            <AlertCircle className="w-4 h-4 mr-1" />
            <span className="text-sm">{validationErrors.education}</span>
          </div>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Specify degree level and subject area requirements
        </p>
      </div>

      {/* Experience Requirements */}
      <div>
        <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-2">
          Experience Requirements *
        </label>
        <div className="relative">
          <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            id="experience"
            value={formData.requirements.experience}
            onChange={(e) => handleInputChange('experience', e.target.value)}
            className={`
              w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
              ${validationErrors.experience ? 'border-red-500' : 'border-gray-300'}
            `}
            placeholder="e.g., 2+ years of teaching experience in middle school"
          />
        </div>
        {validationErrors.experience && (
          <div className="flex items-center mt-2 text-red-600">
            <AlertCircle className="w-4 h-4 mr-1" />
            <span className="text-sm">{validationErrors.experience}</span>
          </div>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Include years of experience and any specific teaching levels
        </p>
      </div>

      {/* Skills */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Required Skills
        </label>
        
        {/* Add New Skill */}
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Star className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, addSkill)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add a skill (e.g., Classroom Management)"
            />
          </div>
          <button
            type="button"
            onClick={addSkill}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Common Skills */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Common Skills:</p>
          <div className="flex flex-wrap gap-2">
            {commonSkills.map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => addCommonSkill(skill)}
                disabled={formData.requirements.skills.includes(skill)}
                className={`
                  px-3 py-1 text-xs rounded-full border transition-colors
                  ${formData.requirements.skills.includes(skill)
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300'
                  }
                `}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Skills */}
        {formData.requirements.skills.length > 0 && (
          <div>
            <p className="text-sm text-gray-600 mb-2">Selected Skills:</p>
            <div className="flex flex-wrap gap-2">
              {formData.requirements.skills.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(index)}
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

      {/* Certifications */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Required Certifications
        </label>
        
        {/* Add New Certification */}
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Award className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={newCertification}
              onChange={(e) => setNewCertification(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, addCertification)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add a certification (e.g., Teaching License)"
            />
          </div>
          <button
            type="button"
            onClick={addCertification}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Certifications */}
        {formData.requirements.certifications.length > 0 && (
          <div>
            <p className="text-sm text-gray-600 mb-2">Selected Certifications:</p>
            <div className="flex flex-wrap gap-2">
              {formData.requirements.certifications.map((cert, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                >
                  {cert}
                  <button
                    type="button"
                    onClick={() => removeCertification(index)}
                    className="ml-2 text-green-600 hover:text-green-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">💡 Tips for Better Results</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Be specific about education requirements (degree level and subject)</li>
          <li>• Include both minimum and preferred experience levels</li>
          <li>• Add relevant skills that are essential for the role</li>
          <li>• List any required certifications or licenses</li>
        </ul>
      </div>
    </div>
  );
};

export default RequirementsForm;




