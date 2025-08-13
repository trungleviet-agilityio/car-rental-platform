import { IsString, IsOptional, IsIn, IsNotEmpty } from 'class-validator';

export class KycPresignDto {
  @IsString()
  @IsNotEmpty()
  cognitoSub!: string;

  @IsString()
  @IsOptional()
  contentType?: string;
}

export class KycValidateDto {
  @IsString()
  @IsNotEmpty()
  cognitoSub!: string;

  @IsString()
  @IsNotEmpty()
  key!: string;
}

export class KycCallbackDto {
  @IsString()
  @IsNotEmpty()
  cognitoSub!: string;

  @IsString()
  @IsNotEmpty()
  key!: string;

  @IsIn(['verified', 'rejected'])
  status!: 'verified' | 'rejected';
}
