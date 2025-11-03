import React from 'react';
import { Check, ChevronRight } from 'lucide-react';

const ProgressStepper = ({ currentStep, totalSteps, steps = [] }) => {
  const defaultSteps = [
    { id: 0, title: 'Basic Info', description: 'Job title and details' },
    { id: 1, title: 'Requirements', description: 'Skills and qualifications' },
    { id: 2, title: 'Benefits', description: 'Salary and perks' },
    { id: 3, title: 'Additional', description: 'Description and process' }
  ];

  const stepList = steps.length > 0 ? steps : defaultSteps;

  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <div className="flex items-center justify-between">
        {stepList.map((step, index) => (
          <React.Fragment key={step.id}>
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                  transition-all duration-300 ease-in-out
                  ${
                    index <= currentStep
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-200 text-gray-500'
                  }
                `}
              >
                {index < currentStep ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              
              {/* Step Info */}
              <div className="mt-2 text-center">
                <p
                  className={`
                    text-sm font-medium
                    ${index <= currentStep ? 'text-blue-600' : 'text-gray-500'}
                  `}
                >
                  {step.title}
                </p>
                <p
                  className={`
                    text-xs mt-1
                    ${index <= currentStep ? 'text-gray-600' : 'text-gray-400'}
                  `}
                >
                  {step.description}
                </p>
              </div>
            </div>

            {/* Connector Line */}
            {index < stepList.length - 1 && (
              <div className="flex-1 mx-4">
                <div
                  className={`
                    h-0.5 w-full transition-all duration-300 ease-in-out
                    ${index < currentStep ? 'bg-blue-600' : 'bg-gray-200'}
                  `}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="mt-6">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Step {currentStep + 1} of {totalSteps}</span>
          <span>{Math.round(((currentStep + 1) / totalSteps) * 100)}% Complete</span>
        </div>
      </div>
    </div>
  );
};

export default ProgressStepper;




