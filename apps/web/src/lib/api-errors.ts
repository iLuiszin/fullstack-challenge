import { AxiosError } from 'axios';

export const apiErrorMessage = (
  error: unknown,
  fallback = 'Ocorreu um erro',
): string => {
  if (error instanceof AxiosError && error.response?.data) {
    const { message } = error.response.data;

    if (typeof message === 'string') {
      return message;
    }

    if (Array.isArray(message) && message.length > 0) {
      return message[0];
    }
  }

  if (error instanceof AxiosError && error.code) {
    if (error.code === 'ETIMEDOUT') {
      return 'Tempo de conexão esgotado';
    }

    if (error.code === 'ECONNREFUSED') {
      return 'Não foi possível conectar ao servidor';
    }

    if (error.code === 'ECONNRESET') {
      return 'Conexão perdida com o servidor';
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

export const apiErrorCode = (error: unknown): string | undefined => {
  if (error instanceof AxiosError && error.response?.data) {
    const { code } = error.response.data;

    if (typeof code === 'string') {
      return code;
    }
  }

  return undefined;
};
