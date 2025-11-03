import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const AdminPlans = () => {
  const { token, user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    durationMonths: 12,
    description: '',
    features: '',
  });

  const fetchPlans = async () => {
    const { data } = await api.get('/api/plans');
    setPlans(data);
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      price: Number(formData.price),
      features: formData.features.split(',').map(f => f.trim()),
    };
    await api.post('/api/plans', payload);
    setFormData({ title: '', price: '', durationMonths: 12, description: '', features: '' });
    fetchPlans();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this plan?')) {
      await api.delete(`/api/plans/${id}`);
      fetchPlans();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin - Manage Plans</h1>

      <form onSubmit={handleCreate} className="mb-6 bg-white shadow-md rounded p-4">
        <h2 className="text-lg font-semibold mb-3">Create New Plan</h2>
        <input
          type="text"
          placeholder="Plan Title"
          className="border p-2 w-full mb-2"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
        <input
          type="number"
          placeholder="Price (₹)"
          className="border p-2 w-full mb-2"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          required
        />
        <input
          type="number"
          placeholder="Duration (months)"
          className="border p-2 w-full mb-2"
          value={formData.durationMonths}
          onChange={(e) => setFormData({ ...formData, durationMonths: e.target.value })}
          required
        />
        <textarea
          placeholder="Description"
          className="border p-2 w-full mb-2"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
        <input
          type="text"
          placeholder="Features (comma separated)"
          className="border p-2 w-full mb-2"
          value={formData.features}
          onChange={(e) => setFormData({ ...formData, features: e.target.value })}
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Create Plan
        </button>
      </form>

      <h2 className="text-lg font-semibold mb-2">Existing Plans</h2>
      <div className="grid gap-4">
        {plans.map((plan) => (
          <div key={plan._id} className="border rounded p-4 bg-gray-50">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">{plan.title}</h3>
                <p>₹{plan.price} / {plan.durationMonths} months</p>
                <p className="text-sm text-gray-600">{plan.description}</p>
                <ul className="list-disc ml-5 text-sm text-gray-700">
                  {plan.features?.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>
              <button
                onClick={() => handleDelete(plan._id)}
                className="bg-red-500 text-white px-3 py-1 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminPlans;
