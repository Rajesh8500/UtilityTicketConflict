import { Transform, Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { parseBoundingBox } from './bbox.parser';
import { BoundingBox } from './bbox.parser';

@ValidatorConstraint({ name: 'isBoundingBox', async: false })
class BoundingBoxConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'string') return false;
    try {
      parseBoundingBox(value);
      return true;
    } catch {
      return false;
    }
  }

  defaultMessage(): string {
    return 'bbox must contain four finite WGS84 coordinates in minLng,minLat,maxLng,maxLat order with valid ranges and increasing bounds';
  }
}

export class ConflictQueryDto {
  @IsString({ message: 'must be a string in minLng,minLat,maxLng,maxLat order' })
  @Validate(BoundingBoxConstraint)
  bbox!: string;

  get bboxBounds(): BoundingBox {
    return parseBoundingBox(this.bbox);
  }

  @IsOptional()
  @IsString({ message: 'must be a string' })
  @MaxLength(50, { message: 'must be at most 50 characters' })
  stationCode?: string;

  @IsOptional()
  @IsString({ message: 'must be a string' })
  @MaxLength(50, { message: 'must be at most 50 characters' })
  utilityType?: string;

  @Transform(({ value }) => (value === undefined ? 250 : value))
  @Type(() => Number)
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'radiusMeters must be a finite number' },
  )
  @IsPositive({ message: 'radiusMeters must be greater than zero' })
  radiusMeters = 250;
}
