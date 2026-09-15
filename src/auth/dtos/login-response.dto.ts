export class LoginResponseDTO {
  token!: string;
  user!: {
    id: number;
    nickname: string;
    email: string;
  };
}