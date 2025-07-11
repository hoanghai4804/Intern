export const ENV = {
    API_URL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
    VERSION: process.env.REACT_APP_VERSION || '1.0.0',
    IS_DEV: process.env.NODE_ENV === 'development'
  };