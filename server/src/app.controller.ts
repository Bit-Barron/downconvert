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
import sharp from 'sharp';
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
      console.log('Received request with format:', format);

      if (format === 'original' && images.length === 1) {
        // Handle single original image download
        const image = images[0];
        const response = await axios.get(image.url, {
          responseType: 'arraybuffer',
        });
        const imageBuffer = Buffer.from(response.data);
        const contentType = response.headers['content-type'];
        const name = new URL(image.url).pathname.split('/').pop() || 'image';

        reply
          .header('Content-Type', contentType)
          .header('Content-Disposition', `attachment; filename=${name}`)
          .send(imageBuffer);

        console.log('Single original image sent successfully');
        return 'Image processed successfully';
      }

      const zip = new JSZip();

      for (const image of images) {
        const name = new URL(image.url).pathname.split('/').pop() || 'image';
        const response = await axios.get(image.url, {
          responseType: 'arraybuffer',
        });
        const imageBuffer = Buffer.from(response.data);

        const contentType = response.headers['content-type'];
        console.log(`Processing image: ${name}, Content-Type: ${contentType}`);

        if (format === 'original') {
          console.log(`Adding original image: ${name}, type: ${contentType}`);
          zip.file(name, imageBuffer, { binary: true });
        } else {
          let sharpInstance = sharp(imageBuffer);
          sharpInstance = sharpInstance.toFormat(format as any);
          const processedImage = await sharpInstance.toBuffer();
          console.log(`Adding converted image: ${name}.${format}`);
          zip.file(`${name}.${format}`, processedImage, { binary: true });
        }
      }

      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
      console.log('ZIP file size:', zipBuffer.length, 'bytes');

      reply
        .header('Content-Type', 'application/zip')
        .header('Content-Disposition', `attachment; filename=images.zip`)
        .send(zipBuffer);

      console.log('Response sent successfully');
      return 'Images processed successfully';
    } catch (error) {
      console.error('Error processing images:', error);
      throw new HttpException(
        'Error processing images',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
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
