import { Navigate } from "react-router-dom";
import PropTypes from "prop-types";

const ProtectedRoute = ({ children }) => {
  const authStatus = localStorage.getItem("authStatus");

  if (authStatus !== "true") {
    return <Navigate to="/" />; // Redirect to login if not authenticated
  }

  return children; // Render the wrapped components (Navbar + Content)
};

// PropTypes validation to ensure children are passed correctly
ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ProtectedRoute;
