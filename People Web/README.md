# People - ID Verification Admin Panel

A comprehensive admin panel for manual ID verification management, designed for freelancer platforms. This system allows administrators to review and approve/reject ID documents submitted by freelancers.

## Features

### Admin Panel Features
- **Secure Login System**: Admin authentication with session management
- **Dashboard Overview**: Real-time statistics and recent activity
- **Document Review**: View uploaded documents (Aadhar, PAN, Driving License)
- **Approval/Rejection System**: Review documents with comments
- **Filtering & Search**: Filter by document type and date
- **Auto-refresh**: Automatic updates for new verifications
- **Responsive Design**: Works on desktop and mobile devices

### User Verification Features
- **Multi-step Form**: Guided verification process
- **Document Upload**: Support for Aadhar, PAN, and Driving License
- **Drag & Drop**: Easy file upload interface
- **Real-time Preview**: Preview uploaded documents
- **Form Validation**: Comprehensive input validation
- **Status Tracking**: Real-time verification status updates

## File Structure

```
People Web/
├── index.html                 # Main website
├── verification.html          # User verification form
├── verification-script.js     # Verification form functionality
├── admin/
│   ├── index.html            # Admin panel
│   ├── admin-styles.css      # Admin panel styles
│   └── admin-script.js       # Admin panel functionality
├── styles.css                # Main website styles
├── script.js                 # Main website functionality
└── README.md                 # This file
```

## Getting Started

### 1. Access the Admin Panel

1. Navigate to `admin/index.html` in your browser
2. Login with the following credentials:
   - **Username**: `admin`
   - **Password**: `admin123`

### 2. Using the Admin Panel

#### Dashboard
- View pending, approved, and rejected verification counts
- Monitor recent activity
- Access quick statistics

#### Pending Verifications
- View all pending verification requests
- Filter by document type (Aadhar, PAN, Driving License)
- Filter by date (Today, This Week, This Month)
- Click "Review" to examine documents

#### Document Review Process
1. Click "Review" on any pending verification
2. View user information and uploaded documents
3. Examine document images (front/back as applicable)
4. Add comments (optional for approval, required for rejection)
5. Click "Approve" or "Reject"

#### Approved/Rejected Sections
- View all approved and rejected verifications
- See review comments and timestamps
- Track verification history

#### Settings
- Configure auto-refresh interval
- Enable/disable email notifications
- Save admin preferences

### 3. User Verification Process

#### For Freelancers
1. Navigate to `verification.html`
2. Fill in personal information (Step 1)
3. Upload required documents (Step 2)
   - **Aadhar Card**: Front and back images
   - **PAN Card**: Front image only
   - **Driving License**: Front and back images
4. Review and submit (Step 3)
5. Receive reference ID for tracking

## Document Types Supported

### Aadhar Card
- **Required**: Front and back images
- **Validation**: Both sides must be uploaded
- **Format**: JPG, PNG, GIF (max 5MB each)

### PAN Card
- **Required**: Front image only
- **Validation**: Single image upload
- **Format**: JPG, PNG, GIF (max 5MB)

### Driving License
- **Required**: Front and back images
- **Validation**: Both sides must be uploaded
- **Format**: JPG, PNG, GIF (max 5MB each)

## Technical Details

### Frontend Technologies
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with Flexbox and Grid
- **JavaScript (ES6+)**: Interactive functionality
- **Font Awesome**: Icons
- **Google Fonts**: Typography

### Data Storage
- **LocalStorage**: Client-side data persistence (demo)
- **Session Management**: Admin login state
- **File Handling**: Base64 image encoding

### Security Features
- **Input Validation**: Client-side form validation
- **File Type Validation**: Image file restrictions
- **File Size Limits**: 5MB maximum per file
- **Session Management**: Admin authentication

## Customization

### Adding New Document Types
1. Update the document type options in `verification.html`
2. Add corresponding upload sections
3. Update validation logic in `verification-script.js`
4. Modify admin panel filters and display logic

### Styling Customization
- Modify `admin-styles.css` for admin panel appearance
- Update `styles.css` for main website styling
- Customize colors, fonts, and layout as needed

### Backend Integration
To integrate with a backend system:

1. **Replace localStorage with API calls**:
   ```javascript
   // Example API integration
   async function submitVerification(data) {
       const response = await fetch('/api/verifications', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify(data)
       });
       return response.json();
   }
   ```

2. **Add server-side authentication**:
   ```javascript
   // Example authentication
   async function authenticateAdmin(credentials) {
       const response = await fetch('/api/admin/login', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify(credentials)
       });
       return response.json();
   }
   ```

3. **Implement file upload to server**:
   ```javascript
   // Example file upload
   async function uploadDocument(file) {
       const formData = new FormData();
       formData.append('document', file);
       
       const response = await fetch('/api/upload', {
           method: 'POST',
           body: formData
       });
       return response.json();
   }
   ```

## Browser Compatibility

- **Chrome**: 60+
- **Firefox**: 55+
- **Safari**: 12+
- **Edge**: 79+

## Performance Considerations

- **Image Optimization**: Consider implementing image compression
- **Lazy Loading**: For large document lists
- **Caching**: Implement proper caching strategies
- **CDN**: Use CDN for static assets in production

## Security Best Practices

1. **Server-side Validation**: Always validate on server
2. **HTTPS**: Use HTTPS in production
3. **File Upload Security**: Implement proper file validation
4. **Authentication**: Use secure authentication methods
5. **Data Encryption**: Encrypt sensitive data
6. **Rate Limiting**: Implement API rate limiting

## Support

For technical support or questions:
- **Email**: rohanjaiswar2467@gmail.com
- **Phone**: +91 7021098460

## License

This project is proprietary software. All rights reserved.

---

**Note**: This is a demo version using client-side storage. For production use, implement proper backend integration with database storage and server-side security measures.
