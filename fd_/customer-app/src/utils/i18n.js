import React, { useState, useEffect, useCallback } from 'react';

export const TRANSLATIONS = {
  en: {
    // Navigation / Sections (Phase 6 preserved)
    settings: 'Settings & Preferences',
    settings_subtitle: 'Manage your personal account preferences, appearance, notifications, and security.',
    account: 'Account',
    appearance: 'Appearance',
    language: 'Language',
    notifications: 'Notifications',
    privacy: 'Privacy',
    security: 'Security',
    about: 'About',
    work_preferences: 'Work Preferences',
    business_preferences: 'Business Preferences',
    system_preferences: 'System Preferences',

    // Account Section
    view_profile: 'View Profile',
    edit_profile: 'Edit Profile',
    account_status: 'Account Status',
    verified: 'Verified Active',
    logout: 'Logout',
    logout_confirm_title: 'Confirm Logout',
    logout_confirm_msg: 'Are you sure you want to log out of your session?',
    cancel: 'Cancel',
    save_changes: 'Save Changes',
    saving: 'Saving...',

    // Appearance
    theme: 'Theme Mode',
    theme_desc: 'Select your preferred visual style across the platform.',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    light_desc: 'Signature warm ivory and premium emerald luxury theme',
    dark_desc: 'OLED-optimized dark surface with high contrast accents',
    system_desc: 'Automatically matches your device operating system theme',

    // Language
    language_pref: 'Language Preference',
    language_desc: 'Choose the language used for platform text and controls.',
    english: 'English',
    tamil: 'தமிழ் (Tamil)',
    hindi: 'हिन्दी (Hindi)',

    // Notifications
    notification_prefs: 'Notification Preferences',
    notification_desc: 'Control which channels we use to communicate with you.',
    push_notifications: 'Push Notifications',
    push_desc: 'Receive instant device alerts for orders and delivery updates.',
    email_notifications: 'Email Notifications',
    email_desc: 'Receive digital receipts, monthly digests, and policy news.',
    sms_notifications: 'SMS Notifications',
    sms_desc: 'Receive critical SMS alerts for account security and dispatch.',

    // Privacy
    privacy_prefs: 'Privacy & Personalization',
    personalization: 'Personalized Recommendations',
    personalization_desc: 'Tailor restaurant listings and curated food selections to your tastes.',
    location_permission: 'Location Permission Preference',
    location_desc: 'Allow app to use stored depot/delivery zone preferences without live GPS tracking.',

    // Security
    security_info: 'Session & Security Information',
    active_sessions: 'Active Login Sessions',
    session_notice: 'Your authentication session is protected with secure JWT credentials.',
    jwt_status: 'JWT Token Status',
    jwt_active: 'Active & Verified',

    // About
    brand_name: 'FD — Fast Delivery',
    app_version: 'Application Version',
    terms_of_service: 'Terms of Service',
    privacy_policy: 'Privacy Policy',
    customer_support: 'Customer Support & Help Desk',
    all_rights_reserved: 'All rights reserved. Fast Delivery Ecosystem.',

    // Feedback
    settings_saved: 'Settings saved successfully.',
    language_changed: 'Language preference updated.',
    theme_changed: 'Theme preference updated.',
    notifications_changed: 'Notification preferences updated.',
    save_failed: 'Settings could not be saved. Please try again.',
    unsaved_changes: 'You have unsaved changes.',

    // Restaurant / Courier Specific Settings (Phase 6 preserved)
    order_alerts: 'Order Chime & Alerts',
    order_alerts_desc: 'Play audible chimes when high-priority delivery orders arrive.',
    business_status: 'Store Status Preference',
    business_status_desc: 'Set standard kitchen operating status across the ecosystem.',
    shift_status: 'Shift Status',
    working_hours: 'Working Hours',
    start_time: 'Preferred Start Time',
    end_time: 'Preferred End Time',
    available_days: 'Available Working Days',
    break_time: 'Break Window',
    break_start: 'Break Start',
    break_end: 'Break End',
    zone_preference: 'Primary Zone Preference',
    zone_desc: 'Preferred area prioritized during shift kickoff.',
    availability_status: 'Fleet Availability Status',

    // Namespaces
    common: {
      save: 'Save',
      saved: 'Saved',
      saving: 'Saving...',
      save_changes: 'Save Changes',
      cancel: 'Cancel',
      confirm: 'Confirm',
      close: 'Close',
      back: 'Back',
      next: 'Next',
      delete: 'Delete',
      edit: 'Edit',
      search: 'Search',
      search_placeholder: 'Search dishes, kitchens, or cuisines...',
      filter: 'Filter',
      all: 'All',
      view_all: 'View All',
      refresh: 'Refresh',
      retry: 'Retry',
      loading: 'Loading...',
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      active: 'Active',
      inactive: 'Inactive',
      online: 'Online',
      offline: 'Offline',
      status: 'Status',
      actions: 'Actions',
      details: 'Details',
      amount: 'Amount',
      price: 'Price',
      total: 'Total',
      date: 'Date',
      time: 'Time',
      na: 'N/A',
      copy: 'Copy',
      copied: 'Copied!',
      verified: 'Verified Active',
      yes: 'Yes',
      no: 'No',
      clear: 'Clear',
      intro: '🎬 Intro',
      register: '✨ Register',
      partner_auth: 'Partner Auth'
    },

    nav: {
      explore: 'Explore',
      kitchens: 'Kitchens',
      offers: 'Offers',
      cart: 'Cart',
      orders: 'Orders',
      profile: 'Profile',
      settings: 'Settings',
      dashboard: 'Dashboard',
      orders_feed: 'Orders Feed',
      kds: 'Kitchen KDS',
      menu: 'Menu Catalog',
      inventory: 'Inventory',
      disputes: 'Disputes',
      reviews: 'Reviews',
      settlements: 'Settlements',
      hud_home: 'HUD Home',
      active_trip: 'Active Trip',
      earnings: 'Earnings',
      trip_logs: 'Trip Logs',
      live_map: 'Live Control Map',
      fleet: 'Fleet Manager',
      customers: 'Customer Directory',
      reports: 'Analytics & BI',
      support: 'Support Center',
      security: 'Security & Audits',
      dispatch: 'Dispatch Center',
      logout: 'Logout',
      sign_in: 'Sign In',
      sign_out: 'Sign Out'
    },

    auth: {
      sign_in: 'Sign In',
      sign_out: 'Sign Out',
      login_title: 'Welcome Back',
      register_title: 'Create Your Account',
      partner_login: 'Partner Auth',
      email: 'Email Address',
      password: 'Password',
      full_name: 'Full Name',
      phone: 'Phone Number',
      remember_me: 'Remember Me',
      forgot_password: 'Forgot Password?',
      switch_to_register: "Don't have an account? Sign up",
      switch_to_login: 'Already have an account? Sign in',
      logout_confirm_title: 'Confirm Logout',
      logout_confirm_msg: 'Are you sure you want to log out of your session?',
      session_expired: 'Session Expired',
      session_expired_msg: 'Your secure login session has expired. Please sign in again.'
    },

    customer: {
      delivering_to: 'DELIVERING TO',
      change_location: '[Change]',
      add_to_cart: 'Add to Cart',
      in_cart: 'In Cart',
      cart_title: 'Your Food Basket',
      empty_cart: 'Your cart is empty',
      empty_cart_desc: 'Explore popular kitchens and add mouth-watering dishes to your bag.',
      items_count: '{{count}} items',
      items_count_single: '1 item',
      checkout: 'Proceed to Checkout',
      order_now: 'Order Now',
      delivery_address: 'Delivery Address',
      order_summary: 'Order Summary',
      subtotal: 'Food Subtotal',
      delivery_fee: 'Delivery Partner Fee',
      platform_fee: 'Platform Processing Fee',
      discount: 'Discount Savings',
      total_payable: 'Total Payable',
      payment_method: 'Payment Method',
      cash_on_delivery: 'Cash on Delivery (COD)',
      online_payment: 'Instant Online Payment',
      place_order: 'Place Order Now',
      track_order: 'Track Order',
      estimated_delivery: 'Estimated Delivery',
      rate_order: 'Rate Food & Delivery',
      save_address: 'Save Address'
    },

    restaurant: {
      kitchen_portal: 'Merchant Kitchen Portal',
      store_status: 'Kitchen Status',
      open_for_orders: 'OPEN FOR ORDERS',
      closed: 'KITCHEN CLOSED',
      toggle_store_status: 'Toggle Status',
      add_dish: '+ Add Dish',
      active_orders_count: '{{count}} Active Kitchen Orders',
      incoming: 'Incoming Orders',
      cooking: 'In Kitchen Prep',
      ready: 'Ready for Dispatch',
      accept: 'Accept Order',
      reject: 'Reject',
      mark_preparing: 'Start Cooking',
      mark_ready: 'Mark Food Ready',
      prep_time: 'Prep Time (mins)',
      menu_catalog: 'Menu Catalog',
      dish_name: 'Dish Name',
      price: 'Price (₹)',
      category: 'Category',
      is_available: 'In Stock',
      sold_out: 'Sold Out'
    },

    delivery: {
      rider_hud: 'Delivery Partner HUD',
      shift_status: 'Duty Status',
      go_online: 'Go Online',
      go_offline: 'Go Offline',
      on_duty: 'ON DUTY (READY)',
      off_duty: 'OFF DUTY',
      incoming_trip: 'Incoming Delivery Request',
      accept_trip: 'Accept Trip',
      decline_trip: 'Decline',
      pickup_address: 'Pickup Restaurant',
      delivery_address: 'Customer Drop Location',
      start_trip: 'Navigate to Pickup',
      arrived_at_store: 'Arrived at Store',
      food_picked_up: 'Confirm Food Pickup',
      out_for_delivery: 'Out for Delivery',
      arrived_at_customer: 'Arrived at Customer',
      enter_otp: 'Enter 4-Digit Delivery OTP',
      verify_otp: 'Verify & Complete Delivery',
      delivery_completed: 'Delivery Completed!',
      today_earnings: "Today's Earnings",
      trips_completed: 'Trips Completed',
      sos_support: 'Emergency SOS Hotline'
    },

    admin: {
      mission_control: 'Fast Delivery Mission Control',
      overview: 'Ecosystem Overview',
      total_orders: 'Total Orders',
      completed_orders: 'Completed Orders',
      cancelled_orders: 'Cancelled Orders',
      gross_merchandise_value: 'Gross Order Value',
      net_revenue: 'Platform Commission',
      active_kitchens: 'Active Kitchens',
      active_riders: 'Active Couriers',
      dispatch_queue: 'Dispatch Control Queue',
      auto_dispatch: 'Autonomous Dispatch',
      manual_dispatch: 'Assign Courier Manually',
      reconciliation: 'Payment Reconciliation',
      system_status: 'Django REST + Telemetry Active'
    },

    orders: {
      order_number: 'Order #{{order_number}}',
      status_placed: 'Order Placed',
      status_confirmed: 'Confirmed by Kitchen',
      status_preparing: 'Cooking in Kitchen',
      status_ready: 'Food Ready for Pickup',
      status_dispatched: 'Out for Delivery',
      status_delivered: 'Delivered Successfully',
      status_cancelled: 'Order Cancelled'
    },

    status: {
      OPEN: 'Open',
      CLOSED: 'Closed',
      ONLINE: 'Online',
      OFFLINE: 'Offline',
      AVAILABLE: 'Available',
      PENDING: 'Pending',
      CONFIRMED: 'Confirmed',
      PREPARING: 'Preparing',
      READY: 'Ready',
      ASSIGNED: 'Assigned',
      PICKED_UP: 'Picked Up',
      ON_THE_WAY: 'On the Way',
      DELIVERED: 'Delivered',
      CANCELLED: 'Cancelled',
      PAID: 'Paid',
      REFUNDED: 'Refunded'
    },

    settlements: {
      settlements_management: 'Restaurant Commission & Settlements',
      gross_sales: 'Gross Food Sales',
      commission_deducted: 'Platform Commission',
      net_payable: 'Net Store Payout',
      settlement_status: 'Settlement Status',
      status_pending: 'Pending Settlement',
      status_processing: 'Processing Bank Transfer',
      status_paid: 'Settled & Paid',
      utr_reference: 'Bank UTR Number',
      settle_now: 'Trigger Batch Settlement'
    },

    disputes: {
      dispute_center: 'Customer Disputes & Support',
      ticket_number: 'Ticket #{{number}}',
      category: 'Category',
      priority: 'Priority',
      resolved: 'Resolved',
      open_ticket: 'Open Dispute',
      file_dispute: 'File New Dispute'
    },

    notifications_hub: {
      notification_center: 'Notification Center',
      mark_all_read: 'Mark All Read',
      clear_all: 'Clear All',
      no_notifications: 'No notifications found.',
      unread: 'Unread'
    },

    language: {
      language: 'Language',
      language_pref: 'Language Preference',
      language_desc: 'Choose the language used for platform text and controls.',
      select_language: 'Select Language',
      english: 'English',
      tamil: 'தமிழ் (Tamil)',
      language_changed: 'Language preference updated.',
      instant_switch: 'Instant Switch'
    },

    pwa: {
      install_app: 'Install App',
      install_title: 'Install Fast Delivery',
      install_desc: 'Add to home screen for lightning-fast orders, smoother navigation, and offline resilience.',
      install_btn: 'Install Now',
      install_ios_step1: 'Tap the Share icon in Safari (bottom bar)',
      install_ios_step2: 'Select "Add to Home Screen" from the menu',
      install_desktop_guide: 'Click the install icon in your browser address bar to install this app.',
      installed_badge: 'Installed (Standalone)',
      update_title: 'Update Available',
      update_desc: 'A new version of Fast Delivery is available with improvements.',
      update_now: 'Update Now',
      later: 'Later',
      offline_badge: 'Offline Mode',
      offline_banner_title: 'You are currently working offline',
      offline_banner_desc: 'Live orders, payments, GPS tracking, and server operations require an active network connection.',
      offline_delivery_warning: 'Caution: Live GPS location sync and new dispatch requests are paused while offline.',
      retry_connection: 'Retry Connection',
      checking_connection: 'Connecting to server...',
      online_restored: 'Network connection restored!'
    }
  },

  ta: {
    // Navigation / Sections (Phase 6 preserved)
    settings: 'அமைப்புகள் & விருப்பங்கள்',
    settings_subtitle: 'உங்கள் தனிப்பட்ட கணக்கு விருப்பங்கள், தோற்றம், அறிவிப்புகள் மற்றும் பாதுகாப்பை நிர்வகிக்கவும்.',
    account: 'கணக்கு',
    appearance: 'தோற்றம்',
    language: 'மொழி',
    notifications: 'அறிவிப்புகள்',
    privacy: 'தனியுரிமை',
    security: 'பாதுகாப்பு',
    about: 'பற்றி',
    work_preferences: 'பணி விருப்பங்கள்',
    business_preferences: 'வணிக விருப்பங்கள்',
    system_preferences: 'கணினி விருப்பங்கள்',

    // Account Section
    view_profile: 'சுயவிவரத்தைக் காண்க',
    edit_profile: 'சுயவிவரத்தைத் திருத்து',
    account_status: 'கணக்கு நிலை',
    verified: 'சரிபார்க்கப்பட்டது (செயலில்)',
    logout: 'வெளியேறு',
    logout_confirm_title: 'வெளியேறலை உறுதிப்படுத்தவும்',
    logout_confirm_msg: 'நிச்சயமாக உங்கள் அமர்விலிருந்து வெளியேற விரும்புகிறீர்களா?',
    cancel: 'ரத்துசெய்',
    save_changes: 'மாற்றங்களைச் சேமி',
    saving: 'சேமிக்கப்படுகிறது...',

    // Appearance
    theme: 'தோற்ற முறை',
    theme_desc: 'தளத்திற்கான உங்கள் விருப்ப தோற்றத்தைத் தேர்ந்தெடுக்கவும்.',
    light: 'ஒளி (Light)',
    dark: 'இருள் (Dark)',
    system: 'சாதனம் (System)',
    light_desc: 'கையொப்ப உணவு விநியோக ஆடம்பர ஒளி தீம்',
    dark_desc: 'கண்களுக்கு இதமான உயர்தர இருண்ட தீம்',
    system_desc: 'உங்கள் சாதன அமைப்புகளுடன் தானாகப் பொருந்தும்',

    // Language
    language_pref: 'மொழி விருப்பம்',
    language_desc: 'தளத்தில் பயன்படுத்தப்படும் முதன்மை மொழியைத் தேர்வுசெய்யவும்.',
    english: 'English (ஆங்கிலம்)',
    tamil: 'தமிழ் (Tamil)',
    hindi: 'हिन्दी (இந்தி)',

    // Notifications
    notification_prefs: 'அறிவிப்பு விருப்பங்கள்',
    notification_desc: 'உங்களைத் தொடர்பு கொள்ளும் வழிகளைத் தீர்மானிக்கவும்.',
    push_notifications: 'புஷ் அறிவிப்புகள்',
    push_desc: 'ஆர்டர்கள் மற்றும் விநியோக நிகழ்வுகளுக்கான உடனடி அறிவிப்புகளைப் பெறவும்.',
    email_notifications: 'மின்னஞ்சல் அறிவிப்புகள்',
    email_desc: 'ரசீதுகள் மற்றும் முக்கிய புதுப்பிப்புகளை மின்னஞ்சலில் பெறவும்.',
    sms_notifications: 'எஸ்.எம்.எஸ் அறிவிப்புகள்',
    sms_desc: 'கணக்கு பாதுகாப்பு மற்றும் புதுப்பிப்புகளை குறுஞ்செய்தியாகப் பெறவும்.',

    // Privacy
    privacy_prefs: 'தனியுரிமை & தனிப்பயனாக்கம்',
    personalization: 'தனிப்பயனாக்கப்பட்ட பரிந்துரைகள்',
    personalization_desc: 'உங்கள் சுவைக்கு ஏற்ப உணவகப் பட்டியலைத் தனிப்பயனாக்குங்கள்.',
    location_permission: 'இருப்பிட அனுமதி விருப்பம்',
    location_desc: 'நேரலை ஜி.பி.எஸ் இல்லாமல் சேமிக்கப்பட்ட பகுதிகளைப் பயன்படுத்த அனுமதிக்கவும்.',

    // Security
    security_info: 'அமர்வு & பாதுகாப்பு தகவல்',
    active_sessions: 'செயலில் உள்ள உள்நுழைவு அமர்வுகள்',
    session_notice: 'உங்கள் அமர்வு பாதுகாப்பான JWT அங்கீகாரத்துடன் பாதுகாக்கப்படுகிறது.',
    jwt_status: 'JWT டோக்கன் நிலை',
    jwt_active: 'செயலில் & சரிபார்க்கப்பட்டது',

    // About
    brand_name: 'FD — ஃபாஸ்ட் டெலிவரி',
    app_version: 'பயன்பாட்டு பதிப்பு',
    terms_of_service: 'சேவை விதிமுறைகள்',
    privacy_policy: 'தனியுரிமைக் கொள்கை',
    customer_support: 'வாடிக்கையாளர் உதவி மையம்',
    all_rights_reserved: 'அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை. FD உணவு சூழல்.',

    // Feedback
    settings_saved: 'அமைப்புகள் வெற்றிகரமாகச் சேமிக்கப்பட்டன.',
    language_changed: 'மொழி விருப்பம் புதுப்பிக்கப்பட்டது.',
    theme_changed: 'தோற்ற விருப்பம் புதுப்பிக்கப்பட்டது.',
    notifications_changed: 'அறிவிப்பு விருப்பங்கள் புதுப்பிக்கப்பட்டன.',
    save_failed: 'அமைப்புகளைச் சேமிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.',
    unsaved_changes: 'சேமிக்கப்படாத மாற்றங்கள் உள்ளன.',

    // Restaurant / Courier Specific Settings (Phase 6 preserved)
    order_alerts: 'ஆர்டர் எச்சரிக்கை ஒலி',
    order_alerts_desc: 'புதிய டெலிவரி ஆர்டர்கள் வரும்போது கேட்கக்கூடிய ஒலி எச்சரிக்கை எழுப்பவும்.',
    business_status: 'கடை இயக்க நிலை',
    business_status_desc: 'சமையலறையின் பொதுவான இயக்க நிலையை அமைக்கவும்.',
    shift_status: 'ஷிப்ட் நிலை',
    working_hours: 'வேலை நேரம்',
    start_time: 'விருப்ப தொடக்க நேரம்',
    end_time: 'விருப்ப முடிவு நேரம்',
    available_days: 'கிடைக்கும் வேலை நாட்கள்',
    break_time: 'இடைவேளை நேரம்',
    break_start: 'இடைவேளை தொடக்கம்',
    break_end: 'இடைவேளை முடிவு',
    zone_preference: 'முதன்மை மண்டல விருப்பம்',
    zone_desc: 'ஷிப்ட் தொடங்கும் போது முன்னுரிமை அளிக்கப்படும் பகுதி.',
    availability_status: 'கிடைக்கும் நிலை',

    // Namespaces
    common: {
      save: 'சேமி',
      saved: 'சேமிக்கப்பட்டது',
      saving: 'சேமிக்கப்படுகிறது...',
      save_changes: 'மாற்றங்களைச் சேமி',
      cancel: 'ரத்துசெய்',
      confirm: 'உறுதிப்படுத்து',
      close: 'மூடு',
      back: 'பின்செல்',
      next: 'அடுத்து',
      delete: 'நீக்கு',
      edit: 'திருத்து',
      search: 'தேடு',
      search_placeholder: 'உணவுகள், சமையலறைகள் அல்லது சுவைகளைத் தேடுங்கள்...',
      filter: 'வடிகட்டு',
      all: 'அனைத்தும்',
      view_all: 'அனைத்தையும் காண்க',
      refresh: 'புதுப்பி',
      retry: 'மீண்டும் முயற்சி',
      loading: 'ஏற்றப்படுகிறது...',
      success: 'வெற்றி',
      error: 'பிழை',
      warning: 'எச்சரிக்கை',
      active: 'செயலில்',
      inactive: 'செயலற்றது',
      online: 'ஆன்லைன்',
      offline: 'ஆஃப்லைன்',
      status: 'நிலை',
      actions: 'செயல்கள்',
      details: 'விவரங்கள்',
      amount: 'தொகை',
      price: 'விலை',
      total: 'மொத்தம்',
      date: 'தேதி',
      time: 'நேரம்',
      na: 'பொருந்தாது',
      copy: 'நகலெடு',
      copied: 'நகலெடுக்கப்பட்டது!',
      verified: 'சரிபார்க்கப்பட்டது (செயலில்)',
      yes: 'ஆம்',
      no: 'இல்லை',
      clear: 'அழி',
      intro: '🎬 அறிமுகம்',
      register: '✨ பதிவு',
      partner_auth: 'கூட்டாளர் உள்நுழைவு'
    },

    nav: {
      explore: 'ஆராய்வு',
      kitchens: 'சமையலறைகள்',
      offers: 'சலுகைகள்',
      cart: 'கூடை',
      orders: 'ஆர்டர்கள்',
      profile: 'சுயவிவரம்',
      settings: 'அமைப்புகள்',
      dashboard: 'டாஷ்போர்டு',
      orders_feed: 'ஆர்டர் வரிசை',
      kds: 'சமையலறை KDS',
      menu: 'மெனு பட்டியல்',
      inventory: 'சரக்கு இருப்பு',
      disputes: 'சர்ச்சைகள்',
      reviews: 'மதிப்புரைகள்',
      settlements: 'செட்டில்மென்ட்கள்',
      hud_home: 'முகப்பு',
      active_trip: 'செயலில் உள்ள பயணம்',
      earnings: 'வருவாய்',
      trip_logs: 'பயண பதிவுகள்',
      live_map: 'நேரலை வரைபடம்',
      fleet: 'டெலிவரி படை',
      customers: 'வாடிக்கையாளர்கள்',
      reports: 'அறிக்கைகள்',
      support: 'உதவி மையம்',
      security: 'பாதுகாப்பு',
      dispatch: 'டிஸ்பாட்ச் மையம்',
      logout: 'வெளியேறு',
      sign_in: 'உள்நுழை',
      sign_out: 'வெளியேறு'
    },

    auth: {
      sign_in: 'உள்நுழை',
      sign_out: 'வெளியேறு',
      login_title: 'மீண்டும் வருக',
      register_title: 'புதிய கணக்கை உருவாக்கவும்',
      partner_login: 'கூட்டாளர் உள்நுழைவு',
      email: 'மின்னஞ்சல் முகவரி',
      password: 'கடவுச்சொல்',
      full_name: 'முழு பெயர்',
      phone: 'தொலைபேசி எண்',
      remember_me: 'என்னை நினைவில் கொள்',
      forgot_password: 'கடவுச்சொல் மறந்ததா?',
      switch_to_register: 'கணக்கு இல்லையா? பதிவு செய்யவும்',
      switch_to_login: 'ஏற்கனவே கணக்கு உள்ளதா? உள்நுழையவும்',
      logout_confirm_title: 'வெளியேறலை உறுதிப்படுத்தவும்',
      logout_confirm_msg: 'நிச்சயமாக உங்கள் அமர்விலிருந்து வெளியேற விரும்புகிறீர்களா?',
      session_expired: 'அமர்வு காலாவதியானது',
      session_expired_msg: 'உங்கள் உள்நுழைவு அமர்வு காலாவதியானது. தயவுசெய்து மீண்டும் உள்நுழையவும்.'
    },

    customer: {
      delivering_to: 'டெலிவரி செய்யும் இடம்',
      change_location: '[மாற்று]',
      add_to_cart: 'கூடையில் சேர்',
      in_cart: 'கூடையில் உள்ளது',
      cart_title: 'உங்கள் உணவு கூடை',
      empty_cart: 'உங்கள் கூடை காலியாக உள்ளது',
      empty_cart_desc: 'சுவையான உணவுகளைத் தேர்ந்தெடுக்க உணவகங்களை ஆராயுங்கள்.',
      items_count: '{{count}} பொருட்கள்',
      items_count_single: '1 பொருள்',
      checkout: 'செக்அவுட் தொடர்க',
      order_now: 'இப்போதே ஆர்டர் செய்',
      delivery_address: 'டெலிவரி முகவரி',
      order_summary: 'ஆர்டர் சுருக்கம்',
      subtotal: 'உணவு துணை மொத்தம்',
      delivery_fee: 'டெலிவரி கட்டணம்',
      platform_fee: 'தள கட்டணம்',
      discount: 'தள்ளுபடி சேமிப்பு',
      total_payable: 'செலுத்த வேண்டிய மொத்த தொகை',
      payment_method: 'கட்டண முறை',
      cash_on_delivery: 'டெலிவரியில் பணம் (COD)',
      online_payment: 'உடனடி ஆன்லைன் கட்டணம்',
      place_order: 'ஆர்டரை உறுதிசெய்',
      track_order: 'ஆர்டரைக் கண்காணிக்கவும்',
      estimated_delivery: 'எதிர்பார்க்கப்படும் டெலிவரி நேரம்',
      rate_order: 'உணவு & டெலிவரியை மதிப்பிடுங்கள்',
      save_address: 'முகவரியைச் சேமி'
    },

    restaurant: {
      kitchen_portal: 'வணிகர் சமையலறை தளம்',
      store_status: 'சமையலறை நிலை',
      open_for_orders: 'ஆர்டர்கள் ஏற்கப்படுகின்றன',
      closed: 'சமையலறை மூடப்பட்டுள்ளது',
      toggle_store_status: 'நிலையை மாற்று',
      add_dish: '+ உணவு சேர்',
      active_orders_count: '{{count}} செயலில் உள்ள ஆர்டர்கள்',
      incoming: 'புதிய ஆர்டர்கள்',
      cooking: 'தயாரிப்பில் உள்ளது',
      ready: 'டெலிவரிக்கு தயார்',
      accept: 'ஆர்டரை ஏற்றுக்கொள்',
      reject: 'நிராகரி',
      mark_preparing: 'தயாரிக்கத் தொடங்கு',
      mark_ready: 'தயாராக உள்ளது என குறி',
      prep_time: 'தயாரிப்பு நேரம் (நிமிடங்கள்)',
      menu_catalog: 'மெனு பட்டியல்',
      dish_name: 'உணவின் பெயர்',
      price: 'விலை (₹)',
      category: 'வகை',
      is_available: 'இருப்பில் உள்ளது',
      sold_out: 'விற்றுத் தீர்ந்தது'
    },

    delivery: {
      rider_hud: 'கூரியர் பார்ட்னர் HUD',
      shift_status: 'பணி நிலை',
      go_online: 'ஆன்லைனுக்கு மாறு',
      go_offline: 'ஆஃப்லைனுக்கு மாறு',
      on_duty: 'பணியில் உள்ளார் (தயார்)',
      off_duty: 'பணியில் இல்லை',
      incoming_trip: 'புதிய டெலிவரி அழைப்பு',
      accept_trip: 'பயணத்தை ஏற்றுக்கொள்',
      decline_trip: 'நிராகரி',
      pickup_address: 'உணவகம் (பிக்-அப்)',
      delivery_address: 'டெலிவரி செய்யும் இடம்',
      start_trip: 'உணவகத்திற்கு செல்',
      arrived_at_store: 'உணவகத்தை அடைந்தார்',
      food_picked_up: 'உணவை எடுத்ததை உறுதிசெய்',
      out_for_delivery: 'டெலிவரிக்கு புறப்பட்டார்',
      arrived_at_customer: 'வாடிக்கையாளரிடம் அடைந்தார்',
      enter_otp: '4-இலக்க டெலிவரி OTP-ஐ உள்ளிடவும்',
      verify_otp: 'சரிபார்த்து டெலிவரியை முடி',
      delivery_completed: 'டெலிவரி வெற்றிகரமாக முடிந்தது!',
      today_earnings: 'இன்றைய வருவாய்',
      trips_completed: 'முடிந்த பயணங்கள்',
      sos_support: 'அவசர உதவி SOS'
    },

    admin: {
      mission_control: 'ஃபாஸ்ட் டெலிவரி கட்டளை மையம்',
      overview: 'தள பொதுப்பார்வை',
      total_orders: 'மொத்த ஆர்டர்கள்',
      completed_orders: 'நிறைவடைந்த ஆர்டர்கள்',
      cancelled_orders: 'ரத்து செய்யப்பட்டவை',
      gross_merchandise_value: 'மொத்த ஆர்டர் மதிப்பு',
      net_revenue: 'தள கமிஷன்',
      active_kitchens: 'செயலில் உள்ள உணவகங்கள்',
      active_riders: 'செயலில் உள்ள கூரியர்கள்',
      dispatch_queue: 'டிஸ்பாட்ச் வரிசை',
      auto_dispatch: 'தானியங்கி டிஸ்பாட்ச்',
      manual_dispatch: 'கூரியரை நேரடியாக நியமி',
      reconciliation: 'கட்டண சரிபார்ப்பு',
      system_status: 'Django REST + நேரலை தரவு செயலில்'
    },

    orders: {
      order_number: 'ஆர்டர் #{{order_number}}',
      status_placed: 'ஆர்டர் செய்யப்பட்டது',
      status_confirmed: 'உணவகம் உறுதி செய்தது',
      status_preparing: 'சமையலறையில் தயாராகிறது',
      status_ready: 'உணவு எடுக்க தயாராக உள்ளது',
      status_dispatched: 'டெலிவரிக்கு புறப்பட்டது',
      status_delivered: 'வெற்றிகரமாக டெலிவரி செய்யப்பட்டது',
      status_cancelled: 'ஆர்டர் ரத்து செய்யப்பட்டது'
    },

    status: {
      OPEN: 'திறந்துள்ளது',
      CLOSED: 'மூடப்பட்டுள்ளது',
      ONLINE: 'ஆன்லைன்',
      OFFLINE: 'ஆஃப்லைன்',
      AVAILABLE: 'கிடைக்கிறது',
      PENDING: 'நிலுவையில்',
      CONFIRMED: 'உறுதியானது',
      PREPARING: 'தயாராகிறது',
      READY: 'தயாராக உள்ளது',
      ASSIGNED: 'ஒதுக்கப்பட்டது',
      PICKED_UP: 'எடுக்கப்பட்டது',
      ON_THE_WAY: 'வழியில் உள்ளது',
      DELIVERED: 'டெலிவரி ஆனது',
      CANCELLED: 'ரத்து செய்யப்பட்டது',
      PAID: 'செலுத்தப்பட்டது',
      REFUNDED: 'திருப்பி அளிக்கப்பட்டது'
    },

    settlements: {
      settlements_management: 'உணவக கமிஷன் & செட்டில்மென்ட்கள்',
      gross_sales: 'மொத்த உணவு விற்பனை',
      commission_deducted: 'பிளாட்பார்ம் கமிஷன்',
      net_payable: 'உணவகத்திற்கு நிகர தொகை',
      settlement_status: 'செட்டில்மென்ட் நிலை',
      status_pending: 'நிலுவையில் உள்ளது',
      status_processing: 'வங்கி பரிமாற்றம் நடக்கிறது',
      status_paid: 'செலுத்தப்பட்டது',
      utr_reference: 'வங்கி UTR எண்',
      settle_now: 'செட்டில்மென்ட்டை தொடங்கு'
    },

    disputes: {
      dispute_center: 'வாடிக்கையாளர் சர்ச்சைகள் & உதவி',
      ticket_number: 'டிக்கெட் #{{number}}',
      category: 'வகை',
      priority: 'முன்னுரிமை',
      resolved: 'தீர்வு காணப்பட்டது',
      open_ticket: 'சர்ச்சை நிலுவையில்',
      file_dispute: 'புதிய சர்ச்சை பதிவு செய்'
    },

    notifications_hub: {
      notification_center: 'அறிவிப்பு மையம்',
      mark_all_read: 'அனைத்தும் படித்ததாகக் குறி',
      clear_all: 'அனைத்தையும் நீக்கு',
      no_notifications: 'அறிவிப்புகள் எதுவும் இல்லை.',
      unread: 'படிக்காதவை'
    },

    language: {
      language: 'மொழி',
      language_pref: 'மொழி விருப்பம்',
      language_desc: 'தளத்தில் பயன்படுத்தப்படும் முதன்மை மொழியைத் தேர்வுசெய்யவும்.',
      select_language: 'மொழியைத் தேர்வுசெய்க',
      english: 'English (ஆங்கிலம்)',
      tamil: 'தமிழ் (Tamil)',
      language_changed: 'மொழி விருப்பம் புதுப்பிக்கப்பட்டது.',
      instant_switch: 'உடனடி மாற்றம்'
    },

    pwa: {
      install_app: 'செயலியை நிறுவுங்கள்',
      install_title: 'Fast Delivery செயலியை நிறுவவும்',
      install_desc: 'வேகமான பயன்பாட்டிற்கும், மென்மையான உலாவலுக்கும், ஆஃப்லைன் பாதுகாப்புக்கும் முகப்புத் திரையில் சேர்க்கவும்.',
      install_btn: 'இப்போதே நிறுவவும்',
      install_ios_step1: 'Safari-யில் கீழே உள்ள Share குறியீட்டைத் தட்டவும்',
      install_ios_step2: 'மெனுவில் "Add to Home Screen" என்பதைத் தேர்ந்தெடுக்கவும்',
      install_desktop_guide: 'முகவரிப் பட்டியில் உள்ள நிறுவு குறியீட்டைக் கிளிக் செய்து நிறுவவும்.',
      installed_badge: 'நிறுவப்பட்டது (தனித்த செயலி)',
      update_title: 'புதிய புதுப்பிப்பு உள்ளது',
      update_desc: 'Fast Delivery-ன் மேம்படுத்தப்பட்ட புதிய பதிப்பு தயாராக உள்ளது.',
      update_now: 'இப்போதே புதுப்பிக்கவும்',
      later: 'பின்னர்',
      offline_badge: 'இணைப்பில்லை (Offline)',
      offline_banner_title: 'நீங்கள் ஆஃப்லைனில் உள்ளீர்கள்',
      offline_banner_desc: 'நேரடி ஆர்டர்கள், பணப் பரிவர்த்தனைகள் மற்றும் ஜிபிஎஸ் கண்காணிப்புக்கு இணைய இணைப்பு தேவை.',
      offline_delivery_warning: 'எச்சரிக்கை: நேரடி ஜிபிஎஸ் மற்றும் புதிய ஆர்டர் ஒதுக்கீடு ஆஃப்லைனில் நிறுத்தப்பட்டுள்ளன.',
      retry_connection: 'மீண்டும் முயற்சிக்கவும்',
      checking_connection: 'சர்வர் இணைப்பைச் சரிபார்க்கிறது...',
      online_restored: 'இணைய இணைப்பு மீண்டும் கிடைத்தது!'
    }
  },

  hi: {
    // Navigation / Sections
    settings: 'सेटिंग्स और प्राथमिकताएं',
    settings_subtitle: 'अपनी व्यक्तिगत खाता प्राथमिकताएं, रूप-रंग, सूचनाएं और सुरक्षा प्रबंधित करें।',
    account: 'खाता',
    appearance: 'रूप-रंग (थीम)',
    language: 'भाषा',
    notifications: 'सूचनाएं',
    privacy: 'गोपनीयता',
    security: 'सुरक्षा',
    about: 'के बारे में',
    work_preferences: 'कार्य प्राथमिकताएं',
    business_preferences: 'व्यापार प्राथमिकताएं',
    system_preferences: 'सिस्टम प्राथमिकताएं',

    // Account Section
    view_profile: 'प्रोफ़ाइल देखें',
    edit_profile: 'प्रोफ़ाइल संपादित करें',
    account_status: 'खाता स्थिति',
    verified: 'सत्यापित (सक्रिय)',
    logout: 'लॉग आउट',
    logout_confirm_title: 'लॉग आउट की पुष्टि करें',
    logout_confirm_msg: 'क्या आप वाकई अपने सत्र से लॉग आउट करना चाहते हैं?',
    cancel: 'रद्द करें',
    save_changes: 'परिवर्तन सहेजें',
    saving: 'सहेजा जा रहा है...',

    // Appearance
    theme: 'थीम मोड',
    theme_desc: 'पूरे प्लेटफ़ॉर्म के लिए अपनी पसंदीदा दृश्य शैली चुनें।',
    light: 'लाइट (Light)',
    dark: 'डार्क (Dark)',
    system: 'सिस्टम (System)',
    light_desc: 'हस्ताक्षर गर्म हाथीदांत और लक्जरी हरा थीम',
    dark_desc: 'कम रोशनी के लिए उपयुक्त गहरा थीम',
    system_desc: 'आपके डिवाइस की थीम के साथ स्वतः समन्वय',

    // Language
    language_pref: 'भाषा प्राथमिकता',
    language_desc: 'प्लेटफ़ॉर्म नियंत्रण और पाठ के लिए उपयोग की जाने वाली भाषा चुनें।',
    english: 'English (अंग्रेज़ी)',
    tamil: 'தமிழ் (तमिल)',
    hindi: 'हिन्दी (Hindi)',

    // Notifications
    notification_prefs: 'सूचना प्राथमिकताएं',
    notification_desc: 'आप तक पहुंचने के लिए संचार चैनलों को नियंत्रित करें।',
    push_notifications: 'पुश सूचनाएं',
    push_desc: 'ऑर्डर और डिलीवरी अपडेट के लिए तत्काल डिवाइस सूचनाएं प्राप्त करें।',
    email_notifications: 'ईमेल सूचनाएं',
    email_desc: 'डिजिटल रसीदें और मासिक सारांश प्राप्त करें।',
    sms_notifications: 'एसएमएस सूचनाएं',
    sms_desc: 'खाता सुरक्षा और डिस्पैच के लिए महत्वपूर्ण संदेश प्राप्त करें।',

    // Privacy
    privacy_prefs: 'गोपनीयता और वैयक्तिकरण',
    personalization: 'व्यक्तिगत अनुशंसाएं',
    personalization_desc: 'अपनी पसंद के अनुसार रेस्तरां सूची और व्यंजन अनुकूलित करें।',
    analytics_sharing: 'उपयोग विश्लेषण साझाकरण',
    analytics_desc: 'अनुभव को बेहतर बनाने के लिए उपयोग डेटा साझा करने की अनुमति दें।',

    // Security
    security_title: 'सुरक्षा और क्रेडेंशियल',
    security_desc: 'अपने खाते का पासवर्ड अपडेट करें और सक्रिय डिवाइस सत्र प्रबंधित करें।',
    change_password: 'पासवर्ड बदलें',
    current_password: 'वर्तमान पासवर्ड',
    new_password: 'नया पासवर्ड',
    confirm_new_password: 'नए पासवर्ड की पुष्टि करें',
    update_password: 'पासवर्ड अपडेट करें',
    active_sessions: 'सक्रिय सत्र',
    revoke_session: 'सत्र समाप्त करें',

    // About
    about_title: 'FD Foods के बारे में',
    app_version: 'संस्करण 2.4.0 (रॉयल ग्रीन एडिशन)',
    terms_of_service: 'सेवा की शर्तें',
    privacy_policy: 'गोपनीयता नीति',
    licenses: 'ओपन-सोर्स लाइसेंस',

    // Toast Feedback
    theme_changed: 'थीम प्राथमिकता सफलतापूर्वक अपडेट की गई।',
    language_changed: 'भाषा प्राथमिकता सफलतापूर्वक अपडेट की गई।',
    notifications_changed: 'सूचना प्राथमिकताएं सहेजी गईं।',
    settings_saved: 'प्राथमिकताएं सफलतापूर्वक सहेजी गईं।',
    save_failed: 'प्राथमिकताएं सहेजने में विफल। कृपया पुनः प्रयास करें।',

    // Nested Modules
    nav: {
      explore: 'खोजें',
      kitchens: 'रसोई',
      offers: 'ऑफ़र',
      cart: 'कार्ट',
      orders: 'ऑर्डर',
      profile: 'प्रोफ़ाइल',
      settings: 'सेटिंग्स',
      dashboard: 'डैशबोर्ड',
      orders_feed: 'ऑर्डर फ़ीड',
      kds: 'किचन KDS',
      menu: 'मेनू सूची',
      inventory: 'इन्वेंटरी',
      disputes: 'विवाद',
      reviews: 'समीक्षाएं',
      settlements: 'निपटान',
      hud_home: 'HUD होम',
      active_trip: 'सक्रिय यात्रा',
      earnings: 'कमाई',
      trip_logs: 'यात्रा लॉग',
      live_map: 'लाइव नियंत्रण नक्शा',
      fleet: 'फ्लीट प्रबंधक',
      customers: 'ग्राहक निर्देशिका',
      reports: 'विश्लेषण एवं BI',
      support: 'सहायता केंद्र',
      security: 'सुरक्षा एवं ऑडिट',
      dispatch: 'डिस्पैच केंद्र',
      logout: 'लॉग आउट',
      sign_in: 'साइन इन',
      sign_out: 'साइन आउट'
    },
    auth: {
      sign_in: 'साइन इन',
      sign_out: 'साइन आउट',
      login_title: 'वापसी पर स्वागत है',
      register_title: 'अपना खाता बनाएं',
      partner_login: 'पार्टनर प्रमाणीकरण',
      email: 'ईमेल पता',
      password: 'पासवर्ड',
      full_name: 'पूरा नाम',
      phone: 'फ़ोन नंबर',
      remember_me: 'मुझे याद रखें',
      forgot_password: 'पासवर्ड भूल गए?',
      switch_to_register: 'खाता नहीं है? साइन अप करें',
      switch_to_login: 'पहले से खाता है? साइन इन करें',
      logout_confirm_title: 'लॉग आउट की पुष्टि करें',
      logout_confirm_msg: 'क्या आप वाकई अपने सत्र से लॉग आउट करना चाहते हैं?',
      session_expired: 'सत्र समाप्त हो गया',
      session_expired_msg: 'आपका लॉगिन सत्र समाप्त हो गया है। कृपया पुनः साइन इन करें।'
    },
    customer: {
      delivering_to: 'वितरण का स्थान',
      change_location: '[बदलें]',
      add_to_cart: 'कार्ट में जोड़ें',
      in_cart: 'कार्ट में मौजूद',
      cart_title: 'आपकी भोजन टोकरी',
      empty_cart: 'आपकी कार्ट खाली है',
      empty_cart_desc: 'लोकप्रिय रेस्तरां खोजें और स्वादिष्ट व्यंजन अपनी टोकरी में जोड़ें।',
      items_count: '{{count}} वस्तुएं',
      items_count_single: '1 वस्तु',
      checkout: 'चेकआउट के लिए आगे बढ़ें',
      order_now: 'अभी ऑर्डर करें',
      delivery_address: 'डिलीवरी पता',
      order_summary: 'ऑर्डर सारांश',
      subtotal: 'भोजन उप-कुल',
      delivery_fee: 'डिलीवरी पार्टनर शुल्क',
      platform_fee: 'प्लेटफ़ॉर्म प्रसंस्करण शुल्क',
      discount: 'छूट बचत',
      total_payable: 'कुल देय राशि',
      payment_method: 'भुगतान विधि',
      cash_on_delivery: 'कैश ऑन डिलीवरी (COD)',
      online_payment: 'तत्काल ऑनलाइन भुगतान',
      place_order: 'अभी ऑर्डर दें',
      track_order: 'ऑर्डर ट्रैक करें',
      estimated_delivery: 'अनुमानित डिलीवरी समय',
      rate_order: 'भोजन और डिलीवरी का मूल्यांकन करें',
      save_address: 'पता सहेजें'
    },
    restaurant: {
      kitchen_portal: 'व्यापारी रसोई पोर्टल',
      store_status: 'रसोई स्थिति',
      open_for_orders: 'ऑर्डर के लिए खुला',
      closed: 'रसोई बंद है',
      toggle_store_status: 'स्थिति बदलें',
      add_dish: '+ नया व्यंजन जोड़ें',
      active_orders_count: '{{count}} सक्रिय किचन ऑर्डर',
      incoming: 'आने वाले ऑर्डर',
      cooking: 'रसोई में तैयारी',
      ready: 'डिस्पैच के लिए तैयार',
      accept: 'ऑर्डर स्वीकार करें',
      reject: 'अस्वीकार करें',
      mark_preparing: 'पकाना शुरू करें',
      mark_ready: 'भोजन तैयार चिह्नित करें',
      prep_time: 'तैयारी समय (मिनट)',
      menu_catalog: 'मेनू सूची',
      dish_name: 'व्यंजन का नाम',
      price: 'मूल्य (₹)',
      category: 'श्रेणी',
      is_available: 'स्टॉक में उपलब्ध',
      sold_out: 'समाप्त'
    },
    delivery: {
      rider_hud: 'डिलीवरी पार्टनर HUD',
      shift_status: 'ड्यूटी स्थिति',
      go_online: 'ऑनलाइन जाएं',
      go_offline: 'ऑफलाइन जाएं',
      on_duty: 'ड्यूटी पर (तैयार)',
      off_duty: 'ड्यूटी समाप्त',
      incoming_trip: 'आने वाला डिलीवरी अनुरोध',
      accept_trip: 'यात्रा स्वीकार करें',
      decline_trip: 'अस्वीकार करें',
      pickup_address: 'पिकअप रेस्तरां',
      delivery_address: 'ग्राहक डिलीवरी स्थान',
      start_trip: 'पिकअप की ओर जाएं',
      arrived_at_store: 'स्टोर पर पहुंच गए',
      food_picked_up: 'भोजन पिकअप की पुष्टि करें',
      out_for_delivery: 'डिलीवरी के लिए निकल गए',
      arrived_at_customer: 'ग्राहक के पते पर पहुंचे',
      enter_otp: '4-अंकीय डिलीवरी OTP दर्ज करें',
      verify_otp: 'सत्यापित करें और डिलीवरी पूर्ण करें',
      delivery_completed: 'डिलीवरी सफलतापूर्वक पूरी हुई!',
      today_earnings: 'आज की कुल कमाई',
      trips_completed: 'पूरी की गई यात्राएं',
      sos_support: 'आपातकालीन सहायता हॉटलाइन'
    },
    admin: {
      mission_control: 'FD Foods मिशन कंट्रोल',
      overview: 'पारिस्थितिकी तंत्र का अवलोकन',
      total_orders: 'कुल ऑर्डर',
      completed_orders: 'पूर्ण ऑर्डर',
      cancelled_orders: 'रद्द ऑर्डर',
      gross_merchandise_value: 'सकल व्यापार मूल्य',
      net_revenue: 'प्लेटफ़ॉर्म कमीशन',
      active_kitchens: 'सक्रिय रसोई',
      active_riders: 'सक्रिय कोरियर',
      dispatch_queue: 'डिस्पैच नियंत्रण कतार',
      auto_dispatch: 'स्वचालित डिस्पैच',
      manual_dispatch: 'मैन्युअल रूप से कोरियर असाइन करें',
      reconciliation: 'भुगतान समाधान',
      system_status: 'Django REST + टेलीमेट्री सक्रिय'
    },
    orders: {
      order_number: 'ऑर्डर #{{order_number}}',
      status_placed: 'ऑर्डर प्राप्त हुआ',
      status_confirmed: 'रसोई द्वारा स्वीकृत',
      status_preparing: 'रसोई में पक रहा है',
      status_ready: 'पिकअप के लिए भोजन तैयार',
      status_dispatched: 'डिलीवरी के लिए निकला',
      status_delivered: 'सफलतापूर्वक वितरित',
      status_cancelled: 'ऑर्डर रद्द'
    },
    status: {
      OPEN: 'खुला',
      CLOSED: 'बंद',
      ONLINE: 'ऑनलाइन',
      OFFLINE: 'ऑफलाइन',
      AVAILABLE: 'उपलब्ध',
      PENDING: 'लंबित',
      CONFIRMED: 'स्वीकृत',
      PREPARING: 'तैयारी जारी',
      READY: 'तैयार',
      ASSIGNED: 'असाइन किया गया',
      PICKED_UP: 'पिक किया गया',
      ON_THE_WAY: 'रास्ते में',
      DELIVERED: 'वितरित',
      CANCELLED: 'रद्द',
      PAID: 'भुगतान हुआ',
      REFUNDED: 'वापस किया गया'
    },
    settlements: {
      settlements_management: 'रेस्तरां कमीशन एवं निपटान',
      gross_sales: 'सकल भोजन बिक्री',
      commission_deducted: 'प्लेटफ़ॉर्म कमीशन',
      net_payable: 'स्टोर को शुद्ध भुगतान',
      settlement_status: 'निपटान स्थिति',
      status_pending: 'लंबित निपटान',
      status_processing: 'बैंक हस्तांतरण प्रगति पर',
      status_paid: 'निपटारा संपन्न',
      utr_reference: 'बैंक UTR नंबर',
      settle_now: 'बैच निपटान प्रारंभ करें'
    },
    disputes: {
      dispute_center: 'ग्राहक विवाद एवं सहायता',
      ticket_number: 'टिकट #{{number}}',
      category: 'श्रेणी',
      priority: 'प्राथमिकता',
      resolved: 'समाधान हुआ',
      open_ticket: 'खुला विवाद',
      file_dispute: 'नया विवाद दर्ज करें'
    },
    notifications_hub: {
      notification_center: 'सूचना केंद्र',
      mark_all_read: 'सभी को पढ़ा हुआ चिह्नित करें',
      clear_all: 'सभी हटाएं',
      no_notifications: 'कोई नई सूचना नहीं मिली।',
      unread: 'अपठित'
    },
    pwa: {
      install_app: 'ऐप इंस्टॉल करें',
      install_title: 'FD Foods इंस्टॉल करें',
      install_desc: 'सुपर-फास्ट ऑर्डर, सुगम नेविगेशन और ऑफ़लाइन संचालन के लिए होम स्क्रीन पर जोड़ें।',
      install_btn: 'अभी इंस्टॉल करें',
      install_ios_step1: 'Safari में शेयर आइकन पर टैप करें (निचला बार)',
      install_ios_step2: 'मेनू से "Add to Home Screen" चुनें',
      install_desktop_guide: 'इस ऐप को इंस्टॉल करने के लिए अपने ब्राउज़र के एड्रेस बार में इंस्टॉल आइकन पर क्लिक करें।',
      installed_badge: 'इंस्टॉल किया गया (स्टैंडअलोन)',
      update_title: 'अपडेट उपलब्ध है',
      update_desc: 'नए सुधारों के साथ FD Foods का एक नया संस्करण उपलब्ध है।',
      update_now: 'अभी अपडेट करें',
      later: 'बाद में',
      offline_badge: 'ऑफ़लाइन मोड',
      offline_banner_title: 'आप वर्तमान में ऑफ़लाइन काम कर रहे हैं',
      offline_banner_desc: 'लाइव ऑर्डर, भुगतान, जीपीएस ट्रैकिंग और सर्वर संचालन के लिए सक्रिय नेटवर्क आवश्यक है।',
      offline_delivery_warning: 'सावधानी: ऑफ़लाइन होने पर लाइव जीपीएस और नए डिस्पैच रोक दिए जाते हैं।',
      retry_connection: 'पुनः कनेक्ट करें',
      checking_connection: 'सर्वर से कनेक्ट हो रहा है...',
      online_restored: 'नेटवर्क कनेक्शन बहाल हुआ!'
    }
  }
};

