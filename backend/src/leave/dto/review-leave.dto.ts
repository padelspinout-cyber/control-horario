import { IsEnum } from 'class-validator';

export enum ReviewDecision {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export class ReviewLeaveDto {
  @IsEnum(ReviewDecision)
  decision: ReviewDecision;
}
