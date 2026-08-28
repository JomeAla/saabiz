import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TenantContext } from './tenant.types';

export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): TenantContext | undefined => {
    const req = ctx.switchToHttp().getRequest();
    return req.tenantContext as TenantContext | undefined;
  }
);