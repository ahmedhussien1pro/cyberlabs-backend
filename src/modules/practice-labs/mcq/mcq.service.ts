// src/modules/practice-labs/mcq/mcq.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as fs   from 'fs';
import * as path from 'path';
import { PracticeLabStateService } from '../shared/services/practice-lab-state.service';
import { PrismaService }           from '../../../core/database';

interface RawQuestion {
  id:      number;
  question: string;
  options: string[];
  answer:  string;
}

@Injectable()
export class MCQService {
  constructor(
    private readonly prisma:        PrismaService,
    private readonly stateService:  PracticeLabStateService,
  ) {}

  // ──────────────────────────────────────────────────────────
  // GET /practice-labs/mcq/:slug/questions
  // ──────────────────────────────────────────────────────────
  async getQuestions(slug: string) {
    const meta = await this.resolveMeta(slug);
    const raw  = this.loadJson(meta.jsonFile);

    // Strip the answer field before sending to the client
    const questions = raw.map(({ id, question, options }) => ({ id, question, options }));
    return { questions };
  }

  // ──────────────────────────────────────────────────────────
  // POST /practice-labs/mcq/:slug/submit
  // body: { labId: string, answers: Record<number, string> }
  // ──────────────────────────────────────────────────────────
  async submitAnswers(
    slug:    string,
    userId:  string,
    labId:   string,
    answers: Record<number, string>,
  ) {
    const meta  = await this.resolveMeta(slug);
    const raw   = this.loadJson(meta.jsonFile);
    const ptsEach = meta.pointsPerQuestion;

    // Grade
    let correct = 0;
    const feedback = raw.map((q) => {
      const given   = answers[q.id] ?? '';
      const isRight = given.trim() === q.answer.trim();
      if (isRight) correct++;
      return { id: q.id, correct: isRight, correctAnswer: q.answer, given };
    });

    const score      = correct * ptsEach;
    const maxScore   = raw.length * ptsEach;
    const percentage = Math.round((score / maxScore) * 100);
    const passed     = percentage >= meta.passingScore;

    // Record attempt log
    const resolvedLabId = await this.stateService.resolveLabId(slug);
    await this.recordAttempt(userId, resolvedLabId, percentage, passed);

    let flag: string | null = null;
    if (passed) {
      flag = this.stateService.generateDynamicFlag(
        `FLAG{${slug.toUpperCase().replace(/-/g, '_')}`,
        userId,
        resolvedLabId,
      );
    }

    return { score, maxScore, percentage, passed, correct, total: raw.length, flag, feedback };
  }

  // ── helpers ─────────────────────────────────────────────────────

  /**
   * Loads the Lab row from DB by slug and returns the MCQ-specific
   * initialState fields as a typed object.
   */
  private async resolveMeta(slug: string) {
    const lab = await this.prisma.lab.findUnique({
      where:  { slug },
      select: { id: true, initialState: true },
    });
    if (!lab) throw new NotFoundException(`MCQ lab not found: ${slug}`);

    const state = lab.initialState as any;
    if (state?.type !== 'MCQ') {
      throw new BadRequestException(`Lab "${slug}" is not an MCQ lab`);
    }

    return {
      labId:             lab.id,
      jsonFile:          state.jsonFile          as string,
      questionCount:     state.questionCount      as number,
      passingScore:      state.passingScore       as number,   // %
      pointsPerQuestion: state.pointsPerQuestion  as number,
    };
  }

  /**
   * Reads and parses the MCQ JSON file.
   * Path is relative to the repository root (where the process runs).
   */
  private loadJson(jsonFile: string): RawQuestion[] {
    const abs = path.resolve(process.cwd(), jsonFile);
    if (!fs.existsSync(abs)) {
      throw new NotFoundException(`Question bank not found: ${jsonFile}`);
    }
    const raw = JSON.parse(fs.readFileSync(abs, 'utf-8'));
    return (raw.questions ?? raw) as RawQuestion[];
  }

  /** Idempotent per-attempt log — stores score so we track best attempt */
  private async recordAttempt(
    userId:    string,
    labId:     string,
    score:     number,
    passed:    boolean,
  ) {
    await this.prisma.labGenericLog.create({
      data: {
        userId,
        labId,
        type: passed ? 'MCQ_PASSED' : 'MCQ_ATTEMPTED',
        data: String(score),
      },
    });
  }
}
