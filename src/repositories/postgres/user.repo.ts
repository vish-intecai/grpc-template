import { postgresDataSource } from '@/config/database/postgres';
import { User } from '@/entities';

export const userRepo = postgresDataSource.getRepository(User);

export class userPostgresRepo {
  static async findUserByEmail(email: string) {
    return userRepo.findOne({ where: { email } });
  }

  static async registerUser(data: Partial<User>) {
    const user = userRepo.create(data);
    return userRepo.save(user);
  }
}
