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

import { GetFilesResponseDto } from '../directories/dto/get-files-response.dto';
import { SetParentQueryDto } from '../files/dto/set-parent-query.dto';
import { DownloadFileParamsDto } from '../files/dto/download-file-params.dto';
import { GetFileParamsDto } from '../files/dto/get-file-params.dto';

import { CreateSharedFileDto } from './dto/create-shared-file.dto';
import { SharedFilesService } from './shared-files.service';

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

  // TODO share with multiple users at one time
  @Post()
  @UseGuards(AccessPermissionGuard)
  @AccessPermission<CreateSharedFileDto>('fileId', RequestContext.BODY)
  @ApiOperation({
    summary: 'Share file or directory',
  })
  @ApiResponse({
    status: 200,
    type: SharedFileDto,
  })
  @ApiResponse({
    status: 400,
    type: RejectResponseDto,
  })
  public create(
    @Body() { fileId, userId }: CreateSharedFileDto,
  ): Promise<SharedFileDto> {
    return this.sharedFilesService.create(fileId, userId);
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
    @Query() { parentId }: SetParentQueryDto,
  ): Promise<GetFilesResponseDto> {
    return this.sharedFilesService.findAll(userId, parentId);
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

  // TODO share with multiple users at one time
  @Delete(':fileId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @AccessPermission<GetFileParamsDto>('fileId', RequestContext.BODY)
  @UseGuards(AccessPermissionGuard)
  @ApiOperation({
    summary: 'Unshare file with user',
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
  public remove(
    @Body() { fileId, userId }: CreateSharedFileDto,
  ): Promise<HttpStatus> {
    return this.sharedFilesService.remove(fileId, userId);
  }
}
