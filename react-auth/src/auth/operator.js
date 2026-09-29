/**
 * OPS1: who sees Gait's operator surfaces (Security Command, Observatory,
 * Exercises, Learn, the platform Issues and Security Team pages).
 *
 * Only the server decides: an operator is an active superuser with two-step
 * on, sent as the read-only `is_gait_operator` flag on the user object
 * (validate-session, whoami, register). A missing flag means "not an
 * operator". There is no fallback to is_staff or is_superuser; is_staff alone
 * grants nothing any more.
 *
 * This only hides entry points and avoids broken pages. Every operator API
 * answers 403 to non-operators on its own.
 */
export function isGaitOperator(user) {
    return user?.is_gait_operator === true;
}
