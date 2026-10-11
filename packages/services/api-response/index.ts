export class ApiResponse {
  static ok<T>(message: string, data: T) {
    return {
      success: true as const,
      message,
      data,
    };
  }

  static created<T>(message: string, data: T) {
    return ApiResponse.ok(message, data);
  }
}

export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
  success: boolean;

  constructor(status: number, message: string) {
    super(message);
    this.success = false;
    this.statusCode = status;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static notFound(msg = "Not Found") {
    return new ApiError(404, msg);
  }
  static badRequest(msg = "Bad Request") {
    return new ApiError(400, msg);
  }
  static unAuthorized(msg = "Unauthorized") {
    return new ApiError(401, msg);
  }
  static forbidden(msg = "Forbidden") {
    return new ApiError(403, msg);
  }
  static conflict(msg = "Conflict") {
    return new ApiError(409, msg);
  }
  static tooManyRequests(msg = "Too Many Requests") {
    return new ApiError(429, msg);
  }
  static internal(msg = "Internal Server Error") {
    return new ApiError(500, msg);
  }
}
