// src/modules/practice-labs/mcq/mcq.service.ts
// All question data is read from DB initialState.questions.
// Zero filesystem I/O — fully Vercel Serverless compatible.
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PracticeLabStateService } from '../shared/services/practice-lab-state.service';
import { PrismaService }           from '../../../core/database';

interface RawQuestion {
  id:       number;
  question: string;
  options:  string[];
  answer:   string;
}

interface MCQInitialState {
  type:              string;
  jsonFile?:         string;
  questionCount:     number;
  passingScore:      number;
  pointsPerQuestion: number;
  questions:         RawQuestion[];
}

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
  // Returns question list WITHOUT the answer field.
  // ──────────────────────────────────────────────────────────
  async getQuestions(slug: string) {
    const { questions } = await this.resolveMeta(slug);
    return {
      questions: questions.map(({ id, question, options }) => ({ id, question, options })),
    };
  }

  // ──────────────────────────────────────────────────────────
  // POST /practice-labs/mcq/:slug/submit
  // Body: { labId: string, answers: Record<number, string> }
  // ──────────────────────────────────────────────────────────
  async submitAnswers(
    slug:    string,
    userId:  string,
    labId:   string,
    answers: Record<number, string>,
  ) {
    const meta = await this.resolveMeta(slug);
    const { questions, pointsPerQuestion, passingScore } = meta;

    let correct = 0;
    const feedback = questions.map((q) => {
      const given   = (answers[q.id] ?? '').trim();
      const isRight = given === q.answer.trim();
      if (isRight) correct++;
      return { id: q.id, correct: isRight, correctAnswer: q.answer, given };
    });

    const score      = correct * pointsPerQuestion;
    const maxScore   = questions.length * pointsPerQuestion;
    const percentage = Math.round((score / maxScore) * 100);
    const passed     = percentage >= passingScore;

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

    return { score, maxScore, percentage, passed, correct, total: questions.length, flag, feedback };
  }

  // ── helpers ────────────────────────────────────────────────

  /**
   * Loads lab config from DB.
   * Validates type === 'MCQ' and that questions array is present.
   * Throws descriptive errors so frontend shows a clear message.
   */
  private async resolveMeta(slug: string): Promise<MCQInitialState & { labId: string }> {
    const lab = await this.prisma.lab.findUnique({
      where:  { slug },
      select: { id: true, initialState: true },
    });

    if (!lab) {
      throw new NotFoundException(`MCQ lab not found: ${slug}`);
    }

    const state = lab.initialState as any;

    if (state?.type !== 'MCQ') {
      throw new BadRequestException(`Lab "${slug}" is not an MCQ lab (type=${state?.type})`);
    }

    const questions: RawQuestion[] = state.questions ?? [];

    if (questions.length === 0) {
      throw new NotFoundException(
        `No questions found for lab "${slug}". ` +
        `Please run the seed script to embed questions into the database.`,
      );
    }

    return {
      labId:             lab.id,
      type:              state.type,
      jsonFile:          state.jsonFile,
      questionCount:     state.questionCount  ?? questions.length,
      passingScore:      state.passingScore   ?? 70,
      pointsPerQuestion: state.pointsPerQuestion ?? 5,
      questions,
    };
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
