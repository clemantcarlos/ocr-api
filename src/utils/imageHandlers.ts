import { createHash } from 'crypto';

export async function createImage(
  file: Express.Multer.File,
): Promise<{ imageUrl: string; imageHash: string }> {
  const buffer =
    file.buffer ??
    (await import('fs/promises').then((fs) => fs.readFile(file.path)));
  const hash = createHash('sha256').update(buffer).digest('hex');
  const imageUrl = `/public/img/${file.filename}`;

  return { imageUrl, imageHash: hash };
}
