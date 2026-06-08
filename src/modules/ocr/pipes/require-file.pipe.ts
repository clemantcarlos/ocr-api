import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import type { MulterFile } from '@/types/file';

@Injectable()
export class FileRequiredPipe implements PipeTransform<
  MulterFile | undefined,
  MulterFile
> {
  constructor(private readonly field = 'file') {}

  transform(file: MulterFile | undefined): MulterFile {
    if (!file) throw new BadRequestException('File is required');
    const allowed = ['application/pdf'];
    if (!allowed.includes(file.mimetype))
      throw new BadRequestException('Invalid file type');
    if (file.size > 5 * 1024 * 1024)
      throw new BadRequestException('File too large');
    return file;
  }
}
