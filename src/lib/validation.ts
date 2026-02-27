export const validatePassword = (password: string): string | null => {
  if (password.length < 8) return "A senha deve ter no mínimo 8 caracteres";
  if (!/[a-zA-Z]/.test(password)) return "A senha deve conter pelo menos 1 letra";
  if (!/[0-9]/.test(password)) return "A senha deve conter pelo menos 1 número";
  return null;
};
