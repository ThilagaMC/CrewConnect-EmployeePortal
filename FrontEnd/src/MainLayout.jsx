
import { Outlet } from 'react-router-dom';
import Navbar from './navbar.jsx';

const MainLayout = () => {
  return (
    <div className="app-container" style={{ 
      backgroundColor: "#D9ECF5", 
      minHeight: "100vh",
      display: "flex"
    }}>
      <Navbar />
      <div className="content-area" style={{
        flex: 1,
        padding: "20px",
        transition: "margin-left 0.3s ease"
      }}>
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;