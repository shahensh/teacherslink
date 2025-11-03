import React, { useState } from 'react';
import { DollarSign, Gift, Star, Plus, X, AlertCircle, Check } from 'lucide-react';

const BenefitsForm = ({ formData, updateFormData, errors, validationErrors }) => {
  const [newBenefit, setNewBenefit] = useState('');
  const [newPerk, setNewPerk] = useState('');

  const handleSalaryChange = (field, value) => {
    updateFormData('benefits', {
      salary: {
        ...formData.benefits.salary,
        [field]: value
      }
    });
  };

  const handleInputChange = (field, value) => {
    updateFormData('benefits', {
      [field]: value
    });
  };

  const addBenefit = () => {
    if (newBenefit.trim() && !formData.benefits.benefits.includes(newBenefit.trim())) {
      const updatedBenefits = [...formData.benefits.benefits, newBenefit.trim()];
      updateFormData('benefits', { benefits: updatedBenefits });
      setNewBenefit('');
    }
  };

  const removeBenefit = (index) => {
    const updatedBenefits = formData.benefits.benefits.filter((_, i) => i !== index);
    updateFormData('benefits', { benefits: updatedBenefits });
  };

  const addPerk = () => {
    if (newPerk.trim() && !formData.benefits.perks.includes(newPerk.trim())) {
      const updatedPerks = [...formData.benefits.perks, newPerk.trim()];
      updateFormData('benefits', { perks: updatedPerks });
      setNewPerk('');
    }
  };

  const removePerk = (index) => {
    const updatedPerks = formData.benefits.perks.filter((_, i) => i !== index);
    updateFormData('benefits', { perks: updatedPerks });
  };

  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    }
  };

  const commonBenefits = [
    'Health Insurance', 'Dental Insurance', 'Vision Insurance', 'Life Insurance',
    'Retirement Plan (401k)', 'Pension Plan', 'Paid Time Off', 'Sick Leave',
    'Professional Development', 'Tuition Reimbursement', 'Flexible Spending Account',
    'Disability Insurance', 'Maternity/Paternity Leave', 'Employee Assistance Program'
  ];

  const commonPerks = [
    'Summer Break', 'Winter Break', 'Spring Break', 'Flexible Schedule',
    'Remote Work Options', 'Technology Allowance', 'Gym Membership',
    'Free Parking', 'Cafeteria Discount', 'Professional Development Budget',
    'Conference Attendance', 'Mentorship Program', 'Wellness Program',
    'Childcare Assistance', 'Commuter Benefits'
  ];

  const addCommonBenefit = (benefit) => {
    if (!formData.benefits.benefits.includes(benefit)) {
      const updatedBenefits = [...formData.benefits.benefits, benefit];
      updateFormData('benefits', { benefits: updatedBenefits });
    }
  };

  const addCommonPerk = (perk) => {
    if (!formData.benefits.perks.includes(perk)) {
      const updatedPerks = [...formData.benefits.perks, perk];
      updateFormData('benefits', { perks: updatedPerks });
    }
  };

  const currencies = [
    { value: 'USD', label: 'US Dollar ($)' },
    { value: 'EUR', label: 'Euro (€)' },
    { value: 'GBP', label: 'British Pound (£)' },
    { value: 'INR', label: 'Indian Rupee (₹)' },
    { value: 'CAD', label: 'Canadian Dollar (C$)' },
    { value: 'AUD', label: 'Australian Dollar (A$)' }
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Compensation & Benefits</h2>
        <p className="text-gray-600">Attract top talent with competitive compensation and benefits</p>
      </div>

      {/* Salary Range */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <DollarSign className="w-5 h-5 mr-2 text-green-600" />
          Salary Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Minimum Salary */}
          <div>
            <label htmlFor="salaryMin" className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Salary
            </label>
            <input
              type="number"
              id="salaryMin"
              value={formData.benefits.salary.min || ''}
              onChange={(e) => handleSalaryChange('min', e.target.value ? parseInt(e.target.value) : '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="50000"
              min="0"
            />
          </div>

          {/* Maximum Salary */}
          <div>
            <label htmlFor="salaryMax" className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Salary
            </label>
            <input
              type="number"
              id="salaryMax"
              value={formData.benefits.salary.max || ''}
              onChange={(e) => handleSalaryChange('max', e.target.value ? parseInt(e.target.value) : '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="70000"
              min="0"
            />
          </div>

          {/* Currency */}
          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
              Currency
            </label>
            <select
              id="currency"
              value={formData.benefits.salary.currency}
              onChange={(e) => handleSalaryChange('currency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {currencies.map((currency) => (
                <option key={currency.value} value={currency.value}>
                  {currency.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Negotiable */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="negotiable"
            checked={formData.benefits.salary.negotiable}
            onChange={(e) => handleSalaryChange('negotiable', e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="negotiable" className="ml-2 text-sm text-gray-700">
            Salary is negotiable based on experience
          </label>
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Gift className="w-5 h-5 mr-2 text-blue-600" />
          Benefits
        </h3>
        
        {/* Add New Benefit */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newBenefit}
            onChange={(e) => setNewBenefit(e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, addBenefit)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Add a benefit (e.g., Health Insurance)"
          />
          <button
            type="button"
            onClick={addBenefit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Common Benefits */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Common Benefits:</p>
          <div className="flex flex-wrap gap-2">
            {commonBenefits.map((benefit) => (
              <button
                key={benefit}
                type="button"
                onClick={() => addCommonBenefit(benefit)}
                disabled={formData.benefits.benefits.includes(benefit)}
                className={`
                  px-3 py-1 text-xs rounded-full border transition-colors
                  ${formData.benefits.benefits.includes(benefit)
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300'
                  }
                `}
              >
                {benefit}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Benefits */}
        {formData.benefits.benefits.length > 0 && (
          <div>
            <p className="text-sm text-gray-600 mb-2">Selected Benefits:</p>
            <div className="flex flex-wrap gap-2">
              {formData.benefits.benefits.map((benefit, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                >
                  <Check className="w-3 h-3 mr-1" />
                  {benefit}
                  <button
                    type="button"
                    onClick={() => removeBenefit(index)}
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

      {/* Perks */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Star className="w-5 h-5 mr-2 text-yellow-600" />
          Perks & Additional Benefits
        </h3>
        
        {/* Add New Perk */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newPerk}
            onChange={(e) => setNewPerk(e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, addPerk)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Add a perk (e.g., Summer Break)"
          />
          <button
            type="button"
            onClick={addPerk}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Common Perks */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Common Perks:</p>
          <div className="flex flex-wrap gap-2">
            {commonPerks.map((perk) => (
              <button
                key={perk}
                type="button"
                onClick={() => addCommonPerk(perk)}
                disabled={formData.benefits.perks.includes(perk)}
                className={`
                  px-3 py-1 text-xs rounded-full border transition-colors
                  ${formData.benefits.perks.includes(perk)
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-yellow-50 hover:border-yellow-300'
                  }
                `}
              >
                {perk}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Perks */}
        {formData.benefits.perks.length > 0 && (
          <div>
            <p className="text-sm text-gray-600 mb-2">Selected Perks:</p>
            <div className="flex flex-wrap gap-2">
              {formData.benefits.perks.map((perk, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full"
                >
                  <Star className="w-3 h-3 mr-1" />
                  {perk}
                  <button
                    type="button"
                    onClick={() => removePerk(index)}
                    className="ml-2 text-yellow-600 hover:text-yellow-800"
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
          <li>• Research market rates for similar positions in your area</li>
          <li>• Include both salary range and comprehensive benefits</li>
          <li>• Highlight unique perks that set your school apart</li>
          <li>• Be transparent about compensation to attract serious candidates</li>
        </ul>
      </div>
    </div>
  );
};

export default BenefitsForm;
