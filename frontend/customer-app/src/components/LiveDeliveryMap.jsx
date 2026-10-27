import React from 'react';
import { GoogleLiveMap } from './GoogleLiveMap.jsx';

export const LiveDeliveryMap = ({ 
  trackingData = null, 
  onOpenChat = null 
}) => {
  const restaurant = trackingData?.restaurant || {
    name: 'FD Kitchen Partner',
    latitude: 12.9785,
    longitude: 77.6015,
    address: 'Indiranagar 100ft Rd'
  };

  const customer = trackingData?.customer || {
    delivery_address: 'Drop-off Address',
    latitude: 12.9716,
    longitude: 77.5946
  };

  const deliveryPartner = trackingData?.delivery_partner || {
    name: 'Courier Partner',
    latitude: 12.9750,
    longitude: 77.5980,
    heading: 45,
    is_stale: false,
    staleness_seconds: 0
  };

  const mapsKey = trackingData?.google_maps_key || '';

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <GoogleLiveMap
        restaurant={restaurant}
        customer={customer}
        deliveryPartner={deliveryPartner}
        apiKey={mapsKey}
        orderStatus={trackingData?.status || 'ON_THE_WAY'}
        height="380px"
      />
    </div>
  );
};
