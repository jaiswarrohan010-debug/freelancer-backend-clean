// DigiLocker Configuration
const DIGILOCKER_CONFIG = {
  clientId: 'digilocker_wlcenvIXXLmKLaCbnpyk',
  token: '.eJyrVkrOyUzNK4nPTFGyUkrJTM_MyU_OTi2KL89JTs0r84yI8Mn19kl0TsorqMxW0lFKTyxJLU-sBKotTsxLScqvAIqVVBakomhWqgUAawcfHg.aKOFkA.k5nQ5BIG2VeVL-j7ILGl13m4I9Y',
  baseURL: 'https://digilocker-sdk.notbot.in',
  gateway: 'sandbox',
  type: 'digilocker',
  authType: 'web'
};

class DigiLockerService {
  constructor() {
    this.config = DIGILOCKER_CONFIG;
  }

  // Get headers for API requests
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.token}`,
      'X-Client-ID': this.config.clientId
    };
  }

  // Get authentication URL
  getAuthUrl() {
    return `${this.config.baseURL}/?gateway=${this.config.gateway}&type=${this.config.type}&token=${this.config.token}&auth_type=${this.config.authType}`;
  }

  // Check authentication status
  async checkAuthStatus() {
    try {
      const response = await fetch(`${this.config.baseURL}/auth/status`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Auth status check failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('DigiLocker auth status error:', error);
      throw error;
    }
  }

  // Get user documents
  async getDocuments() {
    try {
      const response = await fetch(`${this.config.baseURL}/documents`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Document retrieval failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('DigiLocker document retrieval error:', error);
      throw error;
    }
  }

  // Get specific document
  async getDocument(docId) {
    try {
      const response = await fetch(`${this.config.baseURL}/documents/${docId}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Document retrieval failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('DigiLocker document retrieval error:', error);
      throw error;
    }
  }

  // Get KYC data
  async getKYCData() {
    try {
      const response = await fetch(`${this.config.baseURL}/kyc`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`KYC data retrieval failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('DigiLocker KYC error:', error);
      throw error;
    }
  }

  // Verify document
  async verifyDocument(docData) {
    try {
      const verificationData = {
        documentType: docData.type || 'AADHAAR',
        documentNumber: docData.number,
        verificationType: docData.verificationType || 'OCR'
      };

      const response = await fetch(`${this.config.baseURL}/verify`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(verificationData)
      });

      if (!response.ok) {
        throw new Error(`Document verification failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('DigiLocker verification error:', error);
      throw error;
    }
  }

  // Upload document
  async uploadDocument(docData) {
    try {
      const uploadData = {
        documentType: docData.type || 'AADHAAR',
        documentName: docData.name,
        documentData: docData.data // base64 encoded
      };

      const response = await fetch(`${this.config.baseURL}/upload`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(uploadData)
      });

      if (!response.ok) {
        throw new Error(`Document upload failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('DigiLocker upload error:', error);
      throw error;
    }
  }

  // Verify webhook signature
  verifyWebhookSignature(payload, signature) {
    // Implement webhook signature verification based on DigiLocker documentation
    // This is a placeholder - you'll need to implement according to DigiLocker specs
    try {
      // Add your webhook verification logic here
      return true;
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return false;
    }
  }

  // Get Aadhaar details
  async getAadhaarDetails() {
    try {
      const response = await fetch(`${this.config.baseURL}/documents/aadhaar`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Aadhaar retrieval failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('DigiLocker Aadhaar error:', error);
      throw error;
    }
  }

  // Get PAN details
  async getPANDetails() {
    try {
      const response = await fetch(`${this.config.baseURL}/documents/pan`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`PAN retrieval failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('DigiLocker PAN error:', error);
      throw error;
    }
  }

  // Get driving license details
  async getDrivingLicenseDetails() {
    try {
      const response = await fetch(`${this.config.baseURL}/documents/driving-license`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Driving license retrieval failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('DigiLocker driving license error:', error);
      throw error;
    }
  }
}

// Create singleton instance
const digiLockerService = new DigiLockerService();

export default digiLockerService;
