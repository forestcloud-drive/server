import { InnerError } from '@app/shared/enums';

const usedErrors = new Set<string>();

export const useInnerError = (code: keyof typeof InnerError): string => {
  if (usedErrors.has(code)) {
    throw new Error(`Inner error code ${code} already used`);
  }

  usedErrors.add(code);

  return InnerError[code];
};
