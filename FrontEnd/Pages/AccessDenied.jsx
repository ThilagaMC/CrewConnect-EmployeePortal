import { useNavigate } from 'react-router-dom';
import { FaLock, FaEnvelope, FaArrowLeft } from 'react-icons/fa';
import { Button, Container, Row, Col, Card } from 'react-bootstrap';

const AccessDeniedPage = () => {
  const navigate = useNavigate();
  const adminEmail = 'admin@example.com';
  const supportEmail = 'support@example.com';

  const handleContactAdmin = () => {
    window.location.href = `mailto:${adminEmail}?subject=Access Request&body=Hello Admin,%0D%0A%0D%0AI need access to...`;
  };

  const handleGoBack = () => {
    navigate(-1); // Go back to previous page
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <Container fluid className="vh-100 d-flex align-items-center justify-content-center bg-light">
      <Card className="shadow-lg p-4" style={{ maxWidth: '600px', width: '100%' }}>
        <Card.Body className="text-center">
          <div className="mb-4">
            <FaLock size={64} className="text-danger mb-3" />
            <h1 className="text-danger fw-bold mb-3">Access Denied</h1>
            <p className="lead text-muted">
              You don&apos;t have permission to access this page. Please contact your administrator if you believe this is an error.
            </p>
          </div>

          <Row className="g-3 mb-4">
            <Col md={6}>
              <Button 
                variant="outline-primary" 
                className="w-100 d-flex align-items-center justify-content-center gap-2"
                onClick={handleGoBack}
              >
                <FaArrowLeft /> Go Back
              </Button>
            </Col>
            <Col md={6}>
              <Button 
                variant="primary" 
                className="w-100 d-flex align-items-center justify-content-center gap-2"
                onClick={handleGoToDashboard}
              >
                Go to Dashboard
              </Button>
            </Col>
          </Row>

          <div className="border-top pt-4">
            <h5 className="mb-3">Need help?</h5>
            <Button 
              variant="outline-secondary" 
              className="mb-2 d-flex align-items-center justify-content-center gap-2 mx-auto"
              onClick={handleContactAdmin}
            >
              <FaEnvelope /> Contact Admin ({adminEmail})
            </Button>
            <p className="small text-muted mt-2">
              For urgent issues, you can also contact support at {supportEmail}
            </p>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AccessDeniedPage;