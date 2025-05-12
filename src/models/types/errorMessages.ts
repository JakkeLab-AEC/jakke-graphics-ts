/**
 * Object for getting the result of running action.
 * If the result is failed, its reason would be given as message.
 */
export type ActionResult = {result: boolean, hasError?: boolean, message?: string}