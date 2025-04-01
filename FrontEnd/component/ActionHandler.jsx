import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const ActionHandler = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  const params = {
    employeeId: searchParams.get('employeeId'),
    requestIndex: searchParams.get('requestIndex'),
    status: searchParams.get('status'),
    token: searchParams.get('token')
  };

  useEffect(() => {
    const processAction = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Validate parameters
        if (!params.employeeId || !params.requestIndex || !params.status || !params.token) {
          throw new Error('Missing required parameters in URL');
        }

        // Create query string from params
        const queryString = new URLSearchParams(params).toString();
        const url = `http://localhost:5000/leave-requests/process-action?${queryString}`;

        // Set up abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        // Make API call with fetch
        const response = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          },
        });

        clearTimeout(timeoutId);

        // Parse response
        const responseData = await response.json();
        
        // Debug information
        const debugData = {
          requestParams: params,
          responseStatus: response.status,
          responseData,
          responseHeaders: Object.fromEntries(response.headers.entries())
        };
        setDebugInfo(debugData);
        console.log('API Debug:', debugData);

        // Handle response
        if (response.ok) {
          if (responseData?.success) {
            navigate(`/leave/success/${params.status.toLowerCase()}`, {
              state: { 
                fromAction: true,
                debugData
              }
            });
          } else {
            throw new Error(responseData.message || 'Action failed on server');
          }
        } else {
          throw new Error(
            responseData?.message || 
            `Server returned status ${response.status}`
          );
        }

      } catch (error) {
        console.error('Full error:', error);
        setError(error);
        
        const errorMessage = error.name === 'AbortError' 
          ? 'Request timed out. Please try again.'
          : error.message || 'Failed to process leave request';

        navigate('/leave/error', {
          state: { 
            error: errorMessage,
            params,
            debugInfo,
            errorDetails: {
              name: error.name,
              stack: error.stack
            }
          }
        });
      } finally {
        setLoading(false);
      }
    };

    processAction();
  }, [navigate, params]);

  // Debug view
  if (error || debugInfo) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          <h4>Debug Information</h4>
          <h5>Error Details:</h5>
          <pre>{JSON.stringify(error?.toString(), null, 2)}</pre>
          
          <h5 className="mt-3">Request Parameters:</h5>
          <pre>{JSON.stringify(params, null, 2)}</pre>
          
          <h5 className="mt-3">API Response:</h5>
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          
          {error?.stack && (
            <>
              <h5 className="mt-3">Stack Trace:</h5>
              <pre>{error.stack}</pre>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="text-center p-4 bg-white rounded shadow-sm" style={{ maxWidth: '400px' }}>
        {loading ? (
          <>
            <div className="spinner-border text-primary mb-3" 
                 style={{ width: '3rem', height: '3rem' }} 
                 role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <h4 className="mb-3">Processing Leave Request</h4>
            <p className="text-muted">
              Please wait while we {params.status?.toLowerCase()} this request...
            </p>
            <div className="progress mt-3" style={{ height: '4px' }}>
              <div className="progress-bar progress-bar-striped progress-bar-animated" 
                   style={{ width: '100%' }} />
            </div>
          </>
        ) : (
          <div className="alert alert-info">
            <p>Operation completed successfully!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActionHandler;