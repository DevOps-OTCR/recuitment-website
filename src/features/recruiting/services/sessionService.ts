import { getCurrentInterviewerId, setCurrentInterviewerId } from '../interviewer-session';
import { recruitingStore } from '../store';
import { canReviewApplicants } from '../utils';
import { type RecruitingUser } from '../types';

const cloneUser = (user: RecruitingUser): RecruitingUser => ({ ...user });

// Session service isolates the temporary mock-user mechanism from page components.
export const sessionService = {
  async listInterviewerUsers(): Promise<RecruitingUser[]> {
    return recruitingStore
      .getSnapshot()
      .users
      .filter((user) => user.active && canReviewApplicants(user))
      .map(cloneUser);
  },

  async getCurrentInterviewerId(): Promise<string> {
    return getCurrentInterviewerId();
  },

  async getCurrentInterviewer(): Promise<RecruitingUser | null> {
    const currentId = getCurrentInterviewerId();
    const currentUser =
      recruitingStore.getSnapshot().users.find((user) => user.id === currentId && user.active) ?? null;
    return currentUser ? cloneUser(currentUser) : null;
  },

  async setCurrentInterviewer(userId: string): Promise<void> {
    setCurrentInterviewerId(userId);
  },
};
