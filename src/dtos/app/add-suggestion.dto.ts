import { IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class AddSuggestionDto {
  @IsNotEmpty()
  public readonly title: string;

  @IsNotEmpty()
  public readonly description: string;

  @IsOptional()
  @IsIn(['pending', 'in-progress', 'completed', 'rejected'])
  public readonly status?: string;

  @IsOptional()
  public readonly categories?: string[];
}
