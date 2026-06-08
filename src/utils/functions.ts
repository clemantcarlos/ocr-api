import * as bcrypt from 'bcrypt';

export async function hash(password: string) {
  const saltOrRounds = 10;
  return await bcrypt.hash(password, saltOrRounds);
}
