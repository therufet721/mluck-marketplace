import React from 'react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/shift-away.css';

interface TooltipProps {
  content: string | React.ReactNode;
  children: React.ReactElement;
  placement?: 'top' | 'right' | 'bottom' | 'left';
}

// Simple workaround for React 19 ref handling with Tippy.js
const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  placement = 'top'
}) => {
  // Using React.cloneElement here without modifying refs
  const childElement = React.cloneElement(children);
  
  return (
    <Tippy
      content={content}
      placement={placement}
      animation="shift-away"
      arrow={true}
      duration={200}
      delay={[100, 0]}
      maxWidth={300}
      className="!bg-gray-800 !text-white !text-sm !px-3 !py-2 !rounded-lg !shadow-lg"
    >
      {childElement}
    </Tippy>
  );
};

// Add display name for React DevTools
Tooltip.displayName = 'Tooltip';

export default Tooltip; 