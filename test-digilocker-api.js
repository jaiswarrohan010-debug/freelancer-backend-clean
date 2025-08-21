const axios = require('axios');

// DigiLocker Sandbox API Configuration
const DIGILOCKER_CONFIG = {
  clientId: 'digilocker_wlcenvIXXLmKLaCbnpyk',
  token: '.eJyrVkrOyUzNK4nPTFGyUkrJTM_MyU_OTi2KL89JTs0r84yI8Mn19kl0TsorqMxW0lFKTyxJLU-sBKotTsxLScqvAIqVVBakomhWqgUAawcfHg.aKOFkA.k5nQ5BIG2VeVL-j7ILGl13m4I9Y',
  baseURL: 'https://digilocker-sdk.notbot.in',
  gateway: 'sandbox',
  type: 'digilocker',
  authType: 'web'
};

// Test functions for DigiLocker API endpoints
class DigiLockerTester {
  constructor(config) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.token}`,
        'X-Client-ID': config.clientId
      }
    });
  }

  // Test API connectivity
  async testConnectivity() {
    try {
      console.log('🔍 Testing DigiLocker API connectivity...');
      // Try to access the main URL to test connectivity
      const response = await this.client.get('/');
      console.log('✅ Connectivity test passed:', response.data);
      return true;
    } catch (error) {
      console.log('❌ Connectivity test failed:', error.message);
      // Try alternative endpoint
      try {
        const altResponse = await this.client.get('/api/status');
        console.log('✅ Connectivity test passed (alternative endpoint):', altResponse.data);
        return true;
      } catch (altError) {
        console.log('❌ Alternative connectivity test also failed:', altError.message);
        return false;
      }
    }
  }

  // Test user authentication
  async testUserAuth() {
    try {
      console.log('🔐 Testing user authentication...');
      const authUrl = `${this.config.baseURL}/?gateway=${this.config.gateway}&type=${this.config.type}&token=${this.config.token}&auth_type=${this.config.authType}`;
      console.log('Auth URL:', authUrl);
      
      // Test the actual auth URL
      const response = await this.client.get(`/?gateway=${this.config.gateway}&type=${this.config.type}&token=${this.config.token}&auth_type=${this.config.authType}`);
      console.log('✅ User authentication test passed:', response.data);
      return response.data;
    } catch (error) {
      console.log('❌ User authentication test failed:', error.response?.data || error.message);
      return null;
    }
  }

  // Test document list retrieval
  async testGetDocuments() {
    try {
      console.log('📄 Testing document list retrieval...');
      const response = await this.client.get('/api/documents');
      console.log('✅ Document list test passed:', response.data);
      return response.data;
    } catch (error) {
      console.log('❌ Document list test failed:', error.response?.data || error.message);
      return null;
    }
  }

  // Test specific document retrieval
  async testGetDocument(docId) {
    try {
      console.log(`📋 Testing document retrieval for ID: ${docId}...`);
      const response = await this.client.get(`/api/documents/${docId}`);
      console.log('✅ Document retrieval test passed:', response.data);
      return response.data;
    } catch (error) {
      console.log('❌ Document retrieval test failed:', error.response?.data || error.message);
      return null;
    }
  }

  // Test document verification
  async testDocumentVerification(docData) {
    try {
      console.log('✅ Testing document verification...');
      const verificationData = {
        documentType: docData.type || 'AADHAAR',
        documentNumber: docData.number || 'TEST123456789',
        verificationType: 'OCR'
      };

      const response = await this.client.post('/api/verify', verificationData);
      console.log('✅ Document verification test passed:', response.data);
      return response.data;
    } catch (error) {
      console.log('❌ Document verification test failed:', error.response?.data || error.message);
      return null;
    }
  }

  // Test KYC data retrieval
  async testKYCData() {
    try {
      console.log('🆔 Testing KYC data retrieval...');
      const response = await this.client.get('/api/kyc');
      console.log('✅ KYC data test passed:', response.data);
      return response.data;
    } catch (error) {
      console.log('❌ KYC data test failed:', error.response?.data || error.message);
      return null;
    }
  }

  // Test document upload (if supported)
  async testDocumentUpload() {
    try {
      console.log('📤 Testing document upload...');
      const uploadData = {
        documentType: 'AADHAAR',
        documentName: 'test_document.pdf',
        documentData: 'base64_encoded_document_data_here'
      };

      const response = await this.client.post('/api/upload', uploadData);
      console.log('✅ Document upload test passed:', response.data);
      return response.data;
    } catch (error) {
      console.log('❌ Document upload test failed:', error.response?.data || error.message);
      return null;
    }
  }

  // Test webhook verification
  async testWebhookVerification() {
    try {
      console.log('🔗 Testing webhook verification...');
      const webhookData = {
        event: 'document.verified',
        data: {
          documentId: 'DOC_123456',
          status: 'VERIFIED',
          timestamp: new Date().toISOString()
        }
      };

      const response = await this.client.post('/api/webhooks/verify', webhookData);
      console.log('✅ Webhook verification test passed:', response.data);
      return response.data;
    } catch (error) {
      console.log('❌ Webhook verification test failed:', error.response?.data || error.message);
      return null;
    }
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting DigiLocker API Tests...\n');
    
    // Test 1: Connectivity
    const connectivityResult = await this.testConnectivity();
    if (!connectivityResult) {
      console.log('❌ Stopping tests due to connectivity failure');
      return;
    }

    // Test 2: User Authentication
    const authResult = await this.testUserAuth();
    
    // Test 3: Document List
    const documentsResult = await this.testGetDocuments();
    
    // Test 4: KYC Data
    await this.testKYCData();

    // Test 5: Document Verification
    if (documentsResult && documentsResult.documents && documentsResult.documents.length > 0) {
      const firstDoc = documentsResult.documents[0];
      await this.testGetDocument(firstDoc.id);
      await this.testDocumentVerification(firstDoc);
    } else {
      // Test with sample data
      await this.testDocumentVerification({ type: 'AADHAAR', number: 'TEST123456789' });
    }

    // Test 6: Document Upload
    await this.testDocumentUpload();

    // Test 7: Webhook Verification
    await this.testWebhookVerification();

    console.log('\n🎉 All tests completed!');
  }
}

// Main execution
async function main() {
  console.log('DigiLocker Sandbox API Tester');
  console.log('==============================\n');

  const tester = new DigiLockerTester(DIGILOCKER_CONFIG);
  await tester.runAllTests();
}

// Run the tests
main().catch(console.error);