/**
 * Universal translation resolver with dot-notation, English fallback, and param interpolation.
 */
export const getTranslation = (lang, key, params = {}) => {
  const currentLang = (lang === 'ta' || lang === 'Tamil') ? 'ta' : (lang === 'hi' || lang === 'Hindi') ? 'hi' : 'en';

  // 1. Direct flat lookup in target language
  let val = TRANSLATIONS[currentLang]?.[key];

  // 2. Nested dot-notation in target language
  if (val === undefined && typeof key === 'string' && key.includes('.')) {
    val = key.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), TRANSLATIONS[currentLang]);
  }

  // 3. Fallback to English flat lookup
  if (val === undefined) {
    val = TRANSLATIONS['en']?.[key];
  }

  // 4. Fallback to English nested dot-notation
  if (val === undefined && typeof key === 'string' && key.includes('.')) {
    val = key.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), TRANSLATIONS['en']);
  }

  // 5. Ultimate fallback: humanize last segment
  if (val === undefined) {
    if (typeof key === 'string') {
      const last = key.split('.').pop();
      val = last.replace(/_/g, ' ');
    } else {
      val = key;
    }
  }

  // 6. Parameter interpolation
  if (typeof val === 'string' && params && typeof params === 'object') {
    Object.keys(params).forEach((paramKey) => {
      const paramVal = params[paramKey];
      const doubleRegex = new RegExp(`\\{\\{\\s*${paramKey}\\s*\\}\\}`, 'g');
      const singleRegex = new RegExp(`\\{${paramKey}\\}`, 'g');
      val = val.replace(doubleRegex, paramVal).replace(singleRegex, paramVal);
    });
  }

  return val;
};

