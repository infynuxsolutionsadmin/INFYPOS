# INFYPOS Project Structure Documentation

```
backend/
├── docs/
│   ├── database.md
│   └── project-structure.md
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── src/
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── get-tenant.decorator.ts
│   │   │   ├── get-user.decorator.ts
│   │   │   └── permissions.decorator.ts
│   │   ├── dto/
│   │   │   └── pagination.dto.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── permissions.guard.ts
│   │   │   └── tenant.guard.ts
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   └── transform.interceptor.ts
│   │   ├── middleware/
│   │   │   └── tenant-context.middleware.ts
│   │   └── utils/
│   │       └── soft-delete.util.ts
│   ├── config/
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   └── redis.config.ts
│   ├── database/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── modules/
│   │   ├── auth/
│   │   ├── tenants/
│   │   ├── stores/
│   │   ├── rbac/
│   │   ├── users/
│   │   ├── products/
│   │   ├── inventory/
│   │   ├── sales/
│   │   ├── payments/
│   │   ├── vat/
│   │   ├── reports/
│   │   ├── offline-sync/
│   │   ├── redis/
│   │   └── queues/
│   ├── app.module.ts
│   └── main.ts
├── .env
├── package.json
└── README.md
```
