import { Role } from 'src/users/enums/role.enum';
import { PermissionType } from '../authorization/permission.type';

export interface ActiveUserData {
  /**
   * The "subject" of the token. The value of this property is user ID
   * that grant this token.
   */
  sub: number;

  /**
   * The subject's (user) email.
   */
  email: string;

  /**
   * The subject's (user) role.
   *  - `regular`
   *  - `admin`
   *  - `super-admin`
   * */
  role: Role;

  /**
   * The subject's (user) permissions.
   * - `create_coffee`
   * - `update_coffee`
   * - `delete_coffee`
   * */
  permissions?: PermissionType[];
}
