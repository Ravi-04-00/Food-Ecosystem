import React from 'react';
import { FDOrganicLogo } from './FDOrganicLogo.jsx';

// Legacy-compatible component name; all visible branding now uses FD Foods.
export const WSLogo = ({ size = 'md', showTagline = true, showWordmark = true, appName = null, theme = 'light', className = '', onClick }) => (
  <FDOrganicLogo size={['xs','sm','md','lg','xl','2xl'].includes(size) ? size : 'md'} showWordmark={showWordmark} showTagline={showTagline} appName={appName} theme={theme} className={className} onClick={onClick} />
);
export const WPLogo = WSLogo;
export default WSLogo;
