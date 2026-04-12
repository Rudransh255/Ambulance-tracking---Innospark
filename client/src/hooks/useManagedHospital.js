import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { hospitalAPI } from '../services/api';

export default function useManagedHospital() {
  const [hospital, setHospital] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadHospital = useCallback(async (showErrorToast = true) => {
    try {
      setIsLoading(true);
      const data = await hospitalAPI.getMine();
      setHospital(data);
      return data;
    } catch (err) {
      setHospital(null);
      if (showErrorToast) {
        toast.error(err.message || 'Failed to load your hospital profile');
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHospital();
  }, [loadHospital]);

  return {
    hospital,
    hospitalId: hospital?.id || null,
    isLoading,
    refreshHospital: loadHospital,
  };
}
