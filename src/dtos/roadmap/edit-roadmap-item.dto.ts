import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
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
  status?: 'planned' | 'in-progress' | 'completed' | 'cancelled';

  @ValidateIf(o => o.priority !== '' && o.priority !== undefined)
  @IsEnum(['low', 'medium', 'high'])
  priority?: 'low' | 'medium' | 'high';

  @ValidateIf(o => o.type !== '' && o.type !== undefined)
  @IsEnum(['feature', 'improvement', 'bug-fix', 'announcement'])
  type?: 'feature' | 'improvement' | 'bug-fix' | 'announcement';

  @ValidateIf(o => o.suggestion !== '' && o.suggestion !== undefined)
  @IsString()
  suggestion?: string; // Suggestion ID

  @ValidateIf(
    o => o.estimatedReleaseDate !== '' && o.estimatedReleaseDate !== undefined
  )
  @IsDateString()
  estimatedReleaseDate?: string;
}
