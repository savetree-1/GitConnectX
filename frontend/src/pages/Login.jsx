import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Login = () => {
  const navigate = useNavigate();
  const { loginWithRedirect, isAuthenticated } = useAuth0();

  // Redirect to home if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header/>
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-900 via-purple-800 to-indigo-800">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
          <h2 className="text-3xl font-extrabold mb-6 text-center text-gray-800">Welcome Back!</h2>
          <div className="flex flex-col items-center space-y-4">
            <button
              onClick={() => loginWithRedirect()}
              className="w-full bg-[#1737A1] text-white py-3 rounded-lg hover:bg-indigo-700 transition transform hover:-translate-y-1 hover:shadow-md focus:outline-none font-semibold"
            >
              Continue with Auth0
            </button>
            <p className="text-sm text-gray-600">
              Secure login powered by Auth0
            </p>
          </div>
        </div>
      </div>
      <Footer/>
    </div>
  );
};

export default Login;
