import React from 'react';
import { FDOrganicLogo } from './FDOrganicLogo.jsx';

// Backwards-compatible export; renders the unified FD Foods identity.
export const WSRetroLogo = ({ size = 'md', showTagline = false, app, onClick, className = '' }) => (
  <FDOrganicLogo size={['xs','sm','md','lg','xl','2xl'].includes(size) ? size : 'md'} showWordmark={true} showTagline={showTagline} appName={app} onClick={onClick} className={className} />
);
export default WSRetroLogo;
