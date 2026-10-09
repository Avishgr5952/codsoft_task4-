import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private s3Client: S3Client | null = null;
  private bucket: string | null = null;
  private uploadDir: string;

  constructor(private configService: ConfigService) {
    this.uploadDir = path.resolve(process.cwd(), this.configService.get('UPLOAD_DIR', './uploads'));
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }

    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    const region = this.configService.get<string>('AWS_REGION', 'us-east-1');
    const bucket = this.configService.get<string>('AWS_S3_BUCKET');

    if (accessKeyId && secretAccessKey && bucket) {
      this.s3Client = new S3Client({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      this.bucket = bucket;
      this.logger.log(`S3 storage initialized with bucket: ${bucket}`);
    } else {
      this.logger.log(`S3 credentials not provided. Using local file storage at ${this.uploadDir}`);
    }
  }

  async uploadFile(file: Express.Multer.File, folder = 'general'): Promise<string> {
    const extension = path.extname(file.originalname);
    const filename = `${folder}/${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;

    if (this.s3Client && this.bucket) {
      try {
        const command = new PutObjectCommand({
          Bucket: this.bucket,
          Key: filename,
          Body: file.buffer,
          ContentType: file.mimetype,
        });
        await this.s3Client.send(command);
        const region = this.configService.get<string>('AWS_REGION', 'us-east-1');
        return `https://${this.bucket}.s3.${region}.amazonaws.com/${filename}`;
      } catch (err: any) {
        this.logger.warn(`S3 upload failed: ${err.message}. Falling back to local storage.`);
      }
    }

    // Local file fallback
    const targetFolder = path.join(this.uploadDir, folder);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    const localFilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
    const filePath = path.join(targetFolder, localFilename);
    fs.writeFileSync(filePath, file.buffer);

    return `/uploads/${folder}/${localFilename}`;
  }
}
