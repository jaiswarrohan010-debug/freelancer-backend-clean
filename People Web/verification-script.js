// Verification Form JavaScript

let currentStep = 1;
let uploadedDocuments = {};

// Initialize the verification form
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    setupFileUploads();
});

function setupEventListeners() {
    // Document type change handler
    const documentTypeSelect = document.getElementById('documentType');
    if (documentTypeSelect) {
        documentTypeSelect.addEventListener('change', function() {
            showDocumentUploads(this.value);
        });
    }

    // File input change handlers
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
        input.addEventListener('change', function(e) {
            handleFileUpload(e.target);
        });
    });
}

function setupFileUploads() {
    // Setup drag and drop for document uploads
    const uploadAreas = document.querySelectorAll('.document-upload');
    uploadAreas.forEach(area => {
        area.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('dragover');
        });

        area.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
        });

        area.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const fileInput = this.querySelector('input[type="file"]');
                if (fileInput) {
                    fileInput.files = files;
                    handleFileUpload(fileInput);
                }
            }
        });
    });
}

function showDocumentUploads(documentType) {
    // Hide all document sections
    const sections = document.querySelectorAll('.document-section');
    sections.forEach(section => {
        section.style.display = 'none';
    });

    // Show relevant section
    if (documentType === 'aadhar') {
        document.getElementById('aadharUploads').style.display = 'block';
    } else if (documentType === 'pan') {
        document.getElementById('panUploads').style.display = 'block';
    } else if (documentType === 'driving') {
        document.getElementById('drivingUploads').style.display = 'block';
    }
}

function triggerFileInput(inputId) {
    document.getElementById(inputId).click();
}

function handleFileUpload(fileInput) {
    const file = fileInput.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Please upload an image file.');
        return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB.');
        return;
    }

    // Read and display the file
    const reader = new FileReader();
    reader.onload = function(e) {
        const imageData = e.target.result;
        const documentType = fileInput.id;
        
        // Store the uploaded document
        uploadedDocuments[documentType] = imageData;
        
        // Update the upload area
        updateUploadArea(fileInput, imageData);
        
        // Update document previews
        updateDocumentPreviews();
    };
    reader.readAsDataURL(file);
}

function updateUploadArea(fileInput, imageData) {
    const uploadArea = fileInput.closest('.document-upload');
    if (uploadArea) {
        uploadArea.innerHTML = `
            <img src="${imageData}" alt="Uploaded document" style="max-width: 100%; max-height: 150px; border-radius: 4px; margin-bottom: 1rem;">
            <p style="color: #10b981; font-weight: 500;">✓ Document uploaded successfully</p>
            <button type="button" onclick="removeDocument('${fileInput.id}')" style="background: #ef4444; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; margin-top: 0.5rem; cursor: pointer;">
                Remove
            </button>
        `;
    }
}

function removeDocument(documentType) {
    delete uploadedDocuments[documentType];
    
    // Reset the file input
    const fileInput = document.getElementById(documentType);
    if (fileInput) {
        fileInput.value = '';
    }
    
    // Reset the upload area
    const uploadArea = fileInput.closest('.document-upload');
    if (uploadArea) {
        const documentTypeName = getDocumentTypeName(documentType);
        uploadArea.innerHTML = `
            <i class="fas fa-id-card"></i>
            <p>Upload ${documentTypeName}</p>
            <small>Click to upload or drag and drop</small>
            <input type="file" id="${documentType}" accept="image/*" style="display: none;">
        `;
    }
    
    updateDocumentPreviews();
}

function updateDocumentPreviews() {
    const previewContainer = document.getElementById('uploadedDocuments');
    if (!previewContainer) return;

    previewContainer.innerHTML = '';

    Object.entries(uploadedDocuments).forEach(([documentType, imageData]) => {
        const preview = document.createElement('div');
        preview.className = 'document-preview';
        
        const documentTypeName = getDocumentTypeName(documentType);
        
        preview.innerHTML = `
            <img src="${imageData}" alt="${documentTypeName}">
            <p>${documentTypeName}</p>
            <button onclick="removeDocument('${documentType}')">Remove</button>
        `;
        
        previewContainer.appendChild(preview);
    });
}

function getDocumentTypeName(documentType) {
    const types = {
        'aadharFront': 'Aadhar Card - Front',
        'aadharBack': 'Aadhar Card - Back',
        'panFront': 'PAN Card',
        'drivingFront': 'Driving License - Front',
        'drivingBack': 'Driving License - Back'
    };
    return types[documentType] || documentType;
}

function nextStep() {
    if (currentStep === 1) {
        if (!validateStep1()) return;
        showStep(2);
    } else if (currentStep === 2) {
        if (!validateStep2()) return;
        showStep(3);
        populateReviewContent();
    }
}

function prevStep() {
    if (currentStep === 2) {
        showStep(1);
    } else if (currentStep === 3) {
        showStep(2);
    }
}

function showStep(step) {
    // Hide all forms
    const forms = document.querySelectorAll('.verification-form');
    forms.forEach(form => {
        form.classList.remove('active');
    });

    // Show the current form
    const currentForm = document.querySelector(`#${getFormId(step)}`);
    if (currentForm) {
        currentForm.classList.add('active');
    }

    // Update step indicators
    updateStepIndicators(step);
    
    currentStep = step;
}

function getFormId(step) {
    const forms = {
        1: 'verificationForm',
        2: 'documentForm',
        3: 'reviewForm'
    };
    return forms[step];
}

