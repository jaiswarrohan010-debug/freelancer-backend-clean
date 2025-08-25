import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';

// DigiLocker Configuration
const DIGILOCKER_CONFIG = {
  clientId: 'digilocker_wlcenvIXXLmKLaCbnpyk',
  token: '.eJyrVkrOyUzNK4nPTFGyUkrJTM_MyU_OTi2KL89JTs0r84yI8Mn19kl0TsorqMxW0lFKTyxJLU-sBKotTsxLScqvAIqVVBakomhWqgUAawcfHg.aKOFkA.k5nQ5BIG2VeVL-j7ILGl13m4I9Y',
  baseURL: 'https://digilocker-sdk.notbot.in',
  gateway: 'sandbox',
  type: 'digilocker',
  authType: 'web'
};

export default function DigiLockerWebView({ onSuccess, onError, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const webViewRef = useRef(null);

  // Generate the DigiLocker URL
  const getDigiLockerUrl = () => {
    return `${DIGILOCKER_CONFIG.baseURL}/?gateway=${DIGILOCKER_CONFIG.gateway}&type=${DIGILOCKER_CONFIG.type}&token=${DIGILOCKER_CONFIG.token}&auth_type=${DIGILOCKER_CONFIG.authType}`;
  };

  // Handle WebView load start
  const handleLoadStart = () => {
    setLoading(true);
    setError(null);
  };

  // Handle WebView load end
  const handleLoadEnd = () => {
    setLoading(false);
  };

  // Handle WebView errors
  const handleError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView error:', nativeEvent);
    setError(nativeEvent.description);
    setLoading(false);
    if (onError) {
      onError(nativeEvent.description);
    }
  };

  // Handle navigation state changes
  const handleNavigationStateChange = (navState) => {
    console.log('Navigation state changed:', navState.url);
    
    // Check for success/error URLs
    if (navState.url.includes('success') || navState.url.includes('callback')) {
      // Extract data from URL parameters
      const urlParams = new URLSearchParams(navState.url.split('?')[1]);
      const successData = {
        status: 'success',
        data: Object.fromEntries(urlParams.entries())
      };
      
      if (onSuccess) {
        onSuccess(successData);
      }
    } else if (navState.url.includes('error') || navState.url.includes('cancel')) {
      const errorData = {
        status: 'error',
        message: 'User cancelled or error occurred'
      };
      
      if (onError) {
        onError(errorData);
      }
    }
  };

  // Handle messages from WebView
  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('Message from WebView:', data);
      
      if (data.type === 'digilocker_success') {
        if (onSuccess) {
          onSuccess(data);
        }
      } else if (data.type === 'digilocker_error') {
        if (onError) {
          onError(data);
        }
      }
    } catch (error) {
      console.log('Non-JSON message from WebView:', event.nativeEvent.data);
    }
  };

  // Inject JavaScript to handle DigiLocker events
  const injectedJavaScript = `
    (function() {
      // Listen for DigiLocker events
      window.addEventListener('message', function(event) {
        if (event.data && event.data.type) {
          window.ReactNativeWebView.postMessage(JSON.stringify(event.data));
        }
      });

      // Listen for URL changes
      let currentUrl = window.location.href;
      const observer = new MutationObserver(function() {
        if (window.location.href !== currentUrl) {
          currentUrl = window.location.href;
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'url_change',
            url: currentUrl
          }));
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      // Override console.log to capture DigiLocker logs
      const originalLog = console.log;
      console.log = function(...args) {
        originalLog.apply(console, args);
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'console_log',
          message: args.join(' ')
        }));
      };

      // Notify that script is loaded
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'script_loaded',
        message: 'DigiLocker integration script loaded'
      }));
    })();
  `;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>DigiLocker Verification</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6c63ff" />
          <Text style={styles.loadingText}>Loading DigiLocker...</Text>
        </View>
      )}

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={24} color="#ff4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              webViewRef.current?.reload();
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: getDigiLockerUrl() }}
        style={styles.webview}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        onNavigationStateChange={handleNavigationStateChange}
        onMessage={handleMessage}
        injectedJavaScript={injectedJavaScript}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff4444',
    alignItems: 'center',
    zIndex: 1000,
  },
  errorText: {
    marginTop: 10,
    fontSize: 14,
    color: '#ff4444',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 15,
    backgroundColor: '#6c63ff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  webview: {
    flex: 1,
  },
});
