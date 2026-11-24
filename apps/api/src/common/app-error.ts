import { HttpException, HttpStatus } from '@nestjs/common';
import { ERROR_MESSAGES, type ErrorCode } from '@nukkad/core';

/**
 * An error the apps know how to explain. The body carries a short `code`
 * (see ERROR_MESSAGES in @nukkad/core) next to the usual message.
 */
export class AppError extends HttpException {
  constructor(
    readonly code: ErrorCode,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super({ statusCode: status, code, message: ERROR_MESSAGES[code] }, status);
  }
}
