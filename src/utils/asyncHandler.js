// Express 4 does not forward rejected async route-handler promises automatically.
// This wrapper keeps controllers readable and sends failures to the central handler.
export const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};
