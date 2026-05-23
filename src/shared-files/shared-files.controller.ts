import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  FileDto,
  RejectResponseDto,
  SharedFileDto,
  UserPayloadDto,
} from '@app/shared/dtos';
import { AccessPermissionGuard, JwtGuard } from '@app/shared/guards';
import { AccessPermission, User } from '@app/shared/decorators';
import { RequestContext } from '@app/shared/enums';
import e from 'express';
import { Cron, CronExpression } from '@nestjs/schedule';

import { GetFilesResponseDto } from '../directories/dto/get-files-response.dto';
import { SetParentQueryDto } from '../files/dto/set-parent-query.dto';
import { DownloadFileParamsDto } from '../files/dto/download-file-params.dto';
import { GetFileParamsDto } from '../files/dto/get-file-params.dto';

import { CreateSharedFileDto } from './dto/create-shared-file.dto';
import { SharedFilesService } from './shared-files.service';
import { ShareLinkResponseDto } from './dto/share-link-response.dto';
import { CreateShareLinkBodyDto } from './dto/create-share-link-body.dto';

@ApiTags('Shared files and directories')
@ApiBearerAuth()
@ApiResponse({
  status: 401,
  type: RejectResponseDto,
})
@UseGuards(JwtGuard)
@Controller({ path: 'shared', version: '1' })
export class SharedFilesController {
  constructor(private readonly sharedFilesService: SharedFilesService) {}

  @Post()
  @UseGuards(AccessPermissionGuard)
  @AccessPermission<CreateSharedFileDto>('fileId', RequestContext.BODY)
  @ApiOperation({
    summary: 'Share file or directory',
  })
  @ApiResponse({
    status: 200,
    type: [SharedFileDto],
  })
  @ApiResponse({
    status: 400,
    type: RejectResponseDto,
  })
  public create(
    @Body() { fileId, userIds }: CreateSharedFileDto,
  ): Promise<SharedFileDto[]> {
    return this.sharedFilesService.create(fileId, userIds);
  }

  @Post('link')
  @UseGuards(AccessPermissionGuard)
  @AccessPermission<CreateSharedFileDto>('fileId', RequestContext.BODY)
  @ApiOperation({
    summary: 'Share file or directory',
  })
  @ApiResponse({
    status: 200,
    type: ShareLinkResponseDto,
  })
  @ApiResponse({
    status: 400,
    type: RejectResponseDto,
  })
  public shareLink(
    @Body() { fileId, ttl = 3600 }: CreateShareLinkBodyDto,
  ): Promise<ShareLinkResponseDto> {
    return this.sharedFilesService.createShareLink(fileId, ttl);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all files shared with current user',
  })
  @ApiResponse({
    status: 200,
    type: GetFilesResponseDto,
  })
  @ApiResponse({
    status: 400,
    type: RejectResponseDto,
  })
  @ApiResponse({
    status: 403,
    type: RejectResponseDto,
  })
  public findAll(
    @User() { userId }: UserPayloadDto,
    @Query() { parentId, link: shareLinkId }: SetParentQueryDto,
  ): Promise<GetFilesResponseDto> {
    return this.sharedFilesService.findAll(userId, parentId, shareLinkId);
  }

  @Get(':fileId')
  @ApiOperation({
    summary: 'Get shared file by sharelink id',
  })
  @ApiResponse({
    status: 200,
    type: FileDto,
  })
  @ApiResponse({
    status: 400,
    type: RejectResponseDto,
  })
  @ApiResponse({
    status: 403,
    type: RejectResponseDto,
  })
  public findOne(@Param() { fileId }: GetFileParamsDto): Promise<FileDto> {
    return this.sharedFilesService.findOne(fileId);
  }

  @Get('download/:fileId')
  @ApiOperation({
    summary: 'Download shared with current user file',
  })
  @ApiResponse({
    status: 200,
    type: FileDto,
  })
  @ApiResponse({
    status: 400,
    type: RejectResponseDto,
  })
  @ApiResponse({
    status: 403,
    type: RejectResponseDto,
  })
  @ApiResponse({
    status: 500,
    type: RejectResponseDto,
  })
  downloadFile(
    @Param() { fileId }: DownloadFileParamsDto,
    @User() { userId }: UserPayloadDto,
    @Res() response: e.Response,
  ): Promise<FileDto> {
    return this.sharedFilesService.download(fileId, userId, response);
  }

  @Get('download/link/:fileId')
  @ApiOperation({
    summary: 'Download shared with current user file',
  })
  @ApiResponse({
    status: 200,
    type: FileDto,
  })
  @ApiResponse({
    status: 400,
    type: RejectResponseDto,
  })
  @ApiResponse({
    status: 403,
    type: RejectResponseDto,
  })
  @ApiResponse({
    status: 500,
    type: RejectResponseDto,
  })
  downloadFileBySharedLink(
    @Param() { fileId }: DownloadFileParamsDto,
    @Res() response: e.Response,
  ): Promise<FileDto> {
    return this.sharedFilesService.downloadByLink(fileId, response);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @AccessPermission<GetFileParamsDto>('fileId', RequestContext.BODY)
  @UseGuards(AccessPermissionGuard)
  @ApiOperation({
    summary: 'Unshare file with user',
  })
  @ApiResponse({
    status: 200,
  })
  @ApiResponse({
    status: 400,
    type: RejectResponseDto,
  })
  @ApiResponse({
    status: 403,
    type: RejectResponseDto,
  })
  public remove(
    @Body() { fileId, userIds }: CreateSharedFileDto,
  ): Promise<HttpStatus> {
    return this.sharedFilesService.remove(fileId, userIds);
  }

  @Cron(CronExpression.EVERY_HOUR)
  public async deleteExpiredLinks(): Promise<void> {
    await this.sharedFilesService.deleteExpiredLinks();
  }
}
