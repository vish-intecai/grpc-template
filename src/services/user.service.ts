import { userPostgresRepo } from '@/repositories/postgres/user.repo';

export class UserService {
  static async createUser(name: string, email: string) {
    // const existing = await userPostgresRepo.findUserByEmail(email);

    return userPostgresRepo.registerUser({ name, email });
  }
}
