import { IsNotEmpty } from 'class-validator';

export class AddSuggestionDto {
  @IsNotEmpty()
  public readonly title: string;

  @IsNotEmpty()
  public readonly description: string;
}
