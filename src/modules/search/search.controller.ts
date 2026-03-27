import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { Public } from '../../common/decorators';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Public()
  @Get()
  globalSearch(
    @Query('q') q: string = '',
    @Query('limit') limit: string = '10',
  ) {
    return this.searchService.search(q.trim(), Math.min(Number(limit) || 10, 50));
  }
}
