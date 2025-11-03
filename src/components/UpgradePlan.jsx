import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const UpgradePlan = () => {
  const { token, user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch available plans created by Admin (filtered by user role)
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        // Determine userType based on user role
        const userType = user?.role === 'school' ? 'school' : user?.role === 'teacher' ? 'teacher' : null;
        
        // Build API URL with userType query parameter
        const apiUrl = userType ? `/api/plans?userType=${userType}` : '/api/plans';
        
        const { data } = await api.get(apiUrl);
        setPlans(data);
      } catch (error) {
        console.error('Error fetching plans:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchPlans();
    } else {
      setLoading(false);
    }
  }, [user]);

  // ✅ Handle Razorpay payment
  const handlePayment = async (planId) => {
    try {
      console.log('Initiating payment for plan:', planId);
      const { data } = await api.post('/api/subscription/create-order', { planId });
      console.log('Order created:', data);

      // Handle free plans - no payment needed
      if (data.isFree) {
        alert('✅ ' + (data.message || 'Free plan activated successfully!'));
        // Redirect to appropriate dashboard based on user role
        if (user?.role === 'school') {
          window.location.href = '/school';
        } else if (user?.role === 'teacher') {
          window.location.href = '/teacher';
        } else {
          window.location.reload();
        }
        return;
      }

      // Find the plan to get its name
      const plan = plans.find(p => p._id === planId);
      const planName = plan ? plan.title : 'Unknown Plan';

      // Check if Razorpay is loaded
      if (!window.Razorpay) {
        alert('❌ Payment gateway not loaded. Please refresh the page and try again.');
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        name: 'TeachersLink Premium',
        description: `Upgrade to plan - ${planName}`,
        order_id: data.orderId,
        handler: async function (response) {
          console.log('Payment response:', response);
          try {
            const verify = await api.post('/api/subscription/verify', { 
              ...response, 
              planName: planName 
            });
            console.log('Verification response:', verify.data);

            if (verify.data.success) {
              alert('✅ Payment successful! Your premium plan is now active.');
              // Redirect to appropriate dashboard based on user role
              if (user?.role === 'school') {
                window.location.href = '/school';
              } else if (user?.role === 'teacher') {
                window.location.href = '/teacher';
              } else {
                window.location.reload();
              }
            } else {
              alert('❌ Payment verification failed.');
            }
          } catch (err) {
            console.error('Verification error:', err);
            alert('❌ Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: user?.name || 'School Admin',
          email: user?.email || 'school@example.com',
        },
        theme: {
          color: '#2563eb',
        },
      };

      console.log('Opening Razorpay with options:', options);
      const razor = new window.Razorpay(options);
      razor.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error);
        alert('Payment failed: ' + response.error.description);
      });
      razor.open();
    } catch (error) {
      console.error('Error in payment process:', error);
      alert('Payment initiation failed.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-2xl shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-center">Upgrade Your Plan</h2>
      {plans.length === 0 ? (
        <p className="text-center text-gray-500">No plans available right now.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {plans.map((plan) => (
            <div
              key={plan._id}
              className="border rounded-xl p-5 shadow-sm hover:shadow-lg transition duration-200 bg-gray-50"
            >
              <h3 className="text-xl font-bold text-blue-600">{plan.title}</h3>
              <p className="text-lg font-semibold mt-1">₹{plan.price}</p>
              <p className="text-sm text-gray-600 mb-3">
                Duration: {plan.durationMonths} months
              </p>
              {plan.description && (
                <p className="text-gray-700 mb-2">{plan.description}</p>
              )}
              {plan.features?.length > 0 && (
                <ul className="list-disc ml-5 text-sm text-gray-600 mb-3">
                  {plan.features.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              )}
              <button
                onClick={() => handlePayment(plan._id)}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Buy Now
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UpgradePlan;
