import { IsNotEmpty, IsOptional, IsIn, IsObject } from 'class-validator';

export class AddSuggestionDto {
  @IsNotEmpty()
  public readonly title: string;

  @IsNotEmpty()
  public readonly description: string;

  @IsOptional()
  @IsIn(['pending', 'in-progress', 'completed', 'rejected'])
  public readonly status?: string;

  @IsOptional()
  @IsObject()
  public readonly category?: { name: string; color: string };
}
