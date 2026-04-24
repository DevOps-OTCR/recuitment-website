export type AdminUserRole = 'partner' | 'pm' | 'lc' | 'consultant' | 'applicant' | 'admin';

export type AdminPermission =
  | 'view_all_applicants'
  | 'decide_round_1'
  | 'decide_round_2'
  | 'assign_interviewers'
  | 'view_assigned_interviews'
  | 'submit_feedback'
  | 'see_relative_score'
  | 'see_database'
  | 'view_own_profile'
  | 'view_own_interview_data';

export interface AdminAuthenticatedUser {
  id: number;
  email: string;
  name: string | null;
  role: AdminUserRole;
  active: boolean;
  permissions: AdminPermission[];
}

export const hasAdminPermission = (
  user: Pick<AdminAuthenticatedUser, 'permissions'> | null | undefined,
  permission: AdminPermission
) => Boolean(user?.permissions.includes(permission));

export const pathForRole = (role: AdminUserRole | null | undefined) => {
  switch (role) {
    case 'applicant':
      return '/applicant';
    case 'consultant':
      return '/consultant';
    case 'lc':
      return '/lc';
    case 'pm':
      return '/pm';
    case 'partner':
    case 'admin':
      return '/partner';
    default:
      return '/sign-in';
  }
};

export const defaultAppPathForUser = (user: Pick<AdminAuthenticatedUser, 'role'> | null | undefined) =>
  pathForRole(user?.role);

export const defaultManagePathForUser = defaultAppPathForUser;
