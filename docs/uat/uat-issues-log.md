# UAT Issues Log — Cinema Booking System (CineBook)

## Severity Guide

- **Critical**: Blocks booking/payment or causes data corruption
- **Major**: User can finish but with serious confusion or repeated errors
- **Minor**: Cosmetic / low-friction improvement

---

## Issues Identified and Resolution Status

| ID | Severity | Description | Steps to Reproduce | Expected | Actual | Reported By | Owner | Status | Fix Description | Verified |
|--------|----------|-------------|-------------------|----------|--------|-------------|-------|--------|-----------------|----------|
| UAT-001 | Major | PayPal button label unclear ("Checkout" vs "Pay with PayPal") | 1) Select seats 2) Go to checkout | User understands next step is payment | User hesitated, asked what button does | P2, P6, P9 | Member 5 | ✅ Fixed | Updated button text to "Pay with PayPal" with PayPal logo icon | Yes |
| UAT-002 | Major | Seat selection colors not intuitive - users confused about seat states | 1) Go to seat selection 2) View seat map | Clear distinction between available, selected, booked, held seats | Users couldn't distinguish between booked and held seats | P3, P5, P7, P8 | Member 4 | ✅ Fixed | Implemented color-coded seat indicators: Green (available), Blue (selected), Red (booked), Orange (held by others) with legend | Yes |
| UAT-003 | Major | Mobile responsiveness issues on seat selection page | 1) Open on mobile device 2) Navigate to seat selection | Seat grid displays properly on mobile | Seats overlap and grid breaks on screens < 768px | P4, P6, P10 | Member 4 | ✅ Fixed | Improved mobile responsiveness with proper CSS grid and touch-friendly seat buttons | Yes |
| UAT-004 | Major | Error messages too technical and unclear | 1) Enter invalid email 2) Submit form | User-friendly error message | Shows "Validation Error: email must match regex pattern" | P5, P6, P9 | Member 1 | ✅ Fixed | Replaced technical error messages with user-friendly alternatives (e.g., "Please enter a valid email address") | Yes |
| UAT-005 | Major | Booking confirmation screen lacks important details | 1) Complete booking 2) View confirmation | Shows movie name, time, seats, cinema, price clearly | Missing cinema name and showtime details | P1, P2, P8 | Member 6 | ✅ Fixed | Enhanced booking confirmation screen with complete booking details, QR code, and download option | Yes |
| UAT-006 | Minor | No loading indicator during seat availability check | 1) Select showtime 2) Wait for seats to load | Loading spinner or indicator | Blank screen for 2-3 seconds | P3, P7 | Member 4 | ✅ Fixed | Added loading spinner with "Loading available seats..." message | Yes |
| UAT-007 | Minor | Search results not highlighting matched text | 1) Search for movie 2) View results | Search term highlighted in results | No visual indication of match | P1, P4 | Member 3 | ✅ Fixed | Added text highlighting for search matches | Yes |
| UAT-008 | Minor | Time format inconsistent (12h vs 24h) | 1) Browse showtimes | Consistent time format | Mix of "14:00" and "2:00 PM" | P2, P10 | Member 4 | ✅ Fixed | Standardized to 12-hour format with AM/PM across all pages | Yes |
| UAT-009 | Minor | No confirmation dialog before cancellation | 1) Go to booking history 2) Click cancel | Confirmation prompt before cancel | Booking cancelled immediately | P8, P9 | Member 6 | ✅ Fixed | Added confirmation modal: "Are you sure you want to cancel this booking?" | Yes |
| UAT-010 | Minor | Filter options reset when navigating back | 1) Apply filters 2) View movie 3) Go back | Filters retained | Filters reset to default | P3, P5 | Member 3 | ✅ Fixed | Implemented filter state persistence using URL parameters | Yes |
| UAT-011 | Minor | Email confirmation not received immediately | 1) Complete booking 2) Check email | Email within 1 minute | Email delayed by 5+ minutes | P6, P8 | Member 7 | ✅ Fixed | Optimized email queue processing and added SendGrid priority sending | Yes |
| UAT-012 | Minor | QR code too small on mobile ticket view | 1) View booking on mobile 2) Open ticket | Scannable QR code | QR code too small to scan reliably | P4, P10 | Member 6 | ✅ Fixed | Increased QR code size and added "Tap to enlarge" functionality | Yes |

---

## Issues Summary by Severity

| Severity | Total | Fixed | Pending | Verified |
|----------|-------|-------|---------|----------|
| Critical | 0 | 0 | 0 | 0 |
| Major | 5 | 5 | 0 | 5 |
| Minor | 7 | 7 | 0 | 7 |
| **Total** | **12** | **12** | **0** | **12** |

---

## Key Improvements Made Based on UAT Feedback

### 1. Color-Coded Seat Indicators (UAT-002)
- **Before**: Single color scheme that confused users about seat availability status
- **After**: Implemented intuitive color system with legend:
  - 🟢 Green: Available for selection
  - 🔵 Blue: Currently selected by you
  - 🔴 Red: Already booked
  - 🟠 Orange: Temporarily held by another user

### 2. Mobile Responsiveness (UAT-003)
- **Before**: Seat grid broke on mobile devices, overlapping elements
- **After**: Responsive grid layout with proper scaling, touch-friendly buttons (min 44px touch targets)

### 3. User-Friendly Error Messages (UAT-004)
- **Before**: Technical validation errors exposed to users
- **After**: Clear, actionable error messages in plain language

### 4. Enhanced Booking Confirmation (UAT-005)
- **Before**: Minimal confirmation with missing details
- **After**: Complete booking summary including:
  - Movie poster and title
  - Cinema name and address
  - Showtime and date
  - Selected seats with row/number
  - Total price breakdown
  - QR code for entry
  - Download as PDF option

---

## Evidence Files

Screenshots and recordings (where consent was given) are stored separately to maintain participant anonymity. Reference codes:
- `uat_p2_checkout.png` - PayPal button confusion
- `uat_p3_seats.png` - Seat color confusion
- `uat_p4_mobile.png` - Mobile responsiveness issue
- `uat_p6_error.png` - Technical error message display
- `uat_recording_p1.mp4` - Full session recording (consent given)
- `uat_recording_p7.mp4` - Full session recording (consent given)
