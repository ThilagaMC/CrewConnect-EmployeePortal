// src/pages/leave/ErrorPage.js
import { useSearchParams } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

const ErrorPage = () => {
  const [searchParams] = useSearchParams();
  const message = searchParams.get('message'); 

  return (
    <div className="container-fluid d-flex vh-100 align-items-center justify-content-center bg-light">
      <div className="text-center p-5 bg-white rounded-3 shadow" style={{ maxWidth: '500px' }}>
        <AlertCircle className="text-warning mb-4" size={80} strokeWidth={1.5} />
        <h2 className="text-warning mb-3">Error Processing Request or the Request already accepted/Rejected </h2>
        <p className="lead">{message || 'An unknown error occurred.'}</p>
        <p className="text-muted">Thank You</p>
      </div>
    </div>
  );
};

export default ErrorPage;