import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  UseGuards,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp|svg\+xml)$/)) {
        return cb(new BadRequestException('Only image files (JPG, PNG, WEBP, GIF, SVG) are allowed!'), false);
      }
      cb(null, true);
    },
  }))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder = 'products',
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const url = await this.uploadsService.uploadFile(file, folder);
    return { url };
  }
}
