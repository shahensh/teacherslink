import React from 'react'
import { MapPin, Clock, DollarSign, Building } from 'lucide-react'

const JobCard = ({ job }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{job.title}</h3>
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <Building className="h-4 w-4 mr-1" />
            {job.school}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-1" />
            {job.location}
          </div>
        </div>
        <span className="px-3 py-1 bg-primary-100 text-primary-800 text-sm font-medium rounded-full">
          {job.type}
        </span>
      </div>
      
      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
        <div className="flex items-center">
          <DollarSign className="h-4 w-4 mr-1" />
          {job.salary}
        </div>
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-1" />
          {job.posted}
        </div>
      </div>
      
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {job.description}
      </p>
      
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {job.tags?.map((tag, index) => (
            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
              {tag}
            </span>
          ))}
        </div>
        <button className="btn-primary text-sm">
          Apply Now
        </button>
      </div>
    </div>
  )
}

export default JobCard








