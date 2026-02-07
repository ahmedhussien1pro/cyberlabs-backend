import { IsUUID, IsNotEmpty } from 'class-validator';

export class EnrollCourseDto {
  @IsNotEmpty()
  @IsUUID()
  courseId: string;
}
