import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { OcrService } from './ocr.service';
// GUARD
import { Public } from '../auth/common/decorators/public.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { fromBuffer } from 'pdf2pic';
// TYPES
import { UploadDto } from './dto/upload.dto';
// PIPES
import { FileRequiredPipe } from './pipes/require-file.pipe';

@Controller('ocr')
export class OcrController {
  constructor(private readonly ocrService: OcrService) {}

  @Public()
  @Post('upload')
  @UsePipes(new ValidationPipe())
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async convertPdfToImg(
    @UploadedFile(new FileRequiredPipe('file')) file: Express.Multer.File,
    @Body() dto: UploadDto,
  ) {
    const options = {
      density: 300,
      saveFilename: 'factura',
      savePath: './imgs',
      format: 'png',
      width: 1200,
      height: 1600,
      quality: 100,
    };

    const convert = fromBuffer(file.buffer, options);
    const pageToConvertAsImage = 1;

    try {
      const result = await convert(pageToConvertAsImage, {
        responseType: 'buffer',
      });

      if (!result.buffer) {
        throw new Error('No se obtuvo buffer de imagen');
      }

      const ocrResult = await this.ocrService.extractTextFromImage(
        result.buffer,
        dto.docType,
      );

      return {
        ocrResult,
      };
    } catch (err) {
      console.error('Error converting PDF to image or OCR', err);
      throw err;
    }
  }
}
