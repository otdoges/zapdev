import { useState, useEffect } from 'react';

const useIsMobile = (maxWidth: number = 768): boolean => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDeviceSize = () => {
      setIsMobile(window.innerWidth <= maxWidth);
    };

    // Check on initial mount
    checkDeviceSize();

    // Add event listener for window resize
    window.addEventListener('resize', checkDeviceSize);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('resize', checkDeviceSize);
    };
  }, [maxWidth]);

  return isMobile;
};

export default useIsMobile;
