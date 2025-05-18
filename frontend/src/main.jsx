import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { Auth0Provider } from '@auth0/auth0-react';

createRoot(document.getElementById('root')).render(
  <Auth0Provider
    domain="dev-rix5014830kjp6bu.us.auth0.com"
    clientId="imHetka8y4HGCtXNEaKK93WtKD9nP76Y"
    authorizationParams={{
      redirect_uri: window.location.origin,
      audience: `https://dev-rix5014830kjp6bu.us.auth0.com/api/v2/`,
      scope: "openid profile email"
    }}
    useRefreshTokens={true}
    cacheLocation="localstorage"
  >
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Auth0Provider>
)
