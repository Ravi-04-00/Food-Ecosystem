import React from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('Fast Delivery ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

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
    window.location.href = '/';
  };

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#FFF8E8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 16px',
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
        }}>
          <div style={{
            maxWidth: '560px',
            width: '100%',
            background: '#FFFFFF',
            border: '3px solid #211A17',
            borderRadius: '24px',
            boxShadow: '0 8px 0 #211A17',
            padding: '36px 28px',
            textAlign: 'center'
          }}>
            {/* Warning Icon Badge */}
            <div style={{
              width: '76px',
              height: '76px',
              borderRadius: '22px',
              background: '#FFF0F0',
              border: '2.5px solid #211A17',
              boxShadow: '0 3px 0 #211A17',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
              color: '#22C55E'
            }}>
              <AlertTriangle size={38} strokeWidth={2.5} />
            </div>

            <span style={{
              background: '#FFF0E6',
              color: '#22C55E',
              border: '1.5px solid #22C55E',
              borderRadius: '999px',
              padding: '3px 12px',
              fontSize: '0.75rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              display: 'inline-block',
              marginBottom: '10px'
            }}>
              Ecosystem Guard Active
            </span>

            <h1 style={{
              fontSize: '1.7rem',
              fontWeight: 900,
              color: '#211A17',
              margin: '0 0 10px 0',
              lineHeight: 1.2
            }}>
              Oops! Something went unexpected
            </h1>

            <p style={{
              fontSize: '0.9rem',
              color: '#6E6259',
              lineHeight: 1.6,
              maxWidth: '440px',
              margin: '0 auto 24px auto'
            }}>
              Fast Delivery caught an unexpected page issue and prevented the entire app from blanking. 
              Your active order, cart, and credentials remain completely safe.
            </p>

            {/* Quick Actions */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={this.handleReload}
                style={{
                  background: '#22C55E',
                  color: '#FFFFFF',
                  border: '2px solid #211A17',
                  borderRadius: '12px',
                  padding: '12px 22px',
                  fontWeight: 900,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  boxShadow: '0 3px 0 #211A17',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <RefreshCw size={16} />
                <span>Reload Page</span>
              </button>

              <button
                onClick={this.handleReset}
                style={{
                  background: '#FFFFFF',
                  color: '#211A17',
                  border: '2px solid #211A17',
                  borderRadius: '12px',
                  padding: '12px 20px',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  boxShadow: '0 3px 0 #211A17',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Home size={16} />
                <span>Return to Home</span>
              </button>
            </div>

            {/* Collapsible Error Diagnostics */}
            <div style={{ marginTop: '28px', borderTop: '1.5px dashed #EADBCE', paddingTop: '18px' }}>
              <button
                onClick={this.toggleDetails}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6E6259',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>{this.state.showDetails ? 'Hide Diagnostics' : 'Show Error Diagnostics'}</span>
                {this.state.showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {this.state.showDetails && (
                <div style={{
                  marginTop: '12px',
                  padding: '14px',
                  borderRadius: '12px',
                  background: '#0B1230',
                  color: '#FFC83D',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  textAlign: 'left',
                  maxHeight: '180px',
                  overflowY: 'auto',
                  border: '1.5px solid #211A17'
                }}>
                  <div style={{ color: '#22C55E', fontWeight: 'bold', marginBottom: '6px' }}>
                    {this.state.error?.toString()}
                  </div>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#EADBCE' }}>
                    {this.state.errorInfo?.componentStack}
                  </pre>
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
