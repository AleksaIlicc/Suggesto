import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class AddCommentDto {
  @IsNotEmpty({ message: 'Comment text is required' })
  @IsString({ message: 'Comment text must be a string' })
  @MinLength(1, { message: 'Comment text must be at least 1 character long' })
  @MaxLength(1000, { message: 'Comment text must not exceed 1000 characters' })
  text: string;
}
