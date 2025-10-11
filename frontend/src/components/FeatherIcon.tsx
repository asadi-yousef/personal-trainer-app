'use client';

import { useEffect, useRef, useState } from 'react';

interface FeatherIconProps {
  name: string;
  className?: string;
  size?: number;
  strokeWidth?: number;
  [key: string]: any;
}

// Cache for loaded SVGs to avoid repeated imports
const svgCache = new Map<string, string>();
let featherLib: any = null;

export default function FeatherIcon({ 
  name, 
  className = '', 
  size = 24, 
  strokeWidth = 2,
  ...props 
}: FeatherIconProps) {
  const [svg, setSvg] = useState<string>('');
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    
    const loadIcon = async () => {
      if (!mounted.current || typeof window === 'undefined') return;
      
      try {
        // Check cache first
        const cacheKey = `${name}-${size}-${strokeWidth}`;
        if (svgCache.has(cacheKey)) {
          if (mounted.current) {
            setSvg(svgCache.get(cacheKey)!);
          }
          return;
        }

        // Load feather-icons library once
        if (!featherLib) {
          featherLib = (await import('feather-icons')).default;
        }

        // Get the SVG string for the icon
        if (featherLib.icons[name]) {
          const svgString = featherLib.icons[name].toSvg({
            width: size,
            height: size,
            'stroke-width': strokeWidth,
            class: className
          });
          
          // Cache it
          svgCache.set(cacheKey, svgString);
          
          if (mounted.current) {
            setSvg(svgString);
          }
        }
      } catch (error) {
        console.warn('Failed to load feather icon:', name, error);
      }
    };

    loadIcon();

    return () => {
      mounted.current = false;
    };
  }, [name, className, size, strokeWidth]);

  // Render the SVG directly without DOM manipulation
  if (!svg) {
    // Placeholder while loading
    return (
      <span
        className={className}
        style={{ display: 'inline-block', width: size, height: size }}
        {...props}
      />
    );
  }

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: svg }}
      {...props}
    />
  );
}
