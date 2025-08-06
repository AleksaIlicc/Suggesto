import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsArray,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export class EditRoadmapItemDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['planned', 'in-progress', 'completed', 'cancelled'])
  @IsOptional()
  status?: string;

  @IsEnum(['low', 'medium', 'high'])
  @IsOptional()
  priority?: string;

  @IsEnum(['feature', 'improvement', 'bug-fix', 'announcement'])
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  suggestion?: string; // Suggestion ID

  @IsDateString()
  @IsOptional()
  estimatedReleaseDate?: string;

  @IsDateString()
  @IsOptional()
  actualReleaseDate?: string;

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  assignedTo?: string; // User ID

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  progress?: number;

  @IsString()
  @IsOptional()
  changelogNotes?: string;

  @IsNumber()
  @IsOptional()
  order?: number;
}
