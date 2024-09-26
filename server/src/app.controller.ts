import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import axios from 'axios';
import { FastifyReply } from 'fastify';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import JSZip from 'jszip';
import path from 'path';
import sharp, { FormatEnum } from 'sharp';
import { AppService } from './app.service';

interface Image {
  url: string;
  headers?: { name: string; value: string }[];
}

interface Video {
  // Define the structure of your Video type here
}

@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) {}
  z;

  @Post('imgs')
  async getImgUrl(
    @Body() payload: { images: Image[]; format: string },
    @Res() reply: FastifyReply,
  ) {
    try {
      const { images, format } = payload;

      if (format !== 'original' && !this.isValidFormat(format)) {
        throw new HttpException(
          'Invalid format specified',
          HttpStatus.BAD_REQUEST,
        );
      }

      const imagePath = path.join(path.resolve(), 'images');
      fs.mkdirSync(imagePath, { recursive: true });

      const zip = new JSZip();

      for (const image of images) {
        const name = new URL(image.url).pathname.split('/').slice(-1)[0];
        const imageType = image.headers
          ?.find((header) => header.name.toLowerCase() === 'content-type')
          ?.value.replace('image/', '');

        const response = await axios.get(image.url, {
          responseType: 'arraybuffer',
        });
        const imageBuffer = Buffer.from(response.data, 'binary');

        if (format === 'original') {
          // Don't convert, use original image data
          zip.file(name, imageBuffer); // Use original image
        } else {
          let sharpInstance = sharp(imageBuffer);

          if (format === 'heif') {
            sharpInstance = sharpInstance.heif({ quality: 80 });
          } else {
            sharpInstance = sharpInstance.toFormat(format as keyof FormatEnum);
          }

          const processedImage = await sharpInstance.toBuffer();
          zip.file(`${name}.${format}`, processedImage);
        }
      }

      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

      const zipFileName = path.join(imagePath, `images.zip`);
      fs.writeFileSync(zipFileName, zipBuffer);

      reply
        .header('Content-Type', 'application/zip')
        .header('Content-Disposition', 'attachment; filename=images.zip')
        .send(zipBuffer);

      // Cleanup: Remove the zip file after sending
      fs.unlinkSync(zipFileName);

      return zipFileName;
    } catch (error) {
      console.error('Error processing images:', error);
      throw new HttpException(
        'Error processing images',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private isValidFormat(format: string): boolean {
    const validFormats = [
      'original',
      'jpeg',
      'png',
      'webp',
      'avif',
      'heif',
      'tiff',
    ];
    return validFormats.includes(format.toLowerCase());
  }

  @Post('videos')
  async getVideoUrl(
    @Body() payload: { videos: Video[]; format: string },
    @Res() reply: FastifyReply,
  ) {
    const { videos, format } = payload;
    const outputFilename = `video.${format}`;
    const outputPath = path.join(__dirname, outputFilename);

    ffmpeg(videos)
      .format(format)
      .output(outputPath)
      .on('end', () => {
        const stream = fs.createReadStream(outputPath);
        reply
          .header('Content-Type', `video/${format}`)
          .header(
            'Content-Disposition',
            `attachment; filename=${outputFilename}`,
          )
          .send(stream);
      })
      .on('error', (err) => {
        console.log('Error during conversion:', err);
        reply.status(500).send('Error during video conversion');
      })
      .run();
  }
}
