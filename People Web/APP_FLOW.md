# People App - Complete Flow Documentation

## 🎯 **EXACT APP FLOW (Always Remember This)**

### **Main App Flow:**
1. **Main App** → User opens the app
2. **Role Selection** → User chooses their role
3. **Work as Freelancer** → User selects "Work as Freelancer"
4. **Authentication Page** → User logs in/registers
5. **Manual Verification Check** → App checks if user is verified
6. **If NOT Verified** → Show manual verification form
7. **If ALREADY Verified** → Show freelancer dashboard

---

## 📋 **Manual Verification Process:**

### **Step 1: Personal Information**
User fills in:
- ✅ **Full Name** (First Name + Last Name)
- ✅ **Date of Birth (DOB)**
- ✅ **Gender**
- ✅ **Address** (Complete address details)

### **Step 2: Document Upload**
User uploads:
- ✅ **Profile Photo**
- ✅ **Aadhar Card Front**
- ✅ **Aadhar Card Back**
- ✅ **PAN Card Front**
- ✅ **Delivery Checkbox** (Optional)
  - If checked: **Driving License Front**
  - If checked: **Driving License Back**

### **Step 3: Submit for Verification**
- ✅ User clicks **"Submit for Verification"** button
- ✅ Data sent to backend API
- ✅ User profile shows **"Pending"** status
- ✅ User sees "Under Review" message

---

## 👨‍💼 **Admin Panel Flow:**

### **Step 1: Admin Access**
- ✅ Admin opens admin panel
- ✅ Login with admin credentials
- ✅ See **Pending Queue** with all pending verifications

### **Step 2: Review Process**
- ✅ Admin clicks **"Verify"** on any pending user
- ✅ Admin sees complete user details:
  - Personal information (name, DOB, gender, address)
  - All uploaded documents (photos, Aadhar, PAN, DL)
- ✅ Admin can view documents in full screen

### **Step 3: Decision**
- ✅ Admin clicks **"Approve"** or **"Reject"**
- ✅ If **Approve**: User gets **"Verified"** badge
- ✅ If **Reject**: User gets rejection message with reason

---

## 🔄 **User Status Flow:**

```
Unverified User → Submit Verification → Pending → Admin Review → Approved/Rejected
     ↓                    ↓                ↓           ↓              ↓
  Can't work         Data stored      Under Review  Admin sees    Verified badge
  in app            in database       message       all details   or Rejection
```

---

## 🎯 **POST-VERIFICATION FLOW (NEW):**

### **After Admin Approval:**
1. **User Status Updates** → `isVerified: true`, `verificationStatus: 'approved'`
2. **Freelancer ID Generation** → Unique 5-10 digit ID assigned
3. **Freelancer Dashboard Updates**:
   - ✅ **"Your profile has been verified"** → **"Your profile has been verified"**
   - ✅ **"Freelancer ID: XXXXXXXX"** → Shows unique ID
   - ✅ **New line appears**: **"Complete profile to pickup work"**
4. **Profile Page Auto-fill**:
   - ✅ **Full Name** (from verification data)
   - ✅ **Gender** (from verification data)
   - ✅ **Address** (from verification data)
   - ✅ **Pincode** (from verification data)
   - ✅ **Email** (freelancer fills manually)
5. **Profile Page Display**:
   - ✅ **Freelancer ID Badge** → Blue badge showing "ID: XXXXXXXX"
   - ✅ **Verified Badge** → Green badge showing "Verified"

### **Profile Completion Flow:**
1. **User clicks "Complete profile to pickup work"**
2. **Redirects to Profile page** with pre-filled data
3. **User can edit/confirm** the auto-filled information
4. **User saves profile** to start picking up work
5. **User can now access** job listings and apply for work

---

## 📋 **Updated Manual Verification Process:**

### **Step 1: Personal Information**
User fills in:
- ✅ **Full Name** (First Name + Last Name)
- ✅ **Date of Birth (DOB)**
- ✅ **Gender**
- ✅ **Address** (Complete address details)
- ✅ **Pincode** (6-digit postal code)

### **Step 2: Document Upload**
User uploads:
- ✅ **Profile Photo**
- ✅ **Aadhar Card Front**
- ✅ **Aadhar Card Back**
- ✅ **PAN Card Front**
- ✅ **Delivery Checkbox** (Optional)
  - If checked: **Driving License Front**
  - If checked: **Driving License Back**

### **Step 3: Submit for Verification**
- ✅ User clicks **"Submit for Verification"** button
- ✅ Data sent to backend API
- ✅ User profile shows **"Pending"** status
- ✅ User sees **"Under Review"** message
- ✅ User **cannot access** job listings or apply for work

---

## 🎯 **Key Points to Remember:**

### **1. Integration Points:**
- ✅ **Main App** → **Manual Verification Form** (when user not verified)
- ✅ **Verification Form** → **Backend API** (stores user data)
- ✅ **Backend API** → **Admin Panel** (shows pending verifications)
- ✅ **Admin Panel** → **Backend API** (approves/rejects)
- ✅ **Backend API** → **Main App** (updates user status)

### **2. User Experience:**
- ✅ User **must complete verification** before working
- ✅ User sees **"Under Review"** while pending
- ✅ User gets **"Verified" badge** when approved
- ✅ User gets **rejection reason** when rejected
- ✅ **After approval**: User sees **"Your profile has been verified"**
- ✅ **After approval**: User sees **"Complete profile to pickup work"**
- ✅ **Profile auto-fills** with verification data (name, gender, address)

### **3. Admin Experience:**
- ✅ Admin sees **all pending verifications**
- ✅ Admin can **view all documents** in detail
- ✅ Admin can **approve or reject** with comments
- ✅ Admin sees **complete user information**

---

## 🚨 **IMPORTANT REMINDERS:**

1. **This is NOT a separate system** - it's integrated into your main app
2. **Verification happens AFTER authentication** in the main app
3. **Admin panel is for reviewing** the verification submissions
4. **User can't work** until verification is approved
5. **All documents must be viewable** in admin panel
6. **Status updates** must reflect in main app immediately

---

## 📱 **File Structure:**
```
Main App/
├── Role Selection
├── Authentication
├── Manual Verification (if not verified)
│   ├── Personal Info Form
│   ├── Document Upload
│   └── Submit for Review
├── Freelancer Dashboard (if verified)
│   ├── "Your profile has been verified" (after approval)
│   ├── "Complete profile to pickup work" (after approval)
│   └── Job listings (after profile completion)
└── Profile Page (auto-filled with verification data)

Admin Panel/
├── Login
├── Pending Verifications
├── Review User Details
└── Approve/Reject
```

---

**ALWAYS REFER TO THIS FLOW WHEN WORKING ON THE SYSTEM!** 🎯
