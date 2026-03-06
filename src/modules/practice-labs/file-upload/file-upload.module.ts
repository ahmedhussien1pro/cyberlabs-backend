// src/modules/practice-labs/file-upload/file-upload.module.ts
import { Module } from '@nestjs/common';
import { SharedModule } from '../shared/shared.module';

import { Lab1Controller } from './labs/lab1/lab1.controller';
import { FileUploadLab1Service } from './labs/lab1/lab1.service';
import { Lab2Controller } from './labs/lab2/lab2.controller';
import { FileUploadLab2Service } from './labs/lab2/lab2.service';
import { Lab3Controller } from './labs/lab3/lab3.controller';
import { FileUploadLab3Service } from './labs/lab3/lab3.service';
import { Lab4Controller } from './labs/lab4/lab4.controller';
import { FileUploadLab4Service } from './labs/lab4/lab4.service';
import { Lab5Controller } from './labs/lab5/lab5.controller';
import { FileUploadLab5Service } from './labs/lab5/lab5.service';

@Module({
  imports: [SharedModule],
  controllers: [
    Lab1Controller,
    Lab2Controller,
    Lab3Controller,
    Lab4Controller,
    Lab5Controller,
  ],
  providers: [
    FileUploadLab1Service,
    FileUploadLab2Service,
    FileUploadLab3Service,
    FileUploadLab4Service,
    FileUploadLab5Service,
  ],
})
export class FileUploadModule {}
