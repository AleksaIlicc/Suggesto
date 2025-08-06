import { IsNotEmpty, IsOptional, IsBoolean, IsArray } from 'class-validator';

export class EditAppDto {
  @IsNotEmpty()
  public readonly name: string;

  @IsNotEmpty()
  public readonly description: string;

  @IsNotEmpty()
  public readonly headerColor: string;

  @IsNotEmpty()
  public readonly headerTextColor: string;

  @IsNotEmpty()
  public readonly buttonColor: string;

  @IsNotEmpty()
  public readonly buttonTextColor: string;

  @IsNotEmpty()
  public readonly backButtonColor: string;

  @IsNotEmpty()
  public readonly backgroundColor: string;

  @IsNotEmpty()
  public readonly suggestionsHeaderColor: string;

  @IsNotEmpty()
  public readonly suggestionTextColor: string;

  @IsNotEmpty()
  public readonly suggestionCardBgColor: string;

  @IsNotEmpty()
  public readonly voteButtonBgColor: string;

  @IsNotEmpty()
  public readonly voteButtonTextColor: string;

  @IsNotEmpty()
  public readonly suggestionMetaColor: string;

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
