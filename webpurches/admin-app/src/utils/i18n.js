import React, { useState, useEffect, useCallback } from 'react';

export const TRANSLATIONS = {
  en: {
    // Navigation / Sections (Phase 6 preserved)
    settings: 'Settings & Ecosystem Governance',
    settings_subtitle: 'Manage root administrator profile, system policies, notifications, and security.',
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
    verified: 'Root Administrator (Active)',
    logout: 'Logout',
    logout_confirm_title: 'Confirm Logout',
    logout_confirm_msg: 'Are you sure you want to exit platform command center?',
    cancel: 'Cancel',
    save_changes: 'Save Changes',
    saving: 'Saving...',

    // Appearance
    theme: 'Theme Mode',
    theme_desc: 'Select display theme for command center dashboards.',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    light_desc: 'Clean daytime executive light luxury theme',
    dark_desc: 'Command console high-density dark theme',
    system_desc: 'Follows system device theme automatically',

    // Language
    language_pref: 'Language Preference',
    language_desc: 'Select operational language for administrative controls.',
    english: 'English',
    tamil: 'தமிழ் (Tamil)',
    hindi: 'हिन्दी (Hindi)',

    // Notifications
    notification_prefs: 'Notification Preferences',
    notification_desc: 'Configure platform incident and telemetry alert triggers.',
    push_notifications: 'Push Notifications',
    push_desc: 'Immediate browser alerts for platform health warnings.',
    email_notifications: 'Email Notifications',
    email_desc: 'Receive audit reports and administrative incident logs.',
    sms_notifications: 'SMS Notifications',
    sms_desc: 'Emergency security hotline dispatch alerts.',

    // Privacy
    privacy_prefs: 'Privacy & Governance',
    personalization: 'Command Center Insights Personalization',
    personalization_desc: 'Tailor platform operational views and quick metrics.',
    location_permission: 'Operations Geofence Preference',
    location_desc: 'Use default server geofence coordinates for telemetry overview.',

    // Security
    security_info: 'Session & Security Information',
    active_sessions: 'Active Command Sessions',
    session_notice: 'Command console access authenticated with encrypted JWT tokens.',
    jwt_status: 'JWT Token Status',
    jwt_active: 'Active & Verified',

    // About
    brand_name: 'FD — Fast Delivery',
    app_version: 'Platform Command Console v2.4.0',
    terms_of_service: 'Platform Operational Terms',
    privacy_policy: 'Privacy Policy',
    customer_support: 'Engineering Operations Desk',
    all_rights_reserved: 'All rights reserved. Fast Delivery Platform Infrastructure.',

    // Feedback
    settings_saved: 'Settings saved successfully.',
    language_changed: 'Language preference updated.',
    theme_changed: 'Theme preference updated.',
    notifications_changed: 'Notification preferences updated.',
    save_failed: 'Settings could not be saved. Please try again.',
    unsaved_changes: 'You have unsaved changes.',

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
      search_placeholder: 'Search system metrics, kitchens, or telemetry...',
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
      dashboard: 'Dashboard',
      live_map: 'Live Control Map',
      kitchens: 'Kitchens',
      fleet: 'Fleet Manager',
      orders: 'Orders Feed',
      settlements: 'Settlements',
      customers: 'Customers',
      revenue: 'Revenue & Finance',
      reports: 'Analytics & BI',
      support: 'Support Center',
      security: 'Security & Audits',
      dispatch: 'Dispatch Center',
      reviews: 'Reviews Moderation',
      offers: 'Offers & Loyalty',
      settings: 'Platform Settings',
      logout: 'Logout',
      sign_in: 'Sign In',
      sign_out: 'Sign Out'
    },

    auth: {
      sign_in: '🛡️ Sign In',
      sign_out: 'Sign Out',
      login_title: 'Admin Command Console',
      register_title: 'Admin Provisioning',
      email: 'Administrator Email',
      password: 'Root Key / Password',
      remember_me: 'Remember Session',
      forgot_password: 'Reset Access Key',
      logout_confirm_title: 'Confirm Logout',
      logout_confirm_msg: 'Are you sure you want to exit platform command center?',
      session_expired: 'Session Expired',
      session_expired_msg: 'Administrative session has expired. Re-authentication required.'
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
      system_status: 'Django REST + Telemetry Active',
      telemetry_active: 'Django REST + Telemetry Active'
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
      dispute_center: 'Platform Dispute Center',
      ticket_number: 'Ticket #{{number}}',
      category: 'Category',
      priority: 'Priority',
      resolved: 'Resolved',
      open_ticket: 'Open Dispute',
      file_dispute: 'File Incident Ticket'
    },

    notifications_hub: {
      notification_center: 'Mission Control Notifications',
      mark_all_read: 'Mark All Read',
      clear_all: 'Clear All',
      no_notifications: 'No notifications found.',
      unread: 'Unread'
    },

    language: {
      language: 'Language',
      language_pref: 'Language Preference',
      language_desc: 'Select operational language for administrative controls.',
      select_language: 'Select Language',
      english: 'English',
      tamil: 'தமிழ் (Tamil)',
      hindi: 'हिन्दी (Hindi)',
      language_changed: 'Language preference updated.',
      instant_switch: 'Instant Switch'
    },

    pwa: {
      install_app: 'Install App',
      install_title: 'Install Mission Control App',
      install_desc: 'Add to home screen for dedicated platform supervision, fast telemetry, and offline resilience.',
      install_btn: 'Install Now',
      install_ios_step1: 'Tap the Share icon in Safari (bottom bar)',
      install_ios_step2: 'Select "Add to Home Screen" from the menu',
      install_desktop_guide: 'Click the install icon in your browser address bar to install this app.',
      installed_badge: 'Installed (Standalone)',
      update_title: 'Update Available',
      update_desc: 'A new version of Fast Delivery Admin is available.',
      update_now: 'Update Now',
      later: 'Later',
      offline_badge: 'Admin Offline',
      offline_banner_title: 'Mission Control Disconnected',
      offline_banner_desc: 'Administrative actions, audit trails, and financial reconciliation require an active connection.',
      offline_delivery_warning: 'Server-authoritative commands are paused while offline.',
      retry_connection: 'Reconnect Telemetry',
      checking_connection: 'Connecting to server...',
      online_restored: 'Mission Control connected!'
    }
  },

  ta: {
    // Navigation / Sections (Phase 6 preserved)
    settings: 'அமைப்புகள் & நிர்வாகம்',
    settings_subtitle: 'நிர்வாக சுயவிவரம், அமைப்பு விதிகள், அறிவிப்புகள் மற்றும் பாதுகாப்பை நிர்வகிக்கவும்.',
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
    verified: 'முதன்மை நிர்வாகி (செயலில்)',
    logout: 'வெளியேறு',
    logout_confirm_title: 'வெளியேறலை உறுதிப்படுத்தவும்',
    logout_confirm_msg: 'நிச்சயமாக கட்டுப்பாட்டு மையத்திலிருந்து வெளியேற விரும்புகிறீர்களா?',
    cancel: 'ரத்துசெய்',
    save_changes: 'மாற்றங்களைச் சேமி',
    saving: 'சேமிக்கப்படுகிறது...',

    // Appearance
    theme: 'தோற்ற முறை',
    theme_desc: 'கட்டுப்பாட்டு மையத்திற்கான காட்சியைத் தேர்ந்தெடுக்கவும்.',
    light: 'ஒளி (Light)',
    dark: 'இருள் (Dark)',
    system: 'சாதனம் (System)',
    light_desc: 'பகல் நேர ஆடம்பர ஒளி தீம்',
    dark_desc: 'கட்டுப்பாட்டு மைய இருண்ட தீம்',
    system_desc: 'உங்கள் சாதன அமைப்புகளுடன் தானாகப் பொருந்தும்',

    // Language
    language_pref: 'மொழி விருப்பம்',
    language_desc: 'நிர்வாகக் கட்டுப்பாடுகளுக்கான மொழியைத் தேர்வுசெய்யவும்.',
    english: 'English (ஆங்கிலம்)',
    tamil: 'தமிழ் (Tamil)',
    hindi: 'हिन्दी (இந்தி)',

    // Notifications
    notification_prefs: 'அறிவிப்பு விருப்பங்கள்',
    notification_desc: 'தள எச்சரிக்கைகள் மற்றும் நிகழ்வு அறிவிப்புகளை அமைக்கவும்.',
    push_notifications: 'புஷ் அறிவிப்புகள்',
    push_desc: 'தள பாதுகாப்பு எச்சரிக்கைகளுக்கான உடனடி அறிவிப்புகள்.',
    email_notifications: 'மின்னஞ்சல் அறிவிப்புகள்',
    email_desc: 'தணிக்கை அறிக்கைகள் மற்றும் முக்கிய குறிப்புகளைப் பெறவும்.',
    sms_notifications: 'எஸ்.எம்.எஸ் அறிவிப்புகள்',
    sms_desc: 'அவசர பாதுகாப்பு குறுஞ்செய்திகளைப் பெறவும்.',

    // Privacy
    privacy_prefs: 'தனியுரிமை & நிர்வாகம்',
    personalization: 'கட்டுப்பாட்டுத் தனிப்பயனாக்கம்',
    personalization_desc: 'முக்கிய அளவீடுகளைத் தனிப்பயனாக்க அனுமதிக்கவும்.',
    location_permission: 'இருப்பிட விருப்பம்',
    location_desc: 'இயல்புநிலை சேவையக ஆயத்தொலைவுகளைப் பயன்படுத்தவும்.',

    // Security
    security_info: 'அமர்வு & பாதுகாப்பு தகவல்',
    active_sessions: 'செயலில் உள்ள நிர்வாக அமர்வுகள்',
    session_notice: 'உங்கள் அணுகல் பாதுகாப்பான JWT டோக்கன்களுடன் பாதுகாக்கப்படுகிறது.',
    jwt_status: 'JWT டோக்கன் நிலை',
    jwt_active: 'செயலில் & சரிபார்க்கப்பட்டது',

    // About
    brand_name: 'FD — ஃபாஸ்ட் டெலிவரி',
    app_version: 'தள கட்டளை மையம் v2.4.0',
    terms_of_service: 'தள இயக்க விதிமுறைகள்',
    privacy_policy: 'தனியுரிமைக் கொள்கை',
    customer_support: 'பொறியியல் உதவி மையம்',
    all_rights_reserved: 'அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை. FD உள்கட்டமைப்பு.',

    // Feedback
    settings_saved: 'அமைப்புகள் வெற்றிகரமாகச் சேமிக்கப்பட்டன.',
    language_changed: 'மொழி விருப்பம் புதுப்பிக்கப்பட்டது.',
    theme_changed: 'தோற்ற விருப்பம் புதுப்பிக்கப்பட்டது.',
    notifications_changed: 'அறிவிப்பு விருப்பங்கள் புதுப்பிக்கப்பட்டன.',
    save_failed: 'அமைப்புகளைச் சேமிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.',
    unsaved_changes: 'சேமிக்கப்படாத மாற்றங்கள் உள்ளன.',

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
      search_placeholder: 'அளவீடுகள், உணவகங்கள் அல்லது தொலை அளவியலைத் தேடுங்கள்...',
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
      dashboard: 'டாஷ்போர்டு',
      live_map: 'நேரலை வரைபடம்',
      kitchens: 'உணவகங்கள்',
      fleet: 'டெலிவரி படை',
      orders: 'ஆர்டர்கள்',
      settlements: 'செட்டில்மென்ட்கள்',
      customers: 'வாடிக்கையாளர்கள்',
      revenue: 'வருவாய் & நிதி',
      reports: 'அறிக்கைகள்',
      support: 'உதவி மையம்',
      security: 'பாதுகாப்பு & தணிக்கை',
      dispatch: 'டிஸ்பாட்ச் மையம்',
      reviews: 'மதிப்புரை மேலாண்மை',
      offers: 'சலுகைகள் & விசுவாசம்',
      settings: 'தள அமைப்புகள்',
      logout: 'வெளியேறு',
      sign_in: 'உள்நுழை',
      sign_out: 'வெளியேறு'
    },

    auth: {
      sign_in: '🛡️ உள்நுழை',
      sign_out: 'வெளியேறு',
      login_title: 'கட்டளை மையம் உள்நுழைவு',
      register_title: 'நிர்வாக கணக்கு உருவாக்கம்',
      email: 'நிர்வாக மின்னஞ்சல்',
      password: 'கடவுச்சொல்',
      remember_me: 'அமர்வை நினைவில் கொள்',
      forgot_password: 'கடவுச்சொல்லை மீட்டமைக்க',
      logout_confirm_title: 'வெளியேறலை உறுதிப்படுத்தவும்',
      logout_confirm_msg: 'நிச்சயமாக கட்டுப்பாட்டு மையத்திலிருந்து வெளியேற விரும்புகிறீர்களா?',
      session_expired: 'அமர்வு காலாவதியானது',
      session_expired_msg: 'நிர்வாக அமர்வு காலாவதியானது. மீண்டும் உள்நுழையவும்.'
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
      system_status: 'Django REST + நேரலை தரவு செயலில்',
      telemetry_active: 'Django REST + நேரலை தரவு செயலில்'
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
      dispute_center: 'தள சர்ச்சை தீர்வு மையம்',
      ticket_number: 'டிக்கெட் #{{number}}',
      category: 'வகை',
      priority: 'முன்னுரிமை',
      resolved: 'தீர்வு காணப்பட்டது',
      open_ticket: 'சர்ச்சை நிலுவையில்',
      file_dispute: 'புதிய சர்ச்சை பதிவு செய்'
    },

    notifications_hub: {
      notification_center: 'கட்டளை மைய அறிவிப்புகள்',
      mark_all_read: 'அனைத்தும் படித்ததாகக் குறி',
      clear_all: 'அனைத்தையும் நீக்கு',
      no_notifications: 'அறிவிப்புகள் எதுவும் இல்லை.',
      unread: 'படிக்காதவை'
    },

    language: {
      language: 'மொழி',
      language_pref: 'மொழி விருப்பம்',
      language_desc: 'நிர்வாகக் கட்டுப்பாடுகளுக்கான மொழியைத் தேர்வுசெய்யவும்.',
      select_language: 'மொழியைத் தேர்வுசெய்க',
      english: 'English (ஆங்கிலம்)',
      tamil: 'தமிழ் (Tamil)',
      hindi: 'हिन्दी (இந்தி)',
      language_changed: 'மொழி விருப்பம் புதுப்பிக்கப்பட்டது.',
      instant_switch: 'உடனடி மாற்றம்'
    },

    pwa: {
      install_app: 'செயலியை நிறுவுங்கள்',
      install_title: 'கட்டளை மையத்தை நிறுவவும்',
      install_desc: 'முழுமையான இயங்குதள மேற்பார்வை மற்றும் வேகமான தொலைநிலை நிர்வாகத்திற்கு முகப்புத் திரையில் சேர்க்கவும்.',
      install_btn: 'இப்போதே நிறுவவும்',
      install_ios_step1: 'Safari-யில் கீழே உள்ள Share குறியீட்டைத் தட்டவும்',
      install_ios_step2: 'மெனுவில் "Add to Home Screen" என்பதைத் தேர்ந்தெடுக்கவும்',
      install_desktop_guide: 'முகவரிப் பட்டியில் உள்ள நிறுவு குறியீட்டைக் கிளிக் செய்து நிறுவவும்.',
      installed_badge: 'நிறுவப்பட்டது (தனித்த செயலி)',
      update_title: 'புதிய புதுப்பிப்பு உள்ளது',
      update_desc: 'நிர்வாக மையத்தின் புதிய பதிப்பு தயாராக உள்ளது.',
      update_now: 'இப்போதே புதுப்பிக்கவும்',
      later: 'பின்னர்',
      offline_badge: 'நிர்வாக மையம் ஆஃப்லைனில் உள்ளது',
      offline_banner_title: 'கட்டளை மைய இணைப்பு துண்டிக்கப்பட்டது',
      offline_banner_desc: 'நிர்வாக நடவடிக்கைகள், தணிக்கை பதிவுகள் மற்றும் நிதித் தீர்வுகளுக்கு இணைய இணைப்பு தேவை.',
      offline_delivery_warning: 'சர்வர் கட்டளைகள் ஆஃப்லைனில் செயல்படுத்தப்படாது.',
      retry_connection: 'இணைப்பை மீண்டும் இணைக்கவும்',
      checking_connection: 'சர்வர் இணைப்பைச் சரிபார்க்கிறது...',
      online_restored: 'கட்டளை மையம் மீண்டும் இணைக்கப்பட்டது!'
    }
  },

  hi: {
    // Navigation / Sections
    settings: 'सेटिंग्स और प्राथमिकताएं',
    settings_subtitle: 'प्लेटफ़ॉर्म टेलीमेट्री, ऑडिट नीतियां, सिस्टम अपीयरेंस और क्रेडेंशियल प्रबंधित करें।',
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
    verified: 'सुपर व्यवस्थापक',
    logout: 'लॉग आउट',
    logout_confirm_title: 'लॉग आउट की पुष्टि करें',
    logout_confirm_msg: 'क्या आप वाकई मिशन कंट्रोल से लॉग आउट करना चाहते हैं?',
    cancel: 'रद्द करें',
    save_changes: 'परिवर्तन सहेजें',
    saving: 'सहेजा जा रहा है...',

    // Appearance
    theme: 'थीम मोड',
    theme_desc: 'कंट्रोल कंसोल के लिए उपयुक्त थीम चुनें।',
    light: 'लाइट (Light)',
    dark: 'डार्क (Dark)',
    system: 'सिस्टम (System)',
    light_desc: 'पारंपरिक गर्म हाथीदांत और लक्जरी हरा थीम',
    dark_desc: 'उच्च कंट्रास्ट वाला डार्क कंसोल थीम',
    system_desc: 'डिवाइस ऑपरेटिंग सिस्टम की थीम के अनुसार',

    // Language
    language_pref: 'भाषा प्राथमिकता',
    language_desc: 'प्रशासनिक नियंत्रणों के लिए परिचालन भाषा चुनें।',
    english: 'English (अंग्रेज़ी)',
    tamil: 'தமிழ் (तमिल)',
    hindi: 'हिन्दी (Hindi)',

    // Notifications
    notification_prefs: 'सूचना प्राथमिकताएं',
    notification_desc: 'प्लेटफ़ॉर्म अलर्ट और सुरक्षा घटनाओं की सूचनाएं सेट करें।',
    push_notifications: 'सिस्टम स्वास्थ्य अलर्ट',
    push_desc: 'सर्वर प्रदर्शन और उच्च-त्रुटि स्पाइक्स पर तुरंत अलर्ट प्राप्त करें।',
    email_notifications: 'दैनिक ऑडिट डाइजेस्ट',
    email_desc: 'वित्तीय मिलान और सुरक्षा सारांश ईमेल पर प्राप्त करें।',
    sms_notifications: 'सुरक्षा उल्लंघन एसएमएस',
    sms_desc: 'असामान्य लॉगिन या संदिग्ध गतिविधियों पर तुरंत संदेश प्राप्त करें।',

    // Privacy
    privacy_prefs: 'गोपनीयता और डेटा अनुपालन',
    personalization: 'टेलीमेट्री डेटा प्रतिधारण',
    personalization_desc: 'नियामक आवश्यकताओं के अनुसार ऑडिट लॉग सुरक्षित रखें।',
    location_permission: 'फ्लीट जीपीएस ट्रैकिंग',
    location_desc: 'रीयल-टाइम जीपीएस डिस्पैच और गतिशीलता नक्शे की निगरानी करें।',

    // Security
    security_info: 'सुरक्षा और क्रेडेंशियल',
    active_sessions: 'सक्रिय व्यवस्थापक सत्र',
    session_notice: 'सुरक्षा के लिए व्यवस्थापक सत्र स्वतः समाप्त हो जाते हैं।',
    jwt_status: 'प्रमाणीकरण स्थिति',
    jwt_active: 'सुरक्षित JWT टोकन सक्रिय',

    // About
    brand_name: 'FD Foods • मिशन कंट्रोल',
    app_version: 'संस्करण 2.4.0 (रॉयल ग्रीन एडिशन)',
    terms_of_service: 'प्लेटफ़ॉर्म संचालन की शर्तें',
    privacy_policy: 'डेटा गवर्नेंस नीति',
    customer_support: 'आंतरिक इंजीनियरिंग ऑन-कॉल',
    all_rights_reserved: 'सर्वाधिकार सुरक्षित।',

    // Feedback
    settings_saved: 'कंसोल प्राथमिकताएं सफलतापूर्वक सहेजी गईं।',
    language_changed: 'भाषा प्राथमिकता अपडेट की गई।',
    theme_changed: 'थीम प्राथमिकता अपडेट की गई।',
    notifications_changed: 'सूचना प्राथमिकताएं अपडेट की गईं।',
    save_failed: 'प्राथमिकताएं सहेजने में विफल। कृपया पुनः प्रयास करें।',
    unsaved_changes: 'बिना सहेजे परिवर्तन शेष हैं।',

    common: {
      select_language: 'भाषा चुनें',
      english: 'English (अंग्रेज़ी)',
      tamil: 'தமிழ் (तमिल)',
      hindi: 'हिन्दी (Hindi)',
      language_changed: 'भाषा प्राथमिकता अपडेट की गई।',
      instant_switch: 'तत्काल परिवर्तन'
    },
    nav: {
      dashboard: 'डैशबोर्ड',
      orders: 'ऑर्डर',
      users: 'उपयोगकर्ता',
      restaurants: 'रेस्तरां',
      delivery: 'डिलीवरी फ्लीट',
      reports: 'रिपोर्ट',
      settlements: 'निपटान',
      disputes: 'विवाद',
      settings: 'सेटिंग्स',
      account: 'खाता',
      logout: 'लॉग आउट'
    },
    auth: {
      sign_in: 'साइन इन',
      sign_out: 'साइन आउट',
      login_title: 'मिशन कंट्रोल लॉगिन',
      session_expired: 'सत्र समाप्त',
      session_expired_msg: 'आपका व्यवस्थापक सत्र समाप्त हो गया है। कृपया पुनः साइन इन करें।'
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
      status_confirmed: 'स्वीकृत',
      status_preparing: 'तैयारी जारी',
      status_ready: 'पिकअप के लिए तैयार',
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
      install_title: 'FD Foods मिशन कंट्रोल इंस्टॉल करें',
      install_desc: 'पूर्ण पारिस्थितिकी तंत्र की निगरानी और तेज़ प्रबंधन के लिए होम स्क्रीन पर जोड़ें।',
      install_btn: 'अभी इंस्टॉल करें',
      install_ios_step1: 'Safari में शेयर आइकन पर टैप करें (निचला बार)',
      install_ios_step2: 'मेनू से "Add to Home Screen" चुनें',
      install_desktop_guide: 'इस ऐप को इंस्टॉल करने के लिए अपने ब्राउज़र के एड्रेस बार में इंस्टॉल आइकन पर क्लिक करें।',
      installed_badge: 'इंस्टॉल किया गया (स्टैंडअलोन)',
      update_title: 'अपडेट उपलब्ध है',
      update_desc: 'मिशन कंट्रोल का एक नया संस्करण उपलब्ध है।',
      update_now: 'अभी अपडेट करें',
      later: 'बाद में',
      offline_badge: 'मिशन कंट्रोल ऑफ़लाइन है',
      offline_banner_title: 'कमांड सेंटर कनेक्शन टूटा',
      offline_banner_desc: 'प्रशासनिक कार्यों और वित्तीय मिलान के लिए इंटरनेट आवश्यक है।',
      offline_delivery_warning: 'सर्वर कमांड ऑफ़लाइन में नहीं चलेंगे।',
      retry_connection: 'पुनः कनेक्ट करें',
      checking_connection: 'सर्वर से कनेक्ट हो रहा है...',
      online_restored: 'कमांड सेंटर पुनः कनेक्ट हुआ!'
    }
  }
};

export const getTranslation = (lang, key, params = {}) => {
  const currentLang = (lang === 'ta' || lang === 'Tamil') ? 'ta' : (lang === 'hi' || lang === 'Hindi') ? 'hi' : 'en';

  let val = TRANSLATIONS[currentLang]?.[key];

  if (val === undefined && typeof key === 'string' && key.includes('.')) {
    val = key.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), TRANSLATIONS[currentLang]);
  }

  if (val === undefined) {
    val = TRANSLATIONS['en']?.[key];
  }

  if (val === undefined && typeof key === 'string' && key.includes('.')) {
    val = key.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), TRANSLATIONS['en']);
  }

  if (val === undefined) {
    if (typeof key === 'string') {
      const last = key.split('.').pop();
      val = last.replace(/_/g, ' ');
    } else {
      val = key;
    }
  }

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

export const t = (key, params = {}) => {
  const active = typeof window !== 'undefined' ? (localStorage.getItem('fd_language') || 'en') : 'en';
  return getTranslation(active, key, params);
};

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

export const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

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
