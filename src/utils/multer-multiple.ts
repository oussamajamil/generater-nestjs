import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';

function isValidImageMimeType(mimetype: string): boolean {
  return (
    mimetype === 'image/png' ||
    mimetype === 'image/jpeg' ||
    mimetype === 'image/jpg' ||
    mimetype === 'image/gif' ||
    mimetype === 'image/svg+xml' ||
    mimetype === 'image/webp' ||
    mimetype === 'text/csv'
  );
}

export const storageAfterAndBefor = diskStorage({
  destination: './uploads',
  filename: async (req, file, callback) => {
    try {
      if (!isValidImageMimeType(file.mimetype)) {
        callback(
          new BadRequestException(
            'Invalid image type. Only jpg, png, jpeg, webp, gif, svg are allowed',
          ),
          null,
        );
      }
      const filename = generateFilename(file);

      req.body[file.fieldname] = [
        ...(req?.body?.[file.fieldname] || []),
        filename,
      ];

      callback(null, filename);
    } catch (err) {
      console.log(err);
      callback(new BadRequestException('error in multer config'), null);
    }
  },
});

function generateFilename(file) {
  return `${Date.now() + Math.random() * 1000}${extname(file.originalname)}`;
}
