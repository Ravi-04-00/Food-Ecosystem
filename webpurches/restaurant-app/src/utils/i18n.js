import React, { useState, useEffect, useCallback } from 'react';

export const TRANSLATIONS = {
  en: {
    // Navigation / Sections (Phase 6 preserved)
    settings: 'Settings & Preferences',
    settings_subtitle: 'Manage your restaurant operations, notification preferences, appearance, and credentials.',
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
    verified: 'Verified Merchant',
    logout: 'Logout',
    logout_confirm_title: 'Confirm Logout',
    logout_confirm_msg: 'Are you sure you want to log out of your merchant portal?',
    cancel: 'Cancel',
    save_changes: 'Save Changes',
    saving: 'Saving...',

    // Appearance
    theme: 'Theme Mode',
    theme_desc: 'Select your preferred visual style across the merchant dashboard.',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    light_desc: 'Signature warm ivory and premium emerald luxury theme',
    dark_desc: 'OLED-optimized dark surface with high contrast accents',
    system_desc: 'Automatically matches your device operating system theme',

    // Language
    language_pref: 'Language Preference',
    language_desc: 'Choose the language used for dashboard controls and orders.',
    english: 'English',
    tamil: 'தமிழ் (Tamil)',
    hindi: 'हिन्दी (Hindi)',

    // Notifications
    notification_prefs: 'Notification Preferences',
    notification_desc: 'Control order alert sound and communication channels.',
    push_notifications: 'Push Notifications',
    push_desc: 'Receive immediate alerts when new customer orders are placed.',
    email_notifications: 'Email Notifications',
    email_desc: 'Receive daily sales settlements and weekly merchant statements.',
    sms_notifications: 'SMS Notifications',
    sms_desc: 'Receive critical payout notices and account security alerts.',

    // Business
    order_alerts: 'Order Chime & Alerts',
    order_alerts_desc: 'Play audible chimes when high-priority delivery orders arrive.',
    business_status: 'Store Status Preference',
    business_status_desc: 'Set standard kitchen operating status across the ecosystem.',

    // Privacy
    privacy_prefs: 'Privacy & Operations',
    personalization: 'Merchant Insights Personalization',
    personalization_desc: 'Allow analytics engines to generate menu optimization tips.',
    location_permission: 'Kitchen Location Preference',
    location_desc: 'Use registered commercial kitchen address for dispatch calculation.',

    // Security
    security_info: 'Session & Security Information',
    active_sessions: 'Active Merchant Sessions',
    session_notice: 'Your merchant portal is secured with encrypted JWT tokens.',
    jwt_status: 'JWT Token Status',
    jwt_active: 'Active & Verified',

    // About
    brand_name: 'FD — Fast Delivery',
    app_version: 'Merchant Application Version',
    terms_of_service: 'Merchant Terms of Service',
    privacy_policy: 'Privacy Policy',
    customer_support: 'Merchant Partner Support Desk',
    all_rights_reserved: 'All rights reserved. Fast Delivery Ecosystem.',

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
      search_placeholder: 'Search orders, menu items, or categories...',
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
      orders_feed: 'Orders Feed',
      kds: 'Kitchen KDS',
      menu: 'Menu Catalog',
      inventory: 'Inventory',
      disputes: 'Disputes',
      reviews: 'Reviews',
      settlements: 'Settlements',
      settings: 'Settings',
      logout: 'Logout',
      sign_in: 'Sign In',
      sign_out: 'Sign Out'
    },

    auth: {
      sign_in: 'Partner Auth',
      sign_out: 'Sign Out',
      login_title: 'Merchant Portal Login',
      register_title: 'Register Kitchen Account',
      partner_login: 'Partner Auth',
      email: 'Merchant Email Address',
      password: 'Password',
      full_name: 'Store Contact Person',
      phone: 'Phone Number',
      remember_me: 'Remember Me',
      forgot_password: 'Forgot Password?',
      switch_to_register: "Need a kitchen account? Register",
      switch_to_login: 'Already registered? Sign in',
      logout_confirm_title: 'Confirm Logout',
      logout_confirm_msg: 'Are you sure you want to log out of your merchant portal?',
      session_expired: 'Session Expired',
      session_expired_msg: 'Your merchant session has expired. Please sign in again.'
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
      dispute_center: 'Restaurant Dispute Resolution',
      ticket_number: 'Ticket #{{number}}',
      category: 'Category',
      priority: 'Priority',
      resolved: 'Resolved',
      open_ticket: 'Open Dispute',
      file_dispute: 'File New Dispute'
    },

    notifications_hub: {
      notification_center: 'Kitchen Notification Center',
      mark_all_read: 'Mark All Read',
      clear_all: 'Clear All',
      no_notifications: 'No notifications found.',
      unread: 'Unread'
    },

    language: {
      language: 'Language',
      language_pref: 'Language Preference',
      language_desc: 'Choose the language used for dashboard controls and orders.',
      select_language: 'Select Language',
      english: 'English',
      tamil: 'தமிழ் (Tamil)',
      hindi: 'हिन्दी (Hindi)',
      language_changed: 'Language preference updated.',
      instant_switch: 'Instant Switch'
    },

    pwa: {
      install_app: 'Install App',
      install_title: 'Install Restaurant Hub',
      install_desc: 'Add to home screen for rapid kitchen management, real-time order alerts, and offline resilience.',
      install_btn: 'Install Now',
      install_ios_step1: 'Tap the Share icon in Safari (bottom bar)',
      install_ios_step2: 'Select "Add to Home Screen" from the menu',
      install_desktop_guide: 'Click the install icon in your browser address bar to install this app.',
      installed_badge: 'Installed (Standalone)',
      update_title: 'Update Available',
      update_desc: 'A new version of Fast Delivery Partner is available.',
      update_now: 'Update Now',
      later: 'Later',
      offline_badge: 'Kitchen Offline',
      offline_banner_title: 'Kitchen Hub is currently offline',
      offline_banner_desc: 'Real-time order receipts, kitchen status toggles, and settlements require an active connection.',
      offline_delivery_warning: 'Order updates and status changes cannot be processed offline.',
      retry_connection: 'Reconnect Hub',
      checking_connection: 'Connecting to server...',
      online_restored: 'Kitchen Hub connected!'
    }
  },

  ta: {
    // Navigation / Sections (Phase 6 preserved)
    settings: 'அமைப்புகள் & விருப்பங்கள்',
    settings_subtitle: 'உங்கள் உணவக செயல்பாடுகள், அறிவிப்பு விருப்பங்கள் மற்றும் பாதுகாப்பை நிர்வகிக்கவும்.',
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
    verified: 'சரிபார்க்கப்பட்ட வணிகர்',
    logout: 'வெளியேறு',
    logout_confirm_title: 'வெளியேறலை உறுதிப்படுத்தவும்',
    logout_confirm_msg: 'நிச்சயமாக உங்கள் வணிகர் தளத்திலிருந்து வெளியேற விரும்புகிறீர்களா?',
    cancel: 'ரத்துசெய்',
    save_changes: 'மாற்றங்களைச் சேமி',
    saving: 'சேமிக்கப்படுகிறது...',

    // Appearance
    theme: 'தோற்ற முறை',
    theme_desc: 'வணிகர் பலகைக்கான உங்கள் விருப்ப தோற்றத்தைத் தேர்ந்தெடுக்கவும்.',
    light: 'ஒளி (Light)',
    dark: 'இருள் (Dark)',
    system: 'சாதனம் (System)',
    light_desc: 'உணவகங்களுக்கான ஆடம்பர ஒளி தீம்',
    dark_desc: 'இரவு நேர செயல்பாடுகளுக்கான உயர்தர இருண்ட தீம்',
    system_desc: 'உங்கள் சாதன அமைப்புகளுடன் தானாகப் பொருந்தும்',

    // Language
    language_pref: 'மொழி விருப்பம்',
    language_desc: 'தளத்தில் பயன்படுத்தப்படும் முதன்மை மொழியைத் தேர்வுசெய்யவும்.',
    english: 'English (ஆங்கிலம்)',
    tamil: 'தமிழ் (Tamil)',
    hindi: 'हिन्दी (இந்தி)',

    // Notifications
    notification_prefs: 'அறிவிப்பு விருப்பங்கள்',
    notification_desc: 'புதிய ஆர்டர் எச்சரிக்கை ஒலி மற்றும் தகவல்தொடர்புகளைத் தீர்மானிக்கவும்.',
    push_notifications: 'புஷ் அறிவிப்புகள்',
    push_desc: 'புதிய ஆர்டர்கள் வரும்போது உடனடி எச்சரிக்கைகளைப் பெறவும்.',
    email_notifications: 'மின்னஞ்சல் அறிவிப்புகள்',
    email_desc: 'தினசரி விற்பனை விவரங்கள் மற்றும் அறிக்கைகளைப் பெறவும்.',
    sms_notifications: 'எஸ்.எம்.எஸ் அறிவிப்புகள்',
    sms_desc: 'முக்கிய கட்டண அறிவிப்புகளை குறுஞ்செய்தியாகப் பெறவும்.',

    // Business
    order_alerts: 'ஆர்டர் எச்சரிக்கை ஒலி',
    order_alerts_desc: 'புதிய டெலிவரி ஆர்டர்கள் வரும்போது கேட்கக்கூடிய ஒலி எச்சரிக்கை எழுப்பவும்.',
    business_status: 'கடை இயக்க நிலை',
    business_status_desc: 'சமையலறையின் பொதுவான இயக்க நிலையை அமைக்கவும்.',

    // Privacy
    privacy_prefs: 'தனியுரிமை & செயல்பாடுகள்',
    personalization: 'வணிகப் பரிந்துரை தனிப்பயனாக்கம்',
    personalization_desc: 'மெனு மேம்பாட்டு ஆலோசனைகளைப் பெற அனுமதிக்கவும்.',
    location_permission: 'சமையலறை இருப்பிட விருப்பம்',
    location_desc: 'பதிவுசெய்யப்பட்ட முகவரியைப் பயன்படுத்த அனுமதிக்கவும்.',

    // Security
    security_info: 'அமர்வு & பாதுகாப்பு தகவல்',
    active_sessions: 'செயலில் உள்ள வணிகர் அமர்வுகள்',
    session_notice: 'உங்கள் தளம் பாதுகாப்பான JWT டோக்கன்களுடன் பாதுகாக்கப்படுகிறது.',
    jwt_status: 'JWT டோக்கன் நிலை',
    jwt_active: 'செயலில் & சரிபார்க்கப்பட்டது',

    // About
    brand_name: 'FD — ஃபாஸ்ட் டெலிவரி',
    app_version: 'வணிகர் பயன்பாட்டு பதிப்பு',
    terms_of_service: 'வணிகர் சேவை விதிமுறைகள்',
    privacy_policy: 'தனியுரிமைக் கொள்கை',
    customer_support: 'வணிகர் உதவி மையம்',
    all_rights_reserved: 'அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை. FD உணவு சூழல்.',

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
      search_placeholder: 'ஆர்டர்கள், மெனு உருப்படிகள் அல்லது வகைகளைத் தேடுங்கள்...',
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
      orders_feed: 'ஆர்டர் வரிசை',
      kds: 'சமையலறை KDS',
      menu: 'மெனு பட்டியல்',
      inventory: 'சரக்கு இருப்பு',
      disputes: 'சர்ச்சைகள்',
      reviews: 'மதிப்புரைகள்',
      settlements: 'செட்டில்மென்ட்கள்',
      settings: 'அமைப்புகள்',
      logout: 'வெளியேறு',
      sign_in: 'உள்நுழை',
      sign_out: 'வெளியேறு'
    },

    auth: {
      sign_in: 'கூட்டாளர் உள்நுழைவு',
      sign_out: 'வெளியேறு',
      login_title: 'வணிகர் தளம் உள்நுழைவு',
      register_title: 'புதிய சமையலறை கணக்கை உருவாக்கவும்',
      partner_login: 'கூட்டாளர் உள்நுழைவு',
      email: 'வணிகர் மின்னஞ்சல் முகவரி',
      password: 'கடவுச்சொல்',
      full_name: 'தொடர்பு நபர் பெயர்',
      phone: 'தொலைபேசி எண்',
      remember_me: 'என்னை நினைவில் கொள்',
      forgot_password: 'கடவுச்சொல் மறந்ததா?',
      switch_to_register: 'சமையலறை கணக்கு தேவையா? பதிவு செய்க',
      switch_to_login: 'ஏற்கனவே பதிவு செய்யப்பட்டவரா? உள்நுழையவும்',
      logout_confirm_title: 'வெளியேறலை உறுதிப்படுத்தவும்',
      logout_confirm_msg: 'நிச்சயமாக உங்கள் வணிகர் தளத்திலிருந்து வெளியேற விரும்புகிறீர்களா?',
      session_expired: 'அமர்வு காலாவதியானது',
      session_expired_msg: 'உங்கள் வணிகர் அமர்வு காலாவதியானது. தயவுசெய்து மீண்டும் உள்நுழையவும்.'
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
      dispute_center: 'உணவக சர்ச்சை தீர்வு மையம்',
      ticket_number: 'டிக்கெட் #{{number}}',
      category: 'வகை',
      priority: 'முன்னுரிமை',
      resolved: 'தீர்வு காணப்பட்டது',
      open_ticket: 'சர்ச்சை நிலுவையில்',
      file_dispute: 'புதிய சர்ச்சை பதிவு செய்'
    },

    notifications_hub: {
      notification_center: 'சமையலறை அறிவிப்பு மையம்',
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
      hindi: 'हिन्दी (இந்தி)',
      language_changed: 'மொழி விருப்பம் புதுப்பிக்கப்பட்டது.',
      instant_switch: 'உடனடி மாற்றம்'
    },

    pwa: {
      install_app: 'செயலியை நிறுவுங்கள்',
      install_title: 'வணிகர் மையத்தை நிறுவவும்',
      install_desc: 'வேகமான சமையலறை மேலாண்மை மற்றும் நிகழ்நேர ஆர்டர் விழிப்பூட்டல்களுக்கு முகப்புத் திரையில் சேர்க்கவும்.',
      install_btn: 'இப்போதே நிறுவவும்',
      install_ios_step1: 'Safari-யில் கீழே உள்ள Share குறியீட்டைத் தட்டவும்',
      install_ios_step2: 'மெனுவில் "Add to Home Screen" என்பதைத் தேர்ந்தெடுக்கவும்',
      install_desktop_guide: 'முகவரிப் பட்டியில் உள்ள நிறுவு குறியீட்டைக் கிளிக் செய்து நிறுவவும்.',
      installed_badge: 'நிறுவப்பட்டது (தனித்த செயலி)',
      update_title: 'புதிய புதுப்பிப்பு உள்ளது',
      update_desc: 'வணிகர் தளத்தின் மேம்படுத்தப்பட்ட புதிய பதிப்பு தயாராக உள்ளது.',
      update_now: 'இப்போதே புதுப்பிக்கவும்',
      later: 'பின்னர்',
      offline_badge: 'சமையலறை ஆஃப்லைனில் உள்ளது',
      offline_banner_title: 'சமையலறை மையம் தற்போது ஆஃப்லைனில் உள்ளது',
      offline_banner_desc: 'நேரடி ஆர்டர் ரசீதுகள் மற்றும் நிலவர மாற்றங்களுக்கு இணைய இணைப்பு தேவை.',
      offline_delivery_warning: 'ஆர்டர் நிலவர மாற்றங்கள் ஆஃப்லைனில் செயல்படுத்தப்படாது.',
      retry_connection: 'மீண்டும் இணைக்கவும்',
      checking_connection: 'சர்வர் இணைப்பைச் சரிபார்க்கிறது...',
      online_restored: 'சமையலறை மையம் மீண்டும் இணைக்கப்பட்டது!'
    }
  },

  hi: {
    // Navigation / Sections
    settings: 'सेटिंग्स और प्राथमिकताएं',
    settings_subtitle: 'अपने रेस्तरां संचालन, सूचना प्राथमिकताएं, रूप-रंग और क्रेडेंशियल प्रबंधित करें।',
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
    verified: 'सत्यापित व्यापारी',
    logout: 'लॉग आउट',
    logout_confirm_title: 'लॉग आउट की पुष्टि करें',
    logout_confirm_msg: 'क्या आप वाकई अपने व्यापारी पोर्टल से लॉग आउट करना चाहते हैं?',
    cancel: 'रद्द करें',
    save_changes: 'परिवर्तन सहेजें',
    saving: 'सहेजा जा रहा है...',

    // Appearance
    theme: 'थीम मोड',
    theme_desc: 'डैशबोर्ड के लिए अपनी पसंदीदा दृश्य शैली चुनें।',
    light: 'लाइट (Light)',
    dark: 'डार्क (Dark)',
    system: 'सिस्टम (System)',
    light_desc: 'पारंपरिक गर्म हाथीदांत और लक्जरी हरा थीम',
    dark_desc: 'कम रोशनी के लिए उपयुक्त गहरा थीम',
    system_desc: 'डिवाइस ऑपरेटिंग सिस्टम की थीम के अनुसार',

    // Language
    language_pref: 'भाषा प्राथमिकता',
    language_desc: 'डैशबोर्ड नियंत्रण और ऑर्डर के लिए उपयोग की जाने वाली भाषा चुनें।',
    english: 'English (अंग्रेज़ी)',
    tamil: 'தமிழ் (तमिल)',
    hindi: 'हिन्दी (Hindi)',

    // Notifications
    notification_prefs: 'सूचना प्राथमिकताएं',
    notification_desc: 'ऑर्डर अलर्ट ध्वनि और संचार चैनलों को नियंत्रित करें।',
    push_notifications: 'पुश सूचनाएं',
    push_desc: 'नए ग्राहक ऑर्डर आने पर तुरंत अलर्ट प्राप्त करें।',
    email_notifications: 'ईमेल सूचनाएं',
    email_desc: 'दैनिक बिक्री विवरण और साप्ताहिक विवरण प्राप्त करें।',
    sms_notifications: 'एसएमएस सूचनाएं',
    sms_desc: 'महत्वपूर्ण भुगतान और सुरक्षा सूचनाएं प्राप्त करें।',

    // Business
    order_alerts: 'ऑर्डर चेतावनी और घंटी',
    order_alerts_desc: 'प्राथमिकता वाले डिलीवरी ऑर्डर आने पर ऑडियो रिंग बजाएं।',
    business_status: 'स्टोर स्थिति प्राथमिकता',
    business_status_desc: 'डैशबोर्ड लोड होने पर स्टोर की स्थिति डिफ़ॉल्ट रूप से ऑनलाइन रखें।',

    // Privacy
    privacy_prefs: 'गोपनीयता और डेटा साझाकरण',
    personalization: 'परिचालन विश्लेषण',
    personalization_desc: 'सेवा की गुणवत्ता में सुधार के लिए गुमनाम तैयारी समय का विश्लेषण करें।',
    location_permission: 'किचन जीपीएस स्थान',
    location_desc: 'सटीक ग्राहक डिलीवरी दूरी गणना के लिए स्टोर स्थान सक्षम करें।',

    // Security
    security_info: 'खाता सुरक्षा और सत्र',
    active_sessions: 'सक्रिय सत्र',
    session_notice: 'सुरक्षा के लिए 7 दिनों की निष्क्रियता के बाद सत्र स्वतः समाप्त हो जाते हैं।',
    jwt_status: 'प्रमाणीकरण स्थिति',
    jwt_active: 'सुरक्षित JWT टोकन सक्रिय',

    // About
    brand_name: 'FD Foods • मर्चेंट हब',
    app_version: 'संस्करण 2.4.0 (रॉयल ग्रीन एडिशन)',
    terms_of_service: 'व्यापारी सेवा की शर्तें',
    privacy_policy: 'गोपनीयता नीति',
    customer_support: 'पार्टनर सहायता हेल्पलाइन',
    all_rights_reserved: 'सर्वाधिकार सुरक्षित।',

    // Toast Feedback
    settings_saved: 'व्यापारी प्राथमिकताएं सफलतापूर्वक सहेजी गईं।',
    language_changed: 'भाषा प्राथमिकता अपडेट की गई।',
    theme_changed: 'थीम प्राथमिकता अपडेट की गई।',
    notifications_changed: 'सूचना प्राथमिकताएं अपडेट की गईं।',
    save_failed: 'प्राथमिकताएं सहेजने में विफल। कृपया पुनः प्रयास करें।',
    unsaved_changes: 'आपके पास बिना सहेजे परिवर्तन हैं।',

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
      menu: 'मेनू सूची',
      inventory: 'इन्वेंटरी',
      kds: 'किचन KDS',
      disputes: 'विवाद',
      reviews: 'समीक्षाएं',
      settlements: 'निपटान',
      settings: 'सेटिंग्स',
      account: 'खाता',
      logout: 'लॉग आउट'
    },
    auth: {
      sign_in: 'साइन इन',
      sign_out: 'साइन आउट',
      login_title: 'व्यापारी लॉगिन',
      session_expired: 'सत्र समाप्त',
      session_expired_msg: 'आपका लॉगिन सत्र समाप्त हो गया है। कृपया पुनः साइन इन करें।'
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
      install_title: 'FD Foods मर्चेंट हब इंस्टॉल करें',
      install_desc: 'त्वरित रसोई नियंत्रण, ऑडियो अलर्ट और ऑफ़लाइन संचालन के लिए होम स्क्रीन पर जोड़ें।',
      install_btn: 'अभी इंस्टॉल करें',
      install_ios_step1: 'Safari में शेयर आइकन पर टैप करें (निचला बार)',
      install_ios_step2: 'मेनू से "Add to Home Screen" चुनें',
      install_desktop_guide: 'इस ऐप को इंस्टॉल करने के लिए अपने ब्राउज़र के एड्रेस बार में इंस्टॉल आइकन पर क्लिक करें।',
      installed_badge: 'इंस्टॉल किया गया (स्टैंडअलोन)',
      update_title: 'अपडेट उपलब्ध है',
      update_desc: 'व्यापारी पोर्टल का एक नया संस्करण उपलब्ध है।',
      update_now: 'अभी अपडेट करें',
      later: 'बाद में',
      offline_badge: 'रसोई ऑफ़लाइन है',
      offline_banner_title: 'रसोई केंद्र वर्तमान में ऑफ़लाइन है',
      offline_banner_desc: 'लाइव ऑर्डर प्राप्त करने के लिए सक्रिय नेटवर्क आवश्यक है।',
      offline_delivery_warning: 'ऑर्डर स्थिति अपडेट ऑफ़लाइन में नहीं होंगे।',
      retry_connection: 'पुनः कनेक्ट करें',
      checking_connection: 'सर्वर से कनेक्ट हो रहा है...',
      online_restored: 'रसोई केंद्र पुनः कनेक्ट हुआ!'
    }
  }
};

/**
 * Universal translation resolver with dot-notation, English fallback, and param interpolation.
 */
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
