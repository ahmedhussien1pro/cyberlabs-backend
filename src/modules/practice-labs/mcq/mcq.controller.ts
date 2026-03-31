// src/modules/practice-labs/mcq/mcq.controller.ts
import {
  Controller, Get, Post, Param, Body, Query,
  UseGuards, Req,
} from '@nestjs/common';
import { MCQService }  from './mcq.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('practice-labs/mcq')
@UseGuards(JwtAuthGuard)
export class MCQController {
  constructor(private readonly mcqService: MCQService) {}

  /**
   * GET /practice-labs/mcq/:slug/questions
   * Returns the question list WITHOUT the answer field.
   */
  @Get(':slug/questions')
  getQuestions(@Param('slug') slug: string) {
    return this.mcqService.getQuestions(slug);
  }

  /**
   * POST /practice-labs/mcq/:slug/submit
   * Body: { labId: string, answers: Record<number, string> }
   * Returns: { score, maxScore, percentage, passed, flag?, feedback[] }
   */
  @Post(':slug/submit')
  submitAnswers(
    @Param('slug') slug:  string,
    @Req()         req:   any,
    @Body()        body:  { labId: string; answers: Record<number, string> },
  ) {
    return this.mcqService.submitAnswers(
      slug,
      req.user.sub ?? req.user.id,
      body.labId,
      body.answers,
    );
  }
}
