import {
  Body,
  Controller,
  Get,
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
  // Add properties for Video interface if needed
}

@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('hello')
  async getHello() {
    return 'Hello World!';
  }

  @Post('imgs')
  async getImgUrl(
    @Body() payload: { images: Image[]; format: string },
    @Res() reply: FastifyReply,
  ) {
    try {
      const { images, format } = payload;
      console.log("Received request with format:", format);

      if (format !== 'original' && !this.isValidFormat(format)) {
        throw new HttpException(
          'Invalid format specified',
          HttpStatus.BAD_REQUEST,
        );
      }

      const zip = new JSZip();

      for (const image of images) {
        const name = new URL(image.url).pathname.split('/').slice(-1)[0];
        const response = await axios.get(image.url, {
          responseType: 'arraybuffer',
        });
        const imageBuffer = Buffer.from(response.data);

        if (format === 'original') {
          const contentType = response.headers['content-type'] as string;
          console.log(`Adding original image: ${name}, type: ${contentType}`);
          zip.file(name, imageBuffer, { binary: true, comment: contentType });
        } else {
          let sharpInstance = sharp(imageBuffer);

          if (format === 'heif') {
            sharpInstance = sharpInstance.heif({ quality: 80 });
          } else {
            sharpInstance = sharpInstance.toFormat(format as keyof FormatEnum);
          }

          const processedImage = await sharpInstance.toBuffer();
          zip.file(`${name}.${format}`, processedImage, { binary: true });
        }
      }

      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
      console.log("ZIP file size:", zipBuffer.length);

      reply
        .header('Content-Type', 'application/zip')
        .header('Content-Disposition', `attachment; filename=images.zip`)
        .send(zipBuffer);

      console.log("Response sent successfully");
      return 'Images processed successfully';
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