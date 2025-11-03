import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { JobPostingProvider } from '../../context/JobPostingContext';
import UpgradePlan from '../../components/UpgradePlan';
import JobPostingWizard from '../../components/job-posting/JobPostingWizard';
import api from '../../api/axios';

const PostJob = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const isEditMode = !!editId;
  
  const [hasActivePlan, setHasActivePlan] = useState(null); // null = loading, true/false = result

  // ✅ Step 1: Protect route (only school/admin)
  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/login');
        return;
      }

      if (user.role !== 'school' && user.role !== 'admin') {
        navigate('/');
        return;
      }
    }
  }, [user, loading, navigate]);

  // ✅ Step 2: Check subscription plan and plan system status
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      try {
        // First check if plan system is enabled
        const planSystemRes = await api.get('/api/plans/system-status');
        const planSystemEnabled = planSystemRes.data.enabled;
        
        if (!planSystemEnabled) {
          // Plan system is disabled, allow free posting
          setHasActivePlan(true);
          return;
        }
        
        // Plan system is enabled, check subscription
        const res = await api.get('/api/subscription/status');
        setHasActivePlan(res.data.hasActivePlan);
      } catch (error) {
        console.error('Error checking subscription:', error);
        setHasActivePlan(false);
      }
    };

    if (user && user.role === 'school') {
      checkSubscriptionStatus();
    }
  }, [user]);

  // ✅ Step 3: Handle loading states
  if (loading || hasActivePlan === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // ✅ Step 4: If no active plan → show UpgradePlan
  if (!hasActivePlan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <UpgradePlan school={user} />
      </div>
    );
  }

  // ✅ Step 5: If plan active → show job posting form
  return (
    <JobPostingProvider>
      <JobPostingWizard mode={isEditMode ? 'edit' : 'create'} jobId={editId || null} />
    </JobPostingProvider>
  );
};

export default PostJob;
