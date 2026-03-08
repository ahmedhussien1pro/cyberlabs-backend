import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminLabsService } from './admin-labs.service';
import { AdminGuard } from '../../common/guards';
import { AdminLabQueryDto } from './dto/admin-lab-query.dto';
import { CreateLabDto } from './dto/create-lab.dto';
import { UpdateLabDto } from './dto/update-lab.dto';

/**
 * AdminLabsController
 *
 * Full CRUD + publish/unpublish for the admin panel.
 * Route namespace: /admin/labs
 * Protection: AdminGuard (ADMIN role only)
 *
 * SECURITY NOTES:
 *   - GET /admin/labs        → NO flagAnswer, NO solution in response
 *   - GET /admin/labs/:id    → INCLUDES flagAnswer + solution (admin needs to edit them)
 *   - User-facing /practice-labs routes never return these fields
 *
 * Endpoint order matters:
 *   /admin/labs/stats must come BEFORE /admin/labs/:id
 */
@UseGuards(AdminGuard)
@Controller('admin/labs')
export class AdminLabsController {
  constructor(private readonly adminLabsService: AdminLabsService) {}

  /**
   * GET /admin/labs/stats
   * Total, published, unpublished, completions, submissions, byDifficulty.
   */
  @Get('stats')
  getStats() {
    return this.adminLabsService.getStats();
  }

  /**
   * GET /admin/labs
   * All labs with pagination and optional filters.
   * flagAnswer and solution are NOT included in list responses.
   * ?search= ?difficulty= ?category= ?executionMode= ?isPublished= ?page= ?limit=
   */
  @Get()
  findAll(@Query() query: AdminLabQueryDto) {
    return this.adminLabsService.findAll(query);
  }

  /**
   * GET /admin/labs/:id
   * Full lab detail including flagAnswer and solution.
   * Protected by AdminGuard — only admins can access this endpoint.
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminLabsService.findOne(id);
  }

  /**
   * POST /admin/labs
   * Create a new lab. Starts as unpublished by default.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateLabDto) {
    return this.adminLabsService.create(dto);
  }

  /**
   * PATCH /admin/labs/:id
   * Update lab metadata and content fields.
   * Does NOT control publish state — use /publish or /unpublish.
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLabDto) {
    return this.adminLabsService.update(id, dto);
  }

  /**
   * PATCH /admin/labs/:id/publish
   * Makes the lab visible to users.
   */
  @Patch(':id/publish')
  @HttpCode(HttpStatus.OK)
  publish(@Param('id') id: string) {
    return this.adminLabsService.publish(id);
  }

  /**
   * PATCH /admin/labs/:id/unpublish
   * Hides the lab from users without deleting data.
   */
  @Patch(':id/unpublish')
  @HttpCode(HttpStatus.OK)
  unpublish(@Param('id') id: string) {
    return this.adminLabsService.unpublish(id);
  }

  /**
   * DELETE /admin/labs/:id
   * Hard-deletes the lab.
   * Returns 400 if any user progress records exist — unpublish first.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.adminLabsService.remove(id);
  }
}
