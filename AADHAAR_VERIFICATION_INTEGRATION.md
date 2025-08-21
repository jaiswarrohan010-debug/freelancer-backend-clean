# Aadhaar Verification Integration

## Overview

This integration adds Aadhaar verification to the freelancer registration flow using Cashfree's verification API. The verification is mandatory for freelancers to ensure identity verification and prevent illegal activities.

## Features

- **Aadhaar OTP Generation**: Send OTP to Aadhaar-linked mobile number
- **Aadhaar Verification**: Verify OTP and validate identity
- **Secure Storage**: Aadhaar numbers are encrypted before storage
- **User Profile Update**: Automatically update user profile with verification status
- **Mandatory for Freelancers**: Required step in freelancer registration

## Flow

1. **User Registration**: Phone number → OTP verification
2. **Role Selection**: User chooses "Work as Freelancer"
3. **Aadhaar Verification**: 
   - Enter 12-digit Aadhaar number
   - Generate OTP (sent to Aadhaar-linked mobile)
   - Enter 6-digit OTP
   - Verify and complete registration
4. **Dashboard**: Redirect to freelancer home

## Files Modified/Created

### New Files
- `app/utils/cashfree-verification.js` - Cashfree verification API utility
- `app/auth/aadhaar-verification.js` - Aadhaar verification screen
- `app/components/AadhaarVerificationTest.js` - Test component

### Modified Files
- `app/auth/phone.js` - Updated to redirect to Aadhaar verification
- `api/routes/users.js` - Updated verification route to support both methods

## API Configuration

```javascript
const CASHFREE_VERIFICATION_CONFIG = {
  baseURL: 'https://sandbox.cashfree.com/verification',
  clientId: 'CF10751692D2IC9OL3LO7C73FBB62G',
  clientSecret: 'cfsk_ma_test_7e0691d1e563f117ea2319053362831c_f8be14b0'
};
```

## API Endpoints

### Generate Aadhaar OTP
```
POST https://sandbox.cashfree.com/verification/offline-aadhaar/otp
Headers: {
  'Content-Type': 'application/json',
  'x-client-id': 'CF10751692D2IC9OL3LO7C73FBB62G',
  'x-client-secret': 'cfsk_ma_test_7e0691d1e563f117ea2319053362831c_f8be14b0'
}
Body: {
  "aadhaar_number": "123456789012"
}
```

### Verify Aadhaar OTP
```
POST https://sandbox.cashfree.com/verification/offline-aadhaar/verify
Headers: {
  'Content-Type': 'application/json',
  'x-client-id': 'CF10751692D2IC9OL3LO7C73FBB62G',
  'x-client-secret': 'cfsk_ma_test_7e0691d1e563f117ea2319053362831c_f8be14b0'
}
Body: {
  "aadhaar_number": "123456789012",
  "otp": "123456"
}
```

## Database Schema

The User model includes these verification fields:

```javascript
{
  aadhaarNumber: { type: String }, // Encrypted
  isVerified: { type: Boolean, default: false },
  verificationMethod: { type: String, enum: ['digilocker', 'cashfree_aadhaar', 'manual'] },
  verificationData: { type: mongoose.Schema.Types.Mixed },
  verifiedAt: { type: Date },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'expired'],
    default: 'pending'
  }
}
```

## Security

- Aadhaar numbers are encrypted using AES-256-CBC before storage
- Verification data is stored securely in the database
- API credentials are stored in the utility file (should be moved to environment variables in production)

## Testing

Use the test component `AadhaarVerificationTest.js` to test the integration:

```javascript
import AadhaarVerificationTest from '../components/AadhaarVerificationTest';
```

## Error Handling

The integration handles various error scenarios:
- Invalid Aadhaar number format
- Network errors
- API errors
- Invalid OTP
- Verification failures

## Production Considerations

1. **Environment Variables**: Move API credentials to environment variables
2. **Production API**: Switch to production Cashfree API endpoints
3. **Rate Limiting**: Implement rate limiting for OTP generation
4. **Logging**: Add comprehensive logging for verification attempts
5. **Monitoring**: Monitor verification success/failure rates

## Usage

### For Freelancers
1. Complete phone verification
2. Navigate to Aadhaar verification screen
3. Enter Aadhaar number
4. Generate and enter OTP
5. Complete verification

### For Developers
```javascript
import CashfreeVerification from '../utils/cashfree-verification';

// Generate OTP
const result = await CashfreeVerification.generateAadhaarOTP('123456789012');

// Verify OTP
const verification = await CashfreeVerification.verifyAadhaarOTP('123456789012', '123456');
```

## Troubleshooting

### Common Issues
1. **OTP not received**: Check Aadhaar-linked mobile number
2. **Invalid OTP**: Ensure correct 6-digit OTP
3. **API errors**: Check network connectivity and API credentials
4. **Verification failed**: Contact Cashfree support

### Debug Mode
Enable console logging to debug issues:
```javascript
console.log('Generate OTP Result:', result);
console.log('Verify OTP Result:', verification);
```
