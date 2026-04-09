import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JwtAuthGuard
 *
 * Thin wrapper around Passport's 'jwt' strategy (defined in jwt.strategy.ts).
 * Use on any controller/route that requires a valid Bearer token.
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard)
 *   @Get('protected')
 *   myRoute(@Req() req) {
 *     const user = req.user;  // populated by JwtStrategy.validate()
 *   }
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