/**
 * Direct shortcut translation using active localStorage language.
 */
export const t = (key, params = {}) => {
  const active = typeof window !== 'undefined' ? (localStorage.getItem('fd_language') || 'en') : 'en';
  return getTranslation(active, key, params);
};

/**
 * Apply theme to document and persist in storage.
 */
export const applyTheme = (theme) => {
  const root = document.documentElement;
  let resolvedTheme = theme;
  if (theme === 'system') {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    resolvedTheme = prefersDark ? 'dark' : 'light';
  }
  root.setAttribute('data-theme', resolvedTheme);
  if (resolvedTheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  localStorage.setItem('fd_theme', theme);
  return resolvedTheme;
};

/**
 * Apply language immediately: updates DOM lang attribute, persists to localStorage,
 * and notifies all listeners via custom event without full page reload.
 */
export const applyLanguage = (lang) => {
  const normalized = (lang === 'ta' || lang === 'Tamil') ? 'ta' : (lang === 'hi' || lang === 'Hindi') ? 'hi' : 'en';
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('lang', normalized);
    document.documentElement.setAttribute('data-lang', normalized);
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('fd_language', normalized);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('fd_language_changed', { detail: normalized }));
  }
  return normalized;
};

/**
 * Currency formatter preserving INR symbol and Indian numbering format.
 */
