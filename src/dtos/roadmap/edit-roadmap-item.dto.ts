import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsArray,
  IsNumber,
  Min,
  Max,
  ValidateIf,
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

  @ValidateIf(o => o.priority !== '' && o.priority !== undefined)
  @IsEnum(['low', 'medium', 'high'])
  priority?: string;

  @ValidateIf(o => o.type !== '' && o.type !== undefined)
  @IsEnum(['feature', 'improvement', 'bug-fix', 'announcement'])
  type?: string;

  @ValidateIf(o => o.suggestion !== '' && o.suggestion !== undefined)
  @IsString()
  suggestion?: string; // Suggestion ID

  @ValidateIf(
    o => o.estimatedReleaseDate !== '' && o.estimatedReleaseDate !== undefined
  )
  @IsDateString()
  estimatedReleaseDate?: string;

  @ValidateIf(
    o => o.actualReleaseDate !== '' && o.actualReleaseDate !== undefined
  )
  @IsDateString()
  actualReleaseDate?: string;

  @ValidateIf(o => o.tags !== undefined && o.tags.length > 0)
  @IsArray()
  tags?: string[];

  @ValidateIf(o => o.assignedTo !== '' && o.assignedTo !== undefined)
  @IsString()
  assignedTo?: string; // User ID

  @ValidateIf(o => o.progress !== undefined)
  @IsNumber()
  @Min(0)
  @Max(100)
  progress?: number;

  @ValidateIf(o => o.changelogNotes !== '' && o.changelogNotes !== undefined)
  @IsString()
  changelogNotes?: string;

  @ValidateIf(o => o.order !== undefined)
  @IsNumber()
  order?: number;
}
