import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Success() {
  const navigate = useNavigate();
  useEffect(() => {
    const id = localStorage.getItem('convexUserId');
    if (id) {
      fetch(`/api/success?userId=${encodeURIComponent(id)}`, { method: 'POST' })
        .catch(() => {})
        .finally(() => {
          navigate('/settings');
        });
    } else {
      navigate('/settings');
    }
  }, [navigate]);
  return null;
}


