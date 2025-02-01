import {
  IsEmail,
  IsNotEmpty,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  ALPHABETS_AND_SPACE_REGEX,
  USERNAME_REGEX,
} from '../../utils/regex.constants';

export class CreateUserDto {
  @Matches(ALPHABETS_AND_SPACE_REGEX, {
    message: 'The first name field must contain only characters.',
  })
  @MaxLength(20, {
    message: 'The first name field must contain a maximum of 20 characters.',
  })
  @MinLength(2, {
    message: 'The first name field must contain at least 2 characters.',
  })
  @IsNotEmpty({ message: 'The first name field must not be empty.' })
  public readonly firstName: string;

  @Matches(ALPHABETS_AND_SPACE_REGEX, {
    message: 'The last name field must contain only characters.',
  })
  @MaxLength(20, {
    message: 'The last name field must contain a maximum of 20 characters.',
  })
  @MinLength(2, {
    message: 'The last name field must contain at least 2 characters.',
  })
  @IsNotEmpty({ message: 'The last name field must not be empty.' })
  public readonly lastName: string;

  @Matches(USERNAME_REGEX, {
    message:
      'The username field is not valid. Allowed characters are: a-z, 0-9, _ and . (dot).',
  })
  @MaxLength(20, {
    message: 'The username field must contain a maximum of 20 characters.',
  })
  @MinLength(3, {
    message: 'The username field must contain at least 3 characters.',
  })
  @IsNotEmpty({ message: 'The username field must not be empty.' })
  public readonly username: string;

  @IsEmail({}, { message: 'Please enter a valid email address.' })
  @MaxLength(100, {
    message:
      'The email address field must contain a maximum of 100 characters.',
  })
  @IsNotEmpty({ message: 'The email address field must not be empty.' })
  public readonly email: string;

  @MaxLength(32, {
    message: 'The password field must contain a maximum of 32 characters.',
  })
  @MinLength(6, {
    message: 'The password field must contain at least 6 characters.',
  })
  @IsNotEmpty({ message: 'The password field must not be empty.' })
  public readonly password: string;
}
