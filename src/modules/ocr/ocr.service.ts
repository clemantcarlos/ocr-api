import { Injectable } from '@nestjs/common';
// OCR
import { createScheduler, createWorker } from 'tesseract.js';
// TYPE
import { DocumentsMap, DocumentType } from './types/document.type';

const DOCUMENTS: DocumentsMap = {
  digitel: {
    rectangles: [
      {
        left: 1025,
        top: 299,
        width: 81,
        height: 20,
      },
      {
        left: 968,
        top: 901,
        width: 98,
        height: 36,
      },
      {
        left: 984,
        top: 576,
        width: 81,
        height: 20,
      },
      {
        left: 449,
        top: 1438,
        width: 74,
        height: 25,
      },
    ],
  },
  banesco_pago_terceros: {
    rectangles: [
      {
        left: 1025,
        top: 299,
        width: 81,
        height: 20,
      },
      {
        left: 968,
        top: 901,
        width: 98,
        height: 36,
      },
      {
        left: 984,
        top: 576,
        width: 81,
        height: 20,
      },
    ],
  },
};

@Injectable()
export class OcrService {
  async extractTextFromImage(
    imageBuffer: Buffer,
    docType: DocumentType = 'digitel',
  ) {
    const language = 'spa';

    const scheduler = createScheduler();
    const worker1 = await createWorker(language);
    const worker2 = await createWorker(language);
    const worker3 = await createWorker(language);

    const rectangles = DOCUMENTS[docType].rectangles;

    scheduler.addWorker(worker1);
    scheduler.addWorker(worker2);
    scheduler.addWorker(worker3);
    const results = await Promise.all(
      rectangles.map((rectangle) =>
        scheduler.addJob('recognize', imageBuffer, { rectangle }),
      ),
    );
    console.log(results.map((r) => r.data.text));

    await scheduler.terminate();
    return results;
  }
}
