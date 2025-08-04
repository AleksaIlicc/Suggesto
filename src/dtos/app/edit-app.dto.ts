import { IsNotEmpty, IsOptional, IsBoolean, IsArray } from 'class-validator';

export class EditAppDto {
  @IsNotEmpty()
  public readonly name: string;

  @IsNotEmpty()
  public readonly description: string;

  @IsNotEmpty()
  public readonly headerColor: string;

  @IsNotEmpty()
  public readonly buttonColor: string;

  @IsNotEmpty()
  public readonly backgroundColor: string;

  @IsOptional()
  public readonly logo?: string;

  @IsOptional()
  @IsArray()
  public readonly customCategories?: { name: string; color: string }[];

  @IsOptional()
  public readonly defaultCategoriesEnabled?: string;
}
