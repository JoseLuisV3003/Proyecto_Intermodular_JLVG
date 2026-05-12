export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export function validatePassword(password: string): ValidationResult {
  if (password.length < 8) {
    return {
      isValid: false,
      message: 'La contraseña debe tener al menos 8 caracteres'
    };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      message: 'La contraseña debe contener al menos una letra mayúscula'
    };
  }

  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      message: 'La contraseña debe contener al menos una letra minúscula'
    };
  }

  if (!/[0-9]/.test(password)) {
    return {
      isValid: false,
      message: 'La contraseña debe contener al menos un número'
    };
  }

  return { isValid: true };
}

export function validateEmail(email: string): ValidationResult {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      message: 'Por favor, ingresa un correo electrónico válido'
    };
  }
  return { isValid: true };
}
