import { ApiProperty } from '@nestjs/swagger';

export class ShareLinkResponseDto {
  @ApiProperty({
    example:
      'http://localhost:9180/shared/0197d0ae-ab4a-7bf3-a32e-4fe889c2e2db',
  })
  share_link!: string;
}
