const CURRENT_INTERVIEWER_KEY = 'otcr-tech-current-interviewer-id';

export const DEFAULT_CURRENT_INTERVIEWER_ID = 'user-pm-ethan';

export const getCurrentInterviewerId = () => {
  if (typeof window === 'undefined') return DEFAULT_CURRENT_INTERVIEWER_ID;
  return window.localStorage.getItem(CURRENT_INTERVIEWER_KEY) ?? DEFAULT_CURRENT_INTERVIEWER_ID;
};

export const setCurrentInterviewerId = (userId: string) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CURRENT_INTERVIEWER_KEY, userId);
};
