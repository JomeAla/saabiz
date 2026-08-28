import { Tenant, Domain, Seller } from '@prisma/client';

export interface TenantWithRelations extends Tenant {
  domains: Domain[];
  seller: Seller | null;
}

export interface TenantContext {
  /** Normalized request host (lowercase, no port, no www) */
  host: string;
  /** True when the request targets the platform root domain (or localhost in dev) */
  isPlatform: boolean;
  /** Resolved tenant for tenant-scoped storefront domains, otherwise null */
  tenant: TenantWithRelations | null;
  /** Primary host of the resolved tenant (used for storefront URLs) */
  tenantHost: string | null;
}