export const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Locale-aware date formatter.
 */
export const formatDate = (date, lang = null) => {
  if (!date) return '';
  const current = lang || (typeof localStorage !== 'undefined' ? localStorage.getItem('fd_language') : 'en') || 'en';
  const locale = (current === 'ta' || current === 'Tamil') ? 'ta-IN' : (current === 'hi' || current === 'Hindi') ? 'hi-IN' : 'en-IN';
  try {
    const d = new Date(date);
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  } catch {
    return String(date);
  }
};

/**
 * Reactive React hook for accessing translations and language mutator.
 */
export const useTranslation = () => {
  const [currentLang, setCurrentLang] = useState(() => {
    return (typeof localStorage !== 'undefined' ? localStorage.getItem('fd_language') : 'en') || 'en';
  });

  useEffect(() => {
    const handleLangChange = (event) => {
      const next = event.detail || (typeof localStorage !== 'undefined' ? localStorage.getItem('fd_language') : 'en') || 'en';
      setCurrentLang(next);
    };
    window.addEventListener('fd_language_changed', handleLangChange);
    return () => window.removeEventListener('fd_language_changed', handleLangChange);
  }, []);

  const translate = useCallback((key, params) => {
    return getTranslation(currentLang, key, params);
  }, [currentLang]);

  const setLanguage = useCallback((lang) => {
    const normalized = applyLanguage(lang);
    setCurrentLang(normalized);
    return normalized;
  }, []);

  return {
    t: translate,
    language: currentLang,
    currentLang,
    setLanguage,
    isTamil: currentLang === 'ta',
    isHindi: currentLang === 'hi',
    isEnglish: currentLang === 'en'
  };
};

export default {
  TRANSLATIONS,
  getTranslation,
  t,
  applyTheme,
  applyLanguage,
  formatCurrency,
  formatDate,
  useTranslation
};
