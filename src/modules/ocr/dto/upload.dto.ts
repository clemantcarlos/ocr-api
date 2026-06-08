import { IsNotEmpty, IsString } from 'class-validator';
import type { DocumentType } from '../types/document.type';

export class UploadDto {
  @IsString()
  @IsNotEmpty()
  docType!: DocumentType;
}
