import { Module } from '@nestjs/common';
import { NotifyController } from './notify.controller';
import { ProvidersModule } from '../providers/providers.module';

@Module({ imports: [ProvidersModule], controllers: [NotifyController] })
export class NotifyModule {}
