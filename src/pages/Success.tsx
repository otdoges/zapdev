import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function Success() {
  const navigate = useNavigate();
  useEffect(() => {
    let canceled = false;
    fetch('/api/success', { method: 'POST', credentials: 'include' })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 401) {
            toast.error('Please sign in to continue.');
          } else {
            toast.error('Unable to complete setup. Please try again.');
          }
          return;
        }
        if (!canceled) navigate('/settings');
      })
      .catch(() => {
        toast.error('Network error. Please try again.');
      });
    return () => {
      canceled = true;
    };
  }, [navigate]);
  return null;
}


