import React, { useState, useEffect, useCallback } from 'react';

export const TRANSLATIONS = {
  en: {
    // Navigation / Sections (Phase 6 preserved)
    settings: 'Settings & Preferences',
    settings_subtitle: 'Manage courier shifts, working hours, break schedules, zones, and security.',
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
    verified: 'Verified Professional Courier',
    logout: 'Logout',
    logout_confirm_title: 'Confirm Logout',
    logout_confirm_msg: 'Are you sure you want to log out of the courier app?',
    cancel: 'Cancel',
    save_changes: 'Save Changes',
    saving: 'Saving...',

    // Appearance
    theme: 'Theme Mode',
    theme_desc: 'Select display theme optimized for daytime sunlight or night riding.',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    light_desc: 'High-contrast sunlight readable luxury light theme',
    dark_desc: 'OLED battery-saving dark mode for night dispatches',
    system_desc: 'Automatically matches your mobile device OS mode',

    // Language
    language_pref: 'Language Preference',
    language_desc: 'Select the operational language for shifts and notifications.',
    english: 'English',
    tamil: 'தமிழ் (Tamil)',
    hindi: 'हिन्दी (Hindi)',

    // Notifications
    notification_prefs: 'Notification Preferences',
    notification_desc: 'Configure alert chimes for incoming pickup requests.',
    push_notifications: 'Push Notifications',
    push_desc: 'Immediate vibration and sound alerts for allocated batch trips.',
    sms_notifications: 'SMS Notifications',
    sms_desc: 'Receive emergency fleet notices and payout SMS alerts.',

    // Work Preferences
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

    // Privacy
    privacy_prefs: 'Privacy & Telemetry',
    personalization: 'Dispatch Route Personalization',
    personalization_desc: 'Allow AI route assistant to tailor shortcuts to your preferred streets.',
    location_permission: 'Location Permission Preference',
    location_desc: 'Allow app to record depot and commercial zone coverage preferences.',

    // Security
    security_info: 'Session & Security Information',
    active_sessions: 'Active Courier Sessions',
    session_notice: 'Courier telemetry secured with cryptographic JWT authentication.',
    jwt_status: 'JWT Token Status',
    jwt_active: 'Active & Verified',

    // About
    brand_name: 'FD — Fast Delivery',
    app_version: 'Courier Partner App v2.4.0',
    terms_of_service: 'Courier Partner Agreement',
    privacy_policy: 'Privacy Policy',
    customer_support: 'Courier Hotline & SOS Support',
    all_rights_reserved: 'All rights reserved. Fast Delivery Fleet Systems.',

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
      search_placeholder: 'Search delivery tasks, zones, or addresses...',
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
      hud_home: 'HUD Home',
      active_trip: 'Active Trip',
      earnings: 'Earnings',
      trip_logs: 'Trip Logs',
      settings: 'Settings',
      logout: 'Logout',
      sign_in: 'Sign In',
      sign_out: 'Sign Out'
    },

    auth: {
      sign_in: 'Partner Auth',
      sign_out: 'Sign Out',
      login_title: 'Courier Partner Login',
      register_title: 'Register Courier Account',
      partner_login: 'Partner Auth',
      email: 'Courier Email Address',
      password: 'Password',
      full_name: 'Courier Full Name',
      phone: 'Phone Number',
      remember_me: 'Remember Me',
      forgot_password: 'Forgot Password?',
      switch_to_register: "Need a courier account? Register",
      switch_to_login: 'Already registered? Sign in',
      logout_confirm_title: 'Confirm Logout',
      logout_confirm_msg: 'Are you sure you want to log out of the courier app?',
      session_expired: 'Session Expired',
      session_expired_msg: 'Your courier session has expired. Please sign in again.'
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

    notifications_hub: {
      notification_center: 'Courier Notification Center',
      mark_all_read: 'Mark All Read',
      clear_all: 'Clear All',
      no_notifications: 'No notifications found.',
      unread: 'Unread'
    },

    language: {
      language: 'Language',
      language_pref: 'Language Preference',
      language_desc: 'Select the operational language for shifts and notifications.',
      select_language: 'Select Language',
      english: 'English',
      tamil: 'தமிழ் (Tamil)',
      hindi: 'हिन्दी (Hindi)',
      language_changed: 'Language preference updated.',
      instant_switch: 'Instant Switch'
    },

    pwa: {
      install_app: 'Install App',
      install_title: 'Install Courier Fleet App',
      install_desc: 'Add to home screen for real-time dispatch alerts, turn-by-turn route tracking, and offline resilience.',
      install_btn: 'Install Now',
      install_ios_step1: 'Tap the Share icon in Safari (bottom bar)',
      install_ios_step2: 'Select "Add to Home Screen" from the menu',
      install_desktop_guide: 'Click the install icon in your browser address bar to install this app.',
      installed_badge: 'Installed (Standalone)',
      update_title: 'Update Available',
      update_desc: 'A new version of Fast Delivery Driver is available.',
      update_now: 'Update Now',
      later: 'Later',
      offline_badge: 'Driver Offline',
      offline_banner_title: 'Fleet Connection Lost',
      offline_banner_desc: 'Active shifts, route navigation, and delivery completions require an active connection.',
      offline_delivery_warning: 'Caution: Live GPS location sharing and dispatch requests are paused while offline.',
      retry_connection: 'Reconnect GPS & Network',
      checking_connection: 'Connecting to server...',
      online_restored: 'Fleet connection restored!'
    }
  },

  ta: {
    // Navigation / Sections (Phase 6 preserved)
    settings: 'அமைப்புகள் & விருப்பங்கள்',
    settings_subtitle: 'டெலிவரி ஷிப்ட், வேலை நேரம், இடைவேளை, மண்டலங்கள் மற்றும் பாதுகாப்பை நிர்வகிக்கவும்.',
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
    verified: 'சரிபார்க்கப்பட்ட தொழில்முறை கூரியர்',
    logout: 'வெளியேறு',
    logout_confirm_title: 'வெளியேறலை உறுதிப்படுத்தவும்',
    logout_confirm_msg: 'நிச்சயமாக கூரியர் பயன்பாட்டிலிருந்து வெளியேற விரும்புகிறீர்களா?',
    cancel: 'ரத்துசெய்',
    save_changes: 'மாற்றங்களைச் சேமி',
    saving: 'சேமிக்கப்படுகிறது...',

    // Appearance
    theme: 'தோற்ற முறை',
    theme_desc: 'பகல் வெயில் அல்லது இரவு பயணத்திற்கு உகந்த காட்சியைத் தேர்ந்தெடுக்கவும்.',
    light: 'ஒளி (Light)',
    dark: 'இருள் (Dark)',
    system: 'சாதனம் (System)',
    light_desc: 'பகல் நேர வெளிச்சத்திற்கு ஏற்ற ஒளி தீம்',
    dark_desc: 'இரவு சவாரி மற்றும் பேட்டரி சேமிப்பு இருண்ட தீம்',
    system_desc: 'உங்கள் கைபேசி அமைப்புகளுடன் தானாகப் பொருந்தும்',

    // Language
    language_pref: 'மொழி விருப்பம்',
    language_desc: 'ஷிப்ட் மற்றும் அறிவிப்புகளுக்கான மொழியைத் தேர்வுசெய்யவும்.',
    english: 'English (ஆங்கிலம்)',
    tamil: 'தமிழ் (Tamil)',
    hindi: 'हिन्दी (இந்தி)',

    // Notifications
    notification_prefs: 'அறிவிப்பு விருப்பங்கள்',
    notification_desc: 'புதிய டெலிவரி அழைப்புகளுக்கான எச்சரிக்கைகளை அமைக்கவும்.',
    push_notifications: 'புஷ் அறிவிப்புகள்',
    push_desc: 'ஒதுக்கப்பட்ட ஆர்டர்களுக்கான உடனடி அதிர்வு மற்றும் ஒலி எச்சரிக்கைகள்.',
    sms_notifications: 'எஸ்.எம்.எஸ் அறிவிப்புகள்',
    sms_desc: 'முக்கிய அறிவிப்புகள் மற்றும் கட்டண குறுஞ்செய்திகளைப் பெறவும்.',

    // Work Preferences
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

    // Privacy
    privacy_prefs: 'தனியுரிமை & இருப்பிடம்',
    personalization: 'பாதை தனிப்பயனாக்கம்',
    personalization_desc: 'விருப்ப குறுக்குவழிகளுக்கு ஏற்ப பாதையைத் தனிப்பயனாக்க அனுமதிக்கவும்.',
    location_permission: 'இருப்பிட அனுமதி விருப்பம்',
    location_desc: 'சேமிக்கப்பட்ட பணி மண்டலங்களை அனுமதிக்கவும்.',

    // Security
    security_info: 'அமர்வு & பாதுகாப்பு தகவல்',
    active_sessions: 'செயலில் உள்ள கூரியர் அமர்வுகள்',
    session_notice: 'உங்கள் அமர்வு பாதுகாப்பான JWT டோக்கன்களுடன் பாதுகாக்கப்படுகிறது.',
    jwt_status: 'JWT டோக்கன் நிலை',
    jwt_active: 'செயலில் & சரிபார்க்கப்பட்டது',

    // About
    brand_name: 'FD — ஃபாஸ்ட் டெலிவரி',
    app_version: 'கூரியர் பயன்பாட்டு பதிப்பு v2.4.0',
    terms_of_service: 'கூரியர் கூட்டாளர் ஒப்பந்தம்',
    privacy_policy: 'தனியுரிமைக் கொள்கை',
    customer_support: 'கூரியர் அவசர உதவி மையம் & SOS',
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
      search_placeholder: 'டெலிவரி பணிகள், மண்டலங்கள் அல்லது முகவரிகளைத் தேடுங்கள்...',
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
      hud_home: 'முகப்பு',
      active_trip: 'செயலில் உள்ள பயணம்',
      earnings: 'வருவாய்',
      trip_logs: 'பயண பதிவுகள்',
      settings: 'அமைப்புகள்',
      logout: 'வெளியேறு',
      sign_in: 'உள்நுழை',
      sign_out: 'வெளியேறு'
    },

    auth: {
      sign_in: 'கூட்டாளர் உள்நுழைவு',
      sign_out: 'வெளியேறு',
      login_title: 'கூரியர் கூட்டாளர் உள்நுழைவு',
      register_title: 'புதிய கூரியர் கணக்கை உருவாக்கவும்',
      partner_login: 'கூட்டாளர் உள்நுழைவு',
      email: 'கூரியர் மின்னஞ்சல் முகவரி',
      password: 'கடவுச்சொல்',
      full_name: 'கூரியர் முழு பெயர்',
      phone: 'தொலைபேசி எண்',
      remember_me: 'என்னை நினைவில் கொள்',
      forgot_password: 'கடவுச்சொல் மறந்ததா?',
      switch_to_register: 'கூரியர் கணக்கு தேவையா? பதிவு செய்க',
      switch_to_login: 'ஏற்கனவே பதிவு செய்யப்பட்டவரா? உள்நுழையவும்',
      logout_confirm_title: 'வெளியேறலை உறுதிப்படுத்தவும்',
      logout_confirm_msg: 'நிச்சயமாக கூரியர் பயன்பாட்டிலிருந்து வெளியேற விரும்புகிறீர்களா?',
      session_expired: 'அமர்வு காலாவதியானது',
      session_expired_msg: 'உங்கள் கூரியர் அமர்வு காலாவதியானது. தயவுசெய்து மீண்டும் உள்நுழையவும்.'
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

    notifications_hub: {
      notification_center: 'கூரியர் அறிவிப்பு மையம்',
      mark_all_read: 'அனைத்தும் படித்ததாகக் குறி',
      clear_all: 'அனைத்தையும் நீக்கு',
      no_notifications: 'அறிவிப்புகள் எதுவும் இல்லை.',
      unread: 'படிக்காதவை'
    },

    language: {
      language: 'மொழி',
      language_pref: 'மொழி விருப்பம்',
      language_desc: 'ஷிப்ட் மற்றும் அறிவிப்புகளுக்கான மொழியைத் தேர்வுசெய்யவும்.',
      select_language: 'மொழியைத் தேர்வுசெய்க',
      english: 'English (ஆங்கிலம்)',
      tamil: 'தமிழ் (Tamil)',
      hindi: 'हिन्दी (இந்தி)',
      language_changed: 'மொழி விருப்பம் புதுப்பிக்கப்பட்டது.',
      instant_switch: 'உடனடி மாற்றம்'
    },

    pwa: {
      install_app: 'செயலியை நிறுவுங்கள்',
      install_title: 'கூரியர் செயலியை நிறுவவும்',
      install_desc: 'நிகழ்நேர டெலிவரி விழிப்பூட்டல்கள் மற்றும் ஆஃப்லைன் பாதுகாப்புக்கு முகப்புத் திரையில் சேர்க்கவும்.',
      install_btn: 'இப்போதே நிறுவவும்',
      install_ios_step1: 'Safari-யில் கீழே உள்ள Share குறியீட்டைத் தட்டவும்',
      install_ios_step2: 'மெனுவில் "Add to Home Screen" என்பதைத் தேர்ந்தெடுக்கவும்',
      install_desktop_guide: 'முகவரிப் பட்டியில் உள்ள நிறுவு குறியீட்டைக் கிளிக் செய்து நிறுவவும்.',
      installed_badge: 'நிறுவப்பட்டது (தனித்த செயலி)',
      update_title: 'புதிய புதுப்பிப்பு உள்ளது',
      update_desc: 'கூரியர் பயன்பாட்டின் புதிய பதிப்பு தயாராக உள்ளது.',
      update_now: 'இப்போதே புதுப்பிக்கவும்',
      later: 'பின்னர்',
      offline_badge: 'ஓட்டுநர் ஆஃப்லைனில் உள்ளார்',
      offline_banner_title: 'கூரியர் இணைப்பு துண்டிக்கப்பட்டது',
      offline_banner_desc: 'செயலில் உள்ள ஷிப்ட்கள், வழிசெலுத்தல் மற்றும் டெலிவரி முடிவிற்கு இணைய இணைப்பு தேவை.',
      offline_delivery_warning: 'எச்சரிக்கை: நேரடி ஜிபிஎஸ் மற்றும் புதிய ஆர்டர் ஒதுக்கீடுகள் ஆஃப்லைனில் நிறுத்தப்பட்டுள்ளன.',
      retry_connection: 'ஜிபிஎஸ் மற்றும் இணைப்பை மீண்டும் இணைக்கவும்',
      checking_connection: 'சர்வர் இணைப்பைச் சரிபார்க்கிறது...',
      online_restored: 'கூரியர் இணைப்பு மீண்டும் கிடைத்தது!'
    }
  },

  hi: {
    // Navigation / Sections
    settings: 'सेटिंग्स और प्राथमिकताएं',
    settings_subtitle: 'अपनी शिफ्ट प्राथमिकताएं, वाहन विवरण, अधिसूचनाएं और नेविगेशन प्रबंधित करें।',
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
    verified: 'सत्यापित राइडर',
    logout: 'लॉग आउट',
    logout_confirm_title: 'लॉग आउट की पुष्टि करें',
    logout_confirm_msg: 'क्या आप वाकई अपने राइडर पोर्टल से लॉग आउट करना चाहते हैं?',
    cancel: 'रद्द करें',
    save_changes: 'परिवर्तन सहेजें',
    saving: 'सहेजा जा रहा है...',

    // Appearance
    theme: 'थीम मोड',
    theme_desc: 'दिन की धूप या रात की सवारी के लिए अनुकूलित थीम चुनें।',
    light: 'लाइट (Light)',
    dark: 'डार्क (Dark)',
    system: 'सिस्टम (System)',
    light_desc: 'धूप में स्पष्ट दिखने वाला लक्जरी लाइट थीम',
    dark_desc: 'रात की सवारी के लिए बैटरी बचाने वाला गहरा थीम',
    system_desc: 'डिवाइस ऑपरेटिंग सिस्टम की थीम के अनुसार',

    // Language
    language_pref: 'भाषा प्राथमिकता',
    language_desc: 'शिफ्ट और सूचनाओं के लिए परिचालन भाषा चुनें।',
    english: 'English (अंग्रेज़ी)',
    tamil: 'தமிழ் (तमिल)',
    hindi: 'हिन्दी (Hindi)',

    // Notifications
    notification_prefs: 'सूचना प्राथमिकताएं',
    notification_desc: 'नए डिलीवरी अनुरोधों के लिए अलर्ट प्राथमिकताएं सेट करें।',
    push_notifications: 'पुश सूचनाएं',
    push_desc: 'आस-पास नए ऑर्डर आने पर तत्काल ध्वनि और कंपन अलर्ट प्राप्त करें।',
    sms_notifications: 'एसएमएस सूचनाएं',
    sms_desc: 'दैनिक कमाई और सुरक्षा चेतावनियां संदेश के रूप में प्राप्त करें।',

    // Work / Shift
    shift_status: 'ड्यूटी स्थिति',
    working_hours: 'कार्य के घंटे',
    start_time: 'शिफ्ट प्रारंभ',
    end_time: 'शिफ्ट समाप्ति',
    available_days: 'कार्य दिवस',
    break_time: 'विश्राम समय',
    break_start: 'विश्राम प्रारंभ',
    break_end: 'विश्राम समाप्ति',
    zone_preference: 'पसंदीदा डिलीवरी ज़ोन',
    zone_desc: 'अपने पसंदीदा क्षेत्र के भीतर ऑर्डर प्राथमिकताएं चुनें।',
    availability_status: 'ड्यूटी उपलब्धता',

    // Privacy
    privacy_prefs: 'गोपनीयता और टेलीमेट्री',
    personalization: 'मार्ग अनुकूलन',
    personalization_desc: 'डिलीवरी समय बचाने के लिए नेविगेशन टेलीमेट्री सक्षम करें।',
    location_permission: 'पृष्ठभूमि जीपीएस ट्रैकिंग',
    location_desc: 'सटीक डिस्पैच और ग्राहक ट्रैकिंग के लिए जीपीएस आवश्यक है।',

    // Security
    security_info: 'सुरक्षा और क्रेडेंशियल',
    active_sessions: 'सक्रिय सत्र',
    session_notice: 'निष्क्रियता के बाद सुरक्षा के लिए सत्र स्वतः समाप्त हो जाते हैं।',
    jwt_status: 'प्रमाणीकरण स्थिति',
    jwt_active: 'सुरक्षित JWT टोकन सक्रिय',

    // About
    brand_name: 'FD Foods • डिलीवरी पार्टनर HUD',
    app_version: 'संस्करण 2.4.0 (रॉयल ग्रीन एडिशन)',
    terms_of_service: 'राइडर सेवा की शर्तें',
    privacy_policy: 'गोपनीयता नीति',
    customer_support: '24/7 आपातकालीन सहायता हॉटलाइन',
    all_rights_reserved: 'सर्वाधिकार सुरक्षित।',

    // Feedback
    settings_saved: 'सवारी प्राथमिकताएं सफलतापूर्वक सहेजी गईं।',
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
      deliveries: 'डिलीवरी',
      earnings: 'कमाई',
      account: 'खाता',
      live_map: 'लाइव नक्शा',
      ratings: 'रेटिंग',
      performance: 'प्रदर्शन',
      documents: 'दस्तावेज़',
      vehicle: 'वाहन',
      settings: 'सेटिंग्स',
      support: 'सहायता',
      logout: 'लॉग आउट'
    },
    auth: {
      sign_in: 'साइन इन',
      sign_out: 'साइन आउट',
      login_title: 'राइडर लॉगिन',
      session_expired: 'सत्र समाप्त',
      session_expired_msg: 'आपका लॉगिन सत्र समाप्त हो गया है। कृपया पुनः साइन इन करें।'
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
    orders: {
      order_number: 'ऑर्डर #{{order_number}}',
      status_placed: 'ऑर्डर प्राप्त हुआ',
      status_confirmed: 'स्वीकृत',
      status_preparing: 'रसोई में तैयारी',
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
    notifications_hub: {
      notification_center: 'सूचना केंद्र',
      mark_all_read: 'सभी को पढ़ा हुआ चिह्नित करें',
      clear_all: 'सभी हटाएं',
      no_notifications: 'कोई नई सूचना नहीं मिली।',
      unread: 'अपठित'
    },
    pwa: {
      install_app: 'ऐप इंस्टॉल करें',
      install_title: 'FD Foods राइडर HUD इंस्टॉल करें',
      install_desc: 'बिजली जैसी तेज़ डिस्पैच सूचनाएं, ऑफ़लाइन नेविगेशन और बैटरी बचत के लिए होम स्क्रीन पर जोड़ें।',
      install_btn: 'अभी इंस्टॉल करें',
      install_ios_step1: 'Safari में शेयर आइकन पर टैप करें (निचला बार)',
      install_ios_step2: 'मेनू से "Add to Home Screen" चुनें',
      install_desktop_guide: 'इस ऐप को इंस्टॉल करने के लिए अपने ब्राउज़र के एड्रेस बार में इंस्टॉल आइकन पर क्लिक करें।',
      installed_badge: 'इंस्टॉल किया गया (स्टैंडअलोन)',
      update_title: 'अपडेट उपलब्ध है',
      update_desc: 'राइडर ऐप का नया संस्करण उपलब्ध है।',
      update_now: 'अभी अपडेट करें',
      later: 'बाद में',
      offline_badge: 'राइडर ऑफ़लाइन है',
      offline_banner_title: 'राइडर कनेक्शन टूट गया',
      offline_banner_desc: 'सक्रिय शिफ्ट और डिलीवरी पूर्ण करने के लिए इंटरनेट आवश्यक है।',
      offline_delivery_warning: 'सावधानी: ऑफ़लाइन होने पर लाइव जीपीएस रोक दिया जाता है।',
      retry_connection: 'पुनः कनेक्ट करें',
      checking_connection: 'सर्वर से कनेक्ट हो रहा है...',
      online_restored: 'राइडर कनेक्शन बहाल हुआ!'
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
