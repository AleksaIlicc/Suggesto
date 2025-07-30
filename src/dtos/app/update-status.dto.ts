import { IsNotEmpty, IsIn } from 'class-validator';

export class UpdateStatusDto {
  @IsNotEmpty()
  @IsIn(['pending', 'in-progress', 'completed', 'rejected'])
  public readonly status: string;
}