function updateStepIndicators(activeStep) {
    const steps = document.querySelectorAll('.step');
    steps.forEach((step, index) => {
        const stepNumber = index + 1;
        step.classList.remove('active', 'completed');
        
        if (stepNumber === activeStep) {
            step.classList.add('active');
        } else if (stepNumber < activeStep) {
            step.classList.add('completed');
        }
    });
}

function validateStep1() {
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const documentType = document.getElementById('documentType').value;

    if (!firstName || !lastName || !email || !phone || !documentType) {
        alert('Please fill in all required fields.');
        return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address.');
        return false;
    }

    // Validate phone format (basic Indian phone validation)
    const phoneRegex = /^(\+91\s?)?[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
        alert('Please enter a valid Indian phone number.');
        return false;
    }

    return true;
}

function validateStep2() {
    const documentType = document.getElementById('documentType').value;
    
    if (documentType === 'aadhar') {
        if (!uploadedDocuments.aadharFront || !uploadedDocuments.aadharBack) {
            alert('Please upload both front and back sides of your Aadhar card.');
            return false;
        }
    } else if (documentType === 'pan') {
        if (!uploadedDocuments.panFront) {
            alert('Please upload your PAN card.');
            return false;
        }
    } else if (documentType === 'driving') {
        if (!uploadedDocuments.drivingFront || !uploadedDocuments.drivingBack) {
            alert('Please upload both front and back sides of your driving license.');
            return false;
        }
    }

    return true;
}

function populateReviewContent() {
    const reviewContent = document.getElementById('reviewContent');
    if (!reviewContent) return;

    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const documentType = document.getElementById('documentType').value;

    const documentTypeName = getDocumentTypeName(documentType);
    const documentCount = Object.keys(uploadedDocuments).length;

    reviewContent.innerHTML = `
        <div style="background: #f8fafc; padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem;">
            <h4 style="margin-bottom: 1rem; color: #1e293b;">Personal Information</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div>
                    <strong>Name:</strong> ${firstName} ${lastName}
                </div>
                <div>
                    <strong>Email:</strong> ${email}
                </div>
                <div>
                    <strong>Phone:</strong> ${phone}
                </div>
                <div>
                    <strong>Document Type:</strong> ${documentTypeName}
                </div>
            </div>
        </div>

        <div style="background: #f8fafc; padding: 1.5rem; border-radius: 8px;">
            <h4 style="margin-bottom: 1rem; color: #1e293b;">Uploaded Documents</h4>
            <p><strong>Documents uploaded:</strong> ${documentCount}</p>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-top: 1rem;">
                ${Object.entries(uploadedDocuments).map(([type, imageData]) => `
                    <div style="text-align: center;">
                        <img src="${imageData}" alt="${getDocumentTypeName(type)}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 4px; border: 1px solid #e5e7eb;">
                        <p style="font-size: 0.875rem; margin-top: 0.5rem; color: #374151;">${getDocumentTypeName(type)}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function submitVerification() {
    // Show loading state
    const submitBtn = document.querySelector('#reviewForm .btn-primary');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    submitBtn.disabled = true;

    // Prepare verification data
    const verificationData = {
        // Personal Information
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        dob: document.getElementById('dob').value,
        gender: document.getElementById('gender').value,
        
        // Address Information
        address: document.getElementById('address').value,
        city: document.getElementById('city').value,
        state: document.getElementById('state').value,
        pincode: document.getElementById('pincode').value,
        
        // Documents
        documents: uploadedDocuments,
        
        // Verification Status
        verificationStatus: 'pending',
        isVerified: false,
        submittedAt: new Date().toISOString()
    };

    // Send to backend API
    fetch('http://localhost:5000/api/verifications', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(verificationData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Verification submitted successfully:', data);
        
        // Generate reference ID
        const referenceId = 'VER' + Date.now().toString().slice(-8);
        
        // Show success message
        showVerificationStatus(referenceId);
        
        // Reset form
        resetForm();
    })
    .catch(error => {
        console.error('Failed to submit verification:', error);
        
        // Show error message
        alert('Failed to submit verification. Please try again. Error: ' + error.message);
        
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    });
}

function showVerificationStatus(referenceId) {
    // Hide all forms
    const forms = document.querySelectorAll('.verification-form');
    forms.forEach(form => {
        form.style.display = 'none';
    });

    // Show status
    const statusDiv = document.getElementById('verificationStatus');
    const referenceSpan = document.getElementById('referenceId');
    
    if (statusDiv && referenceSpan) {
        referenceSpan.textContent = referenceId;
        statusDiv.style.display = 'block';
        statusDiv.className = 'verification-status pending';
    }
}

function resetForm() {
    // Reset form fields
    document.getElementById('verificationForm').reset();
    
    // Clear uploaded documents
    uploadedDocuments = {};
    
    // Reset step indicators
    updateStepIndicators(1);
    
    // Show first step
    showStep(1);
    
    // Clear document previews
    const previewContainer = document.getElementById('uploadedDocuments');
    if (previewContainer) {
        previewContainer.innerHTML = '';
    }
    
    // Hide document sections
    const sections = document.querySelectorAll('.document-section');
    sections.forEach(section => {
        section.style.display = 'none';
    });
}

// Utility function to get document type name
function getDocumentTypeName(documentType) {
    const types = {
        'aadhar': 'Aadhar Card',
        'pan': 'PAN Card',
        'driving': 'Driving License'
    };
    return types[documentType] || documentType;
}
