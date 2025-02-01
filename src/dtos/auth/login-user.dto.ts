import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';

export class LoginUserDto {
  @IsEmail({}, { message: 'Please enter a valid email address.' })
  @MaxLength(100, {
    message:
      'The email address field must contain a maximum of 100 characters.',
  })
  @IsNotEmpty({ message: 'The email address field must not be empty.' })
  public readonly email: string;

  @IsNotEmpty({ message: 'The password field must not be empty.' })
  public readonly password: string;
}
