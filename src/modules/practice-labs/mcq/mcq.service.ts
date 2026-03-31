// src/modules/practice-labs/mcq/mcq.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as fs   from 'fs';
import * as path from 'path';
import { PracticeLabStateService } from '../shared/services/practice-lab-state.service';
import { PrismaService }           from '../../../core/database';

interface RawQuestion {
  id:       number;
  question: string;
  options:  string[];
  answer:   string;
}

// Base directory where the compiled mcq.service.js lives at runtime.
// In dev  : <root>/src/modules/practice-labs/mcq/
// In prod : <root>/dist/modules/practice-labs/mcq/
// The JSON files are co-located in ./data/ relative to this file.
const MCQ_DATA_DIR = path.resolve(__dirname, 'data');

@Injectable()
export class MCQService {
  constructor(
    private readonly prisma:       PrismaService,
    private readonly stateService: PracticeLabStateService,
  ) {}

  // ──────────────────────────────────────────────────────────
  // POST /practice-labs/mcq/:slug/start
  // ──────────────────────────────────────────────────────────
  async startLab(slug: string, _userId: string) {
    const labId = await this.stateService.resolveLabId(slug);
    return { labId, status: 'ready' };
  }

  // ──────────────────────────────────────────────────────────
  // GET /practice-labs/mcq/:slug/questions
  // ──────────────────────────────────────────────────────────
  async getQuestions(slug: string) {
    const meta = await this.resolveMeta(slug);
    const raw  = this.loadJson(meta.jsonFile);
    const questions = raw.map(({ id, question, options }) => ({ id, question, options }));
    return { questions };
  }

  // ──────────────────────────────────────────────────────────
  // POST /practice-labs/mcq/:slug/submit
  // ──────────────────────────────────────────────────────────
  async submitAnswers(
    slug:    string,
    userId:  string,
    labId:   string,
    answers: Record<number, string>,
  ) {
    const meta    = await this.resolveMeta(slug);
    const raw     = this.loadJson(meta.jsonFile);
    const ptsEach = meta.pointsPerQuestion;

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

  // ── helpers ────────────────────────────────────────────────

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
      passingScore:      state.passingScore       as number,
      pointsPerQuestion: state.pointsPerQuestion  as number,
    };
  }

  /**
   * jsonFile is stored in DB as a relative path from the data/ folder.
   * e.g. "API_Hacking.json" or "career_in_Cyber/PenetrationTester.json"
   */
  private loadJson(jsonFile: string): RawQuestion[] {
    const abs = path.resolve(MCQ_DATA_DIR, jsonFile);
    if (!fs.existsSync(abs)) {
      throw new NotFoundException(`Question bank not found: ${abs}`);
    }
    const raw = JSON.parse(fs.readFileSync(abs, 'utf-8'));
    return (raw.questions ?? raw) as RawQuestion[];
  }

  private async recordAttempt(
    userId: string,
    labId:  string,
    score:  number,
    passed: boolean,
  ) {
    await this.prisma.labGenericLog.create({
      data: {
        userId,
        labId,
        type:   passed ? 'MCQ_PASSED' : 'MCQ_ATTEMPTED',
        value:  score,
        action: String(score),
      },
    });
  }
}
