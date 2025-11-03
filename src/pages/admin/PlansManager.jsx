import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { 
  Plus, 
  ToggleLeft, 
  ToggleRight, 
  Building, 
  Users, 
  Crown, 
  Edit, 
  Trash2,
  Save,
  X
} from 'lucide-react';

export default function PlansManager() {
  const { token, user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState({ 
    title: '', 
    price: '', 
    durationMonths: 12, 
    description: '', 
    features: '', 
    userType: 'school' 
  });
  const [schoolPlansEnabled, setSchoolPlansEnabled] = useState(true);
  const [teacherPlansEnabled, setTeacherPlansEnabled] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { 
    fetchPlans(); 
  }, []);

  async function fetchPlans() {
    try {
      setLoading(true);
      const res = await api.get('/api/plans');
      setPlans(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch plans');
      setPlans([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }


  async function createPlan(e) {
    e.preventDefault();
    try {
      setLoading(true);
      const body = {
        title: form.title,
        price: Number(form.price),
        durationMonths: Number(form.durationMonths),
        description: form.description,
        features: form.features.split('\n').map(s => s.trim()).filter(Boolean),
        userType: form.userType
      };
      await api.post('/api/plans', body);
      toast.success('Plan created successfully');
      setForm({ title: '', price: '', durationMonths: 12, description: '', features: '', userType: 'school' });
      setShowCreateForm(false);
      fetchPlans();
    } catch (err) {
      console.error(err);
      toast.error('Failed to create plan');
    } finally {
      setLoading(false);
    }
  }


  async function toggleSchoolPlans() {
    try {
      setLoading(true);
      const newStatus = !schoolPlansEnabled;
      // console.log('Toggling school plans:', newStatus);
      
      try {
        const response = await api.put('/api/plans/school-status', { enabled: newStatus });
        // console.log('School plans response:', response.data);
        setSchoolPlansEnabled(newStatus);
        toast.success(`School plans ${newStatus ? 'enabled' : 'disabled'}`);
      } catch (apiError) {
        console.warn('API call failed, using local state:', apiError);
        // Fallback to local state if API fails
        setSchoolPlansEnabled(newStatus);
        toast.success(`School plans ${newStatus ? 'enabled' : 'disabled'} (local)`);
      }
    } catch (err) {
      console.error('Toggle school plans error:', err);
      toast.error('Failed to update school plans status');
    } finally {
      setLoading(false);
    }
  }

  async function toggleTeacherPlans() {
    try {
      setLoading(true);
      const newStatus = !teacherPlansEnabled;
      // console.log('Toggling teacher plans:', newStatus);
      
      try {
        const response = await api.put('/api/plans/teacher-status', { enabled: newStatus });
        // console.log('Teacher plans response:', response.data);
        setTeacherPlansEnabled(newStatus);
        toast.success(`Teacher plans ${newStatus ? 'enabled' : 'disabled'}`);
      } catch (apiError) {
        console.warn('API call failed, using local state:', apiError);
        // Fallback to local state if API fails
        setTeacherPlansEnabled(newStatus);
        toast.success(`Teacher plans ${newStatus ? 'enabled' : 'disabled'} (local)`);
      }
    } catch (err) {
      console.error('Toggle teacher plans error:', err);
      toast.error('Failed to update teacher plans status');
    } finally {
      setLoading(false);
    }
  }

  async function deletePlan(planId) {
    if (!window.confirm('Are you sure you want to delete this plan?')) return;
    
    try {
      setLoading(true);
      await api.delete(`/api/plans/${planId}`);
      toast.success('Plan deleted successfully');
    fetchPlans();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete plan');
    } finally {
      setLoading(false);
    }
  }

  const schoolPlans = (plans || []).filter(p => p.userType === 'school');
  const teacherPlans = (plans || []).filter(p => p.userType === 'teacher');

  // Show loading state while data is being fetched
  if (loading && plans.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading plans...</p>
        </div>
      </div>
    );
  }

  // Error boundary - catch any rendering errors
  try {

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Plans Management</h1>
              <p className="text-gray-600 mt-2">Manage subscription plans for schools and teachers</p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Plan
            </button>
          </div>
        </div>

        {/* System Controls */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900">System Controls</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* School Plans Toggle */}
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <Building className="w-5 h-5 text-blue-600 mr-3" />
                  <div>
                    <h4 className="font-medium text-gray-900">School Plans</h4>
                    <p className="text-sm text-gray-600">Enable/disable school plans</p>
                  </div>
                </div>
                <button
                  onClick={toggleSchoolPlans}
                  disabled={loading}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    schoolPlansEnabled ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      schoolPlansEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Teacher Plans Toggle */}
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-green-600 mr-3" />
                  <div>
                    <h4 className="font-medium text-gray-900">Teacher Plans</h4>
                    <p className="text-sm text-gray-600">Enable/disable teacher plans</p>
                  </div>
                </div>
                <button
                  onClick={toggleTeacherPlans}
                  disabled={loading}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    teacherPlansEnabled ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      teacherPlansEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Create Plan Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Create New Plan</h3>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={createPlan} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Plan Title</label>
                      <input
                        type="text"
                        value={form.title}
                        onChange={(e) => setForm({...form, title: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Premium Plan"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">User Type</label>
                      <select
                        value={form.userType}
                        onChange={(e) => setForm({...form, userType: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="school">School</option>
                        <option value="teacher">Teacher</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹)</label>
                      <input
                        type="number"
                        value={form.price}
                        onChange={(e) => setForm({...form, price: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="999"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Duration (Months)</label>
                      <input
                        type="number"
                        value={form.durationMonths}
                        onChange={(e) => setForm({...form, durationMonths: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="12"
                        required
                      />
                    </div>
                  </div>

      <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({...form, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Plan description..."
                    />
                  </div>

              <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Features (one per line)</label>
                    <textarea
                      value={form.features}
                      onChange={(e) => setForm({...form, features: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                      placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                    />
                  </div>

                  <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Creating...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Create Plan
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* School Plans */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Building className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">School Plans ({schoolPlans.length})</h3>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                schoolPlansEnabled 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {schoolPlansEnabled ? 'Enabled' : 'Disabled'}
              </div>
            </div>
          </div>

          <div className="p-6">
            {schoolPlans.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No school plans created yet
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {schoolPlans.map((plan) => (
                  <div key={plan._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">{plan.title}</h4>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => deletePlan(plan._id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="text-3xl font-bold text-gray-900">
                        ₹{plan.price}
                        <span className="text-lg font-medium text-gray-500">/{plan.durationMonths} months</span>
                      </div>
                    </div>

                    {plan.description && (
                      <p className="text-gray-600 mb-4">{plan.description}</p>
                    )}

                    <div className="mb-4">
                      <h5 className="font-medium text-gray-900 mb-2">Features:</h5>
                      <ul className="space-y-1">
                        {plan.features && Array.isArray(plan.features) && plan.features.length > 0 ? (
                          plan.features.map((feature, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-center">
                              <Crown className="w-3 h-3 text-yellow-500 mr-2" />
                              {feature}
                            </li>
                          ))
                        ) : (
                          <li className="text-sm text-gray-500 italic">No features listed</li>
                        )}
                </ul>
              </div>

                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        plan.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {plan.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-xs text-gray-500">
                        Created: {new Date(plan.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Teacher Plans */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="w-5 h-5 text-green-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Teacher Plans ({teacherPlans.length})</h3>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                teacherPlansEnabled 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {teacherPlansEnabled ? 'Enabled' : 'Disabled'}
              </div>
            </div>
          </div>

          <div className="p-6">
            {teacherPlans.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No teacher plans created yet
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teacherPlans.map((plan) => (
                  <div key={plan._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">{plan.title}</h4>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => deletePlan(plan._id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="text-3xl font-bold text-gray-900">
                        ₹{plan.price}
                        <span className="text-lg font-medium text-gray-500">/{plan.durationMonths} months</span>
                      </div>
                    </div>

                    {plan.description && (
                      <p className="text-gray-600 mb-4">{plan.description}</p>
                    )}

                    <div className="mb-4">
                      <h5 className="font-medium text-gray-900 mb-2">Features:</h5>
                      <ul className="space-y-1">
                        {plan.features && Array.isArray(plan.features) && plan.features.length > 0 ? (
                          plan.features.map((feature, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-center">
                              <Crown className="w-3 h-3 text-yellow-500 mr-2" />
                              {feature}
                            </li>
                          ))
                        ) : (
                          <li className="text-sm text-gray-500 italic">No features listed</li>
                        )}
                      </ul>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        plan.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {plan.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-xs text-gray-500">
                        Created: {new Date(plan.createdAt).toLocaleDateString()}
                      </span>
            </div>
          </div>
        ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
  } catch (error) {
    console.error('PlansManager rendering error:', error);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">There was an error loading the plans page.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reload Page
          </button>
      </div>
    </div>
  );
}
}