'use client';

import { useEffect, useRef } from 'react';

interface FeatherIconProps {
  name: string;
  className?: string;
  size?: number;
  [key: string]: any;
}

export default function FeatherIcon({ name, className = '', size = 24, ...props }: FeatherIconProps) {
  const iconRef = useRef<HTMLElement>(null);
  const isReplaced = useRef(false);

  useEffect(() => {
    const replaceIcon = async () => {
      if (!iconRef.current || isReplaced.current) return;
      
      try {
        const feather = (await import('feather-icons')).default;
        
        // Create a new element to avoid DOM manipulation issues
        const newElement = document.createElement('i');
        newElement.setAttribute('data-feather', name);
        newElement.className = className;
        
        // Copy all props to the new element
        Object.entries(props).forEach(([key, value]) => {
          if (key !== 'children') {
            newElement.setAttribute(key, String(value));
          }
        });
        
        // Replace the current element
        if (iconRef.current.parentNode) {
          iconRef.current.parentNode.replaceChild(newElement, iconRef.current);
          iconRef.current = newElement;
        }
        
        // Replace feather icons
        feather.replace();
        isReplaced.current = true;
      } catch (error) {
        console.warn('Failed to load feather icon:', name, error);
      }
    };

    replaceIcon();
  }, [name, className, size, props]);

  return (
    <i
      ref={iconRef}
      data-feather={name}
      className={className}
      style={{ width: size, height: size }}
      {...props}
    />
  );
}
