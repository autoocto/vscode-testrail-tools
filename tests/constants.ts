/**
 * Test Constants and Configuration
 * 
 * Centralized configuration for test behavior and validation.
 * Modify these values to adjust test behavior without changing test code.
 * 
 * @module constants
 */

/**
 * Default pagination limits for testing
 */
export const TEST_PAGINATION = {
    DEFAULT_LIMIT: 10,
    DEFAULT_OFFSET: 0,
    SMALL_LIMIT: 5
} as const;

/**
 * Test data naming patterns
 */
export const TEST_NAMING = {
    PROJECT_PREFIX: 'Test Project',
    SUITE_PREFIX: 'Test Suite',
    SECTION_PREFIX: 'Test Section',
    CASE_PREFIX: 'Test Case',
    GROUP_PREFIX: 'Test Group',
    UPDATED_SUFFIX: 'Updated'
} as const;

/**
 * Test timeouts and delays (in milliseconds)
 */
export const TEST_TIMING = {
    CLEANUP_DELAY: 1000,
    API_RETRY_DELAY: 500,
    MAX_RETRIES: 3
} as const;

/**
 * Test validation thresholds
 */
export const TEST_VALIDATION = {
    MIN_PROJECT_NAME_LENGTH: 3,
    MIN_SUITE_NAME_LENGTH: 3,
    MIN_SECTION_NAME_LENGTH: 3,
    MIN_CASE_TITLE_LENGTH: 3
} as const;

/**
 * Expected field patterns for validation
 */
export const TEST_PATTERNS = {
    ESTIMATE_PATTERN: /\d+/,  // Should contain at least one digit
    EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
} as const;

/**
 * State file path for persisting test data IDs between commands
 */
export const TEST_STATE_FILE = '.test-state.json';
