import React from 'react';
import { FDOrganicLogo } from './FDOrganicLogo.jsx';
export const WSRetroLogo = ({ size = 'md', showTagline = false, app, onClick, className = '' }) => (
  <FDOrganicLogo size={['xs','sm','md','lg','xl','2xl'].includes(size) ? size : 'md'} showWordmark showTagline={showTagline} appName={app} onClick={onClick} className={className} />
);
export default WSRetroLogo;
