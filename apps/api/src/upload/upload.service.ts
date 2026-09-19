import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class UploadService {
  constructor(config: ConfigService) {
    cloudinary.config({
      cloud_name: config.getOrThrow<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: config.getOrThrow<string>('CLOUDINARY_API_KEY'),
      api_secret: config.getOrThrow<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadBuffer(
    buffer: Buffer,
    mimetype: string,
  ): Promise<{ url: string }> {
    const dataUri = `data:${mimetype};base64,${buffer.toString('base64')}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'cookroots',
      resource_type: 'image',
      // Cap stored dimensions and auto-compress to conserve the free-tier
      // storage/bandwidth credit pool — uploads are never stored larger
      // than this regardless of the original file's dimensions.
      transformation: [
        { width: 1600, height: 1600, crop: 'limit' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    });
    return { url: result.secure_url };
  }
}
