import React from 'react'
import { Building } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-4">
              <Building className="h-8 w-8 text-primary-400" />
              <span className="ml-2 text-xl font-bold">Teachers Link</span>
            </div>
            <p className="text-gray-400 mb-4">
              Connecting schools with amazing teachers worldwide. 
              The ultimate platform for educational recruitment.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">For Schools</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white">Post Jobs</a></li>
              <li><a href="#" className="hover:text-white">Find Teachers</a></li>
              <li><a href="#" className="hover:text-white">Manage Applications</a></li>
              <li><a href="#" className="hover:text-white">Pricing</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">For Teachers</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white">Browse Jobs</a></li>
              <li><a href="#" className="hover:text-white">Create Profile</a></li>
              <li><a href="#" className="hover:text-white">Track Applications</a></li>
              <li><a href="#" className="hover:text-white">Resources</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 Teachers Link. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer








