// Custom error class for centralized API error handling
class ApiError extends Error {
    /**
     * @param {number} statusCode - HTTP status code (e.g., 400, 404, 500)
     * @param {string} message - Human-readable error message for developers or users
     * @param {Array} errors - Optional array of error details (e.g., validation errors)
     * @param {string} stack - Optional custom stack trace (useful for logging in non-production)
     */
    //these are the arguments that passed down in a function
    constructor(statusCode,message = "Something went wrong",errors = [],stack = ""){
        // Call the built-in Error constructor with the custom message
        super(message);

        // Set the name of the error (useful for logging and debugging)
        this.name = this.constructor.name;

        // HTTP status code to return in the response
        this.statusCode = statusCode;

        // Additional array of detailed errors (e.g., for form validation)
        this.errors = errors;

        // Optional data (can be used to return extra context; kept null by default)
        this.data = null;

        // Optionally set a custom stack trace (useful for preserving error origin)
        if (stack) {
            this.stack = stack;
        } else {
            // Capture the original stack trace if not provided
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export { ApiError };
