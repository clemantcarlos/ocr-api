import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
  stream: NodeJS.ReadableStream;
}

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
