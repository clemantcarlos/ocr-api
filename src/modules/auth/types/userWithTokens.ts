import { Tokens } from './tokens.type';

export type UserPublicInfo = {
  id: string;
  name: string;
  email: string;
  createdAt?: Date;
  updatedAt?: Date;
  isDeleted?: boolean;
  deletedAt?: Date | null;
};

export type UserWithTokens = {
  tokens: Tokens;
  user: UserPublicInfo;
};
