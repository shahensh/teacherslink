import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Crown, Check, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

const TeacherUpgradePrompt = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // ✅ Fetch teacher plans created by Admin
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data } = await api.get('/api/plans?userType=teacher');
        setPlans(data);
      } catch (error) {
        console.error('Error fetching teacher plans:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  // ✅ Handle Razorpay payment
  const handlePayment = async (planId) => {
    try {
      setProcessing(true);
      const { data } = await api.post('/api/teacher-subscription/create-order', { planId });

      // Handle free plans - no payment needed
      if (data.isFree || data.success) {
        toast.success(data.message || 'Free plan activated successfully! 🎉');
        
        // Force full page reload to jobs page to refresh subscription status
        setTimeout(() => {
          if (user?.role === 'teacher') {
            window.location.href = '/teacher/jobs';
          } else {
            window.location.reload();
          }
        }, 1500); // Wait for toast to show
        return;
      }

      // Find the plan to get its name
      const selectedPlan = plans.find(plan => plan._id === planId);
      const planName = selectedPlan?.title || 'Teacher Plan';

      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: 'TeachersLink',
        description: `Teacher Plan: ${planName}`,
        order_id: data.orderId,
        handler: async function (response) {
          try {
            await api.post('/api/teacher-subscription/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planName: planName
            });
            
            toast.success('Payment successful! Plan activated. 🎉');
            
            // Force full page reload to jobs page to refresh subscription status
            setTimeout(() => {
              window.location.href = '/teacher/jobs';
            }, 1500);
          } catch (error) {
            console.error('Payment verification failed:', error);
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: {
          color: '#3B82F6'
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error);
        alert('Payment failed: ' + response.error.description);
      });
      razorpay.open();
    } catch (error) {
      console.error('Payment initiation failed:', error);
      const errorMessage = error.response?.data?.message || 'Payment initiation failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Crown className="w-12 h-12 text-yellow-500 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">Teacher Premium Plans</h1>
        </div>
        <p className="text-lg text-gray-600">
          Upgrade to premium to apply for unlimited jobs and access exclusive features
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan._id}
            className={`relative bg-white rounded-lg shadow-lg border-2 p-6 ${
              plan.price === 0 ? 'border-green-200' : 'border-blue-200'
            }`}
          >
            {plan.price === 0 && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  FREE
                </span>
              </div>
            )}
            
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.title}</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-blue-600">
                  ₹{plan.price}
                </span>
                <span className="text-gray-500">/{plan.durationMonths} months</span>
              </div>
              
              {plan.description && (
                <p className="text-gray-600 mb-4">{plan.description}</p>
              )}
              
              <ul className="text-left space-y-2 mb-6">
                {plan.features?.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button
                onClick={() => handlePayment(plan._id)}
                disabled={processing}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                  plan.price === 0
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                } ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {processing ? 'Processing...' : plan.price === 0 ? 'Get Free Plan' : 'Upgrade Now'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {plans.length === 0 && (
        <div className="text-center py-12">
          <X className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Plans Available</h3>
          <p className="text-gray-500">
            No teacher plans have been created yet. Please contact the administrator.
          </p>
        </div>
      )}
    </div>
  );
};

export default TeacherUpgradePrompt;
