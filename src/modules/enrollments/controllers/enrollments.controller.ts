import {
  Controller,
  Get,
  Post,
  Delete,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { EnrollmentsService } from '../services';
import { EnrollCourseDto, UpdateProgressDto, EnrollmentQueryDto } from '../dto';
import { JwtAuthGuard } from '../../../common/guards';
import { CurrentUser } from '../../../common/decorators';

@Controller('enrollments')
@UseGuards(JwtAuthGuard)
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  /**
   * ⭐ IMPORTANT: Static routes MUST come BEFORE dynamic routes
   */

  /**
   * Get my enrollments
   * GET /api/enrollments
   * ⭐ This MUST come first (static route)
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getMyEnrollments(
    @CurrentUser('id') userId: string,
    @Query() query: EnrollmentQueryDto,
  ) {
    console.log('🔍 Controller - User ID:', userId);
    console.log('🔍 Controller - Query:', query);

    const result = await this.enrollmentsService.getUserEnrollments(
      userId,
      query,
    );

    console.log('🔍 Controller - Result:', result);

    return {
      success: true,
      ...result,
    };
  }

  /**
   * Enroll in a course
   * POST /api/enrollments
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async enrollInCourse(
    @CurrentUser('id') userId: string,
    @Body() enrollDto: EnrollCourseDto,
  ) {
    const enrollment = await this.enrollmentsService.enrollInCourse(
      userId,
      enrollDto,
    );
    return {
      success: true,
      message: 'Successfully enrolled in course',
      data: enrollment,
    };
  }

  /**
   * Check if enrolled in course
   * GET /api/enrollments/:courseId/check
   * ⭐ This comes BEFORE :courseId alone
   */
  @Get(':courseId/check')
  @HttpCode(HttpStatus.OK)
  async checkEnrollment(
    @CurrentUser('id') userId: string,
    @Param('courseId') courseId: string,
  ) {
    const isEnrolled = await this.enrollmentsService.isEnrolled(
      userId,
      courseId,
    );
    return {
      success: true,
      data: { isEnrolled },
    };
  }

  /**
   * Recalculate enrollment progress
   * POST /api/enrollments/:courseId/recalculate
   * ⭐ Specific route comes before generic :courseId
   */
  @Post(':courseId/recalculate')
  @HttpCode(HttpStatus.OK)
  async recalculateProgress(
    @CurrentUser('id') userId: string,
    @Param('courseId') courseId: string,
  ) {
    const progress = await this.enrollmentsService.recalculateProgress(
      userId,
      courseId,
    );
    return {
      success: true,
      message: 'Progress recalculated successfully',
      data: { progress },
    };
  }

  /**
   * Update enrollment progress
   * PUT /api/enrollments/:courseId/progress
   * ⭐ Specific route comes before generic :courseId
   */
  @Put(':courseId/progress')
  @HttpCode(HttpStatus.OK)
  async updateProgress(
    @CurrentUser('id') userId: string,
    @Param('courseId') courseId: string,
    @Body() updateData: UpdateProgressDto,
  ) {
    const enrollment = await this.enrollmentsService.updateProgress(
      userId,
      courseId,
      updateData,
    );
    return {
      success: true,
      message: 'Progress updated successfully',
      data: enrollment,
    };
  }

  /**
   * Get enrollment details
   * GET /api/enrollments/:courseId
   * ⭐ This comes AFTER all specific routes
   */
  @Get(':courseId')
  @HttpCode(HttpStatus.OK)
  async getEnrollmentDetails(
    @CurrentUser('id') userId: string,
    @Param('courseId') courseId: string,
  ) {
    const enrollment = await this.enrollmentsService.getEnrollmentDetails(
      userId,
      courseId,
    );
    return {
      success: true,
      data: enrollment,
    };
  }

  /**
   * Unenroll from course
   * DELETE /api/enrollments/:courseId
   * ⭐ Generic route comes LAST
   */
  @Delete(':courseId')
  @HttpCode(HttpStatus.OK)
  async unenrollFromCourse(
    @CurrentUser('id') userId: string,
    @Param('courseId') courseId: string,
  ) {
    await this.enrollmentsService.unenrollFromCourse(userId, courseId);
    return {
      success: true,
      message: 'Successfully unenrolled from course',
    };
  }
}
