import { IsNotEmpty, IsOptional, IsBoolean, IsArray } from 'class-validator';

export class AddAppDto {
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

  @IsOptional()
  public readonly isPublic?: string;

  @IsOptional()
  public readonly allowAnonymousVotes?: string;

  @IsOptional()
  public readonly allowPublicSubmissions?: string;

  @IsOptional()
  public readonly enablePublicRoadmap?: string;
}
