export const logInfo = (message: string, data?: any) => {
  console.log(`info: ${message}`, data ? data : '');
};

export const logError = (error: Error, context: string) => {
  console.error(`error: ${context}: ${error.message}`, {
    context,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
};

export const logWarning = (message: string, data?: any) => {
  console.warn(`warning: ${message}`, data ? data : '');
};