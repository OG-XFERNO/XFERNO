import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminInvitationService } from './admin-invitation.service';
import { AdminController } from './admin.controller';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [EmailModule],
  controllers: [AdminController],
  providers: [AdminService, AdminInvitationService],
  exports: [AdminService, AdminInvitationService],
})
export class AdminModule {}
