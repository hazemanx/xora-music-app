import React, { Component } from 'react';
import { XCircleIcon, RefreshIcon, ExclamationCircleIcon, ChevronDownIcon } from '@heroicons/react/solid';

class ErrorBoundary extends Component {
  state = {
    hasError: false,
    error: null,
    errorInfo: null,
    errorDetails: null,
    showDetails: false,
    errorCount: 0,
    lastError: null,
    errorStack: []
  };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Update error state
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1,
      lastError: new Date().toISOString(),
      errorStack: [...prevState.errorStack, {
        error: error.message,
        timestamp: new Date().toISOString(),
        componentStack: errorInfo.componentStack
      }].slice(-5) // Keep last 5 errors
    }));

    // Log error to service (if available)
    this.logError(error, errorInfo);

    // Save error to localStorage for debugging
    this.saveErrorToStorage(error, errorInfo);
  }

  logError = (error, errorInfo) => {
    // Check if we have a logging service configured
    if (window.errorLoggingService) {
      try {
        window.errorLoggingService.log({
          error: error.toString(),
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          // Add any additional context you want to log
          errorCount: this.state.errorCount
        });
      } catch (loggingError) {
        console.error('Failed to log error:', loggingError);
      }
    }
  };

  saveErrorToStorage = (error, errorInfo) => {
    try {
      const errorLog = JSON.parse(localStorage.getItem('errorLog') || '[]');
      errorLog.push({
        timestamp: new Date().toISOString(),
        error: error.toString(),
        componentStack: errorInfo.componentStack,
        url: window.location.href
      });
      
      // Keep only last 10 errors
      if (errorLog.length > 10) {
        errorLog.shift();
      }
      
      localStorage.setItem('errorLog', JSON.stringify(errorLog));
    } catch (storageError) {
      console.error('Failed to save error to storage:', storageError);
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    });
  };

  handleReportError = () => {
    const errorReport = {
      error: this.state.error?.toString(),
      componentStack: this.state.errorInfo?.componentStack,
      browserInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        cookiesEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine
      },
      timestamp: new Date().toISOString(),
      url: window.location.href,
      errorStack: this.state.errorStack
    };

    // You can implement your error reporting logic here
    console.log('Error Report:', errorReport);

    // Example: Send to an API endpoint
    if (window.errorReportingEndpoint) {
      fetch(window.errorReportingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorReport)
      }).catch(console.error);
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl overflow-hidden">
            {/* Error Header */}
            <div className="bg-red-500 p-6">
              <div className="flex items-center">
                <XCircleIcon className="h-8 w-8 text-white" />
                <h1 className="ml-3 text-xl font-bold text-white">
                  Oops! Something went wrong
                </h1>
              </div>
              <p className="mt-2 text-red-100">
                We apologize for the inconvenience. The application has encountered an unexpected error.
              </p>
            </div>

            {/* Error Actions */}
            <div className="p-6 border-b">
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={this.handleReload}
                  className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <RefreshIcon className="h-5 w-5 mr-2" />
                  Reload Page
                </button>
                <button
                  onClick={this.handleReset}
                  className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={this.handleReportError}
                  className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Report Issue
                </button>
              </div>
            </div>

            {/* Error Details (Collapsible) */}
            <div className="p-6 bg-gray-50">
              <button
                onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ChevronDownIcon 
                  className={`h-5 w-5 transform transition-transform ${
                    this.state.showDetails ? 'rotate-180' : ''
                  }`}
                />
                <span className="ml-2">Technical Details</span>
              </button>

              {this.state.showDetails && (
                <div className="mt-4 space-y-4">
                  {/* Error Message */}
                  <div className="rounded-lg bg-red-50 p-4">
                    <div className="flex">
                      <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">
                          Error Message
                        </h3>
                        <div className="mt-2 text-sm text-red-700">
                          {this.state.error?.toString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Component Stack */}
                  <div className="rounded-lg bg-gray-100 p-4">
                    <h3 className="text-sm font-medium text-gray-800 mb-2">
                      Component Stack
                    </h3>
                    <pre className="text-xs text-gray-600 overflow-x-auto">
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </div>

                  {/* Error History */}
                  {this.state.errorStack.length > 0 && (
                    <div className="rounded-lg bg-gray-100 p-4">
                      <h3 className="text-sm font-medium text-gray-800 mb-2">
                        Recent Errors ({this.state.errorStack.length})
                      </h3>
                      <div className="space-y-2">
                        {this.state.errorStack.map((error, index) => (
                          <div key={index} className="text-xs text-gray-600">
                            <span className="font-medium">
                              {new Date(error.timestamp).toLocaleString()}:
                            </span>
                            <span className="ml-2">{error.error}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;