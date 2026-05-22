export const handleApiError = (error, defaultMessage = 'Something went wrong') => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return defaultMessage;
};

export const getErrorStatus = (error) => {
  return error.response?.status || null;
};

export const isUnauthorized = (error) => {
  return error.response?.status === 401;
};

export const isForbidden = (error) => {
  return error.response?.status === 403;
};

export const isNotFound = (error) => {
  return error.response?.status === 404;
};

export const isValidationError = (error) => {
  return error.response?.status === 400;
};
