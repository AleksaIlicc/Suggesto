import { IsNotEmpty } from 'class-validator';

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
  public readonly userId: string;
}
