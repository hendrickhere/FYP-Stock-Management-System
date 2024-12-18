import { useState, useEffect, useRef } from 'react';

export const useScrollDirection = ({ threshold = 10 } = {}) => {
  const [scrollDirection, setScrollDirection] = useState('up');
  const [isAtTop, setIsAtTop] = useState(true);
  const [prevScrollY, setPrevScrollY] = useState(0);
  const scrollableRef = useRef(null);

  useEffect(() => {
    const scrollableElement = document.querySelector('.scroll-container');
    if (scrollableElement) {
      scrollableRef.current = scrollableElement;
    }

    const handleScroll = (e) => {
      const currentScrollY = scrollableRef.current?.scrollTop || 0;
      const scrollDifference = Math.abs(currentScrollY - prevScrollY);

      setIsAtTop(currentScrollY < 10);

      if (scrollDifference < threshold) {
        return;
      }

      const newScrollDirection = currentScrollY > prevScrollY ? 'down' : 'up';
      setScrollDirection(newScrollDirection);
      setPrevScrollY(currentScrollY);

      console.log('Scroll values:', { 
        currentScrollY, 
        direction: newScrollDirection, 
        isAtTop: currentScrollY < 10 
      });
    };

    const throttledHandleScroll = throttle(handleScroll, 50);
    scrollableRef.current?.addEventListener('scroll', throttledHandleScroll);

    return () => {
      scrollableRef.current?.removeEventListener('scroll', throttledHandleScroll);
    };
  }, [prevScrollY, threshold]);

  return { scrollDirection, isAtTop };
};

// Utility function for throttling scroll events
function throttle(func, limit) {
  let timeout;
  return function (...args) {
    if (!timeout) {
      timeout = setTimeout(() => {
        func.apply(this, args);
        timeout = null;
      }, limit); 
    }
  };
}