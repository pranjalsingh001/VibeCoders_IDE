// validation.ts
// -------------
// Validation utilities for form fields and planning questions
// Provides real-time validation with helpful error messages

export interface ValidationRule {
  type: 'required' | 'email' | 'url' | 'minLength' | 'maxLength' | 'pattern'
  value?: any
  message: string
}

export interface ValidationResult {
  isValid: boolean
  error?: string
  suggestion?: string
}

export interface FieldValidation {
  rules: ValidationRule[]
  validateOnChange?: boolean
}

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// URL validation regex
const URL_REGEX = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/

/**
 * Validates a single field value against its validation rules
 */
export function validateField(value: string, validation: FieldValidation): ValidationResult {
  const trimmedValue = value.trim()
  
  for (const rule of validation.rules) {
    const result = validateRule(trimmedValue, rule)
    if (!result.isValid) {
      return result
    }
  }
  
  return { isValid: true }
}

/**
 * Validates a single rule against a value
 */
function validateRule(value: string, rule: ValidationRule): ValidationResult {
  switch (rule.type) {
    case 'required':
      if (!value || value.length === 0) {
        return {
          isValid: false,
          error: rule.message,
          suggestion: 'This field is required. Please provide an answer.'
        }
      }
      break
      
    case 'email':
      if (value && !EMAIL_REGEX.test(value)) {
        return {
          isValid: false,
          error: rule.message,
          suggestion: 'Please enter a valid email address (e.g., user@example.com)'
        }
      }
      break
      
    case 'url':
      if (value && !URL_REGEX.test(value)) {
        return {
          isValid: false,
          error: rule.message,
          suggestion: 'Please enter a valid URL starting with http:// or https://'
        }
      }
      break
      
    case 'minLength':
      if (value && value.length < rule.value) {
        return {
          isValid: false,
          error: rule.message,
          suggestion: `Please provide at least ${rule.value} characters. Current: ${value.length}`
        }
      }
      break
      
    case 'maxLength':
      if (value && value.length > rule.value) {
        return {
          isValid: false,
          error: rule.message,
          suggestion: `Please keep your answer under ${rule.value} characters. Current: ${value.length}`
        }
      }
      break
      
    case 'pattern':
      if (value && !new RegExp(rule.value).test(value)) {
        return {
          isValid: false,
          error: rule.message,
          suggestion: 'Please check the format of your answer'
        }
      }
      break
  }
  
  return { isValid: true }
}

/**
 * Validates multiple fields at once
 */
export function validateFields(
  values: Record<string, string>,
  validations: Record<string, FieldValidation>
): Record<string, ValidationResult> {
  const results: Record<string, ValidationResult> = {}
  
  for (const [fieldName, validation] of Object.entries(validations)) {
    const value = values[fieldName] || ''
    results[fieldName] = validateField(value, validation)
  }
  
  return results
}

/**
 * Checks if all validation results are valid
 */
export function isFormValid(validationResults: Record<string, ValidationResult>): boolean {
  return Object.values(validationResults).every(result => result.isValid)
}

/**
 * Gets helpful suggestions for common validation errors with context-aware recommendations
 */
export function getValidationSuggestion(error: string, fieldType?: string, currentValue?: string): string {
  const baseError = error.toLowerCase()
  
  // Context-aware suggestions based on field type
  if (fieldType) {
    switch (fieldType) {
      case 'email':
        if (baseError.includes('required')) {
          return 'Please enter your email address to continue.'
        }
        if (baseError.includes('email')) {
          if (currentValue && !currentValue.includes('@')) {
            return 'Email addresses must contain an @ symbol (e.g., user@example.com)'
          }
          if (currentValue && !currentValue.includes('.')) {
            return 'Email addresses need a domain extension (e.g., user@example.com)'
          }
          return 'Please enter a valid email address like user@example.com'
        }
        break
        
      case 'url':
        if (baseError.includes('url')) {
          if (currentValue && !currentValue.startsWith('http')) {
            return 'URLs must start with http:// or https:// (e.g., https://example.com)'
          }
          return 'Please enter a complete URL including http:// or https://'
        }
        break
        
      case 'password':
        if (baseError.includes('minlength')) {
          return 'Choose a stronger password with at least 8 characters'
        }
        break
        
      case 'description':
        if (baseError.includes('minlength')) {
          return 'Please provide more details to help us understand your needs better'
        }
        if (baseError.includes('maxlength')) {
          return 'Please keep your description concise and focused on key points'
        }
        break
    }
  }
  
  // Generic suggestions based on error type
  const suggestions: Record<string, string> = {
    'required': 'This field is required. Please provide an answer.',
    'email': 'Please enter a valid email address (e.g., user@example.com)',
    'url': 'Please enter a valid URL starting with http:// or https://',
    'minlength': 'Please provide more details in your answer',
    'maxlength': 'Please keep your answer more concise',
    'pattern': 'Please check the format of your answer'
  }
  
  for (const [key, suggestion] of Object.entries(suggestions)) {
    if (baseError.includes(key)) {
      return suggestion
    }
  }
  
  return 'Please check your answer and try again'
}

/**
 * Enhanced validation with real-time feedback and suggestions
 */
export function validateFieldWithFeedback(
  value: string, 
  validation: FieldValidation, 
  fieldType?: string
): ValidationResult & { 
  feedback?: string
  severity?: 'error' | 'warning' | 'info'
} {
  const result = validateField(value, validation)
  
  if (!result.isValid && result.error) {
    return {
      ...result,
      suggestion: getValidationSuggestion(result.error, fieldType, value),
      severity: 'error'
    }
  }
  
  // Provide positive feedback for valid fields
  if (result.isValid && value.trim()) {
    let feedback = ''
    
    switch (fieldType) {
      case 'email':
        feedback = 'Valid email address ✓'
        break
      case 'url':
        feedback = 'Valid URL ✓'
        break
      case 'description':
        if (value.length > 50) {
          feedback = 'Good detailed description ✓'
        } else {
          feedback = 'Valid description ✓'
        }
        break
      default:
        if (value.length > 20) {
          feedback = 'Good detailed answer ✓'
        }
    }
    
    return {
      ...result,
      feedback,
      severity: 'info'
    }
  }
  
  return result
}

/**
 * Common validation configurations for planning questions
 */
export const commonValidations = {
  required: (message = 'This field is required'): FieldValidation => ({
    rules: [{ type: 'required', message }]
  }),
  
  email: (required = false): FieldValidation => ({
    rules: [
      ...(required ? [{ type: 'required' as const, message: 'Email is required' }] : []),
      { type: 'email' as const, message: 'Please enter a valid email address' }
    ]
  }),
  
  url: (required = false): FieldValidation => ({
    rules: [
      ...(required ? [{ type: 'required' as const, message: 'URL is required' }] : []),
      { type: 'url' as const, message: 'Please enter a valid URL' }
    ]
  }),
  
  text: (minLength = 0, maxLength = 1000, required = true): FieldValidation => ({
    rules: [
      ...(required ? [{ type: 'required' as const, message: 'This field is required' }] : []),
      ...(minLength > 0 ? [{ type: 'minLength' as const, value: minLength, message: `Minimum ${minLength} characters required` }] : []),
      { type: 'maxLength' as const, value: maxLength, message: `Maximum ${maxLength} characters allowed` }
    ]
  }),
  
  description: (): FieldValidation => ({
    rules: [
      { type: 'required', message: 'Please provide a description' },
      { type: 'minLength', value: 10, message: 'Please provide at least 10 characters' },
      { type: 'maxLength', value: 500, message: 'Please keep description under 500 characters' }
    ]
  })
}