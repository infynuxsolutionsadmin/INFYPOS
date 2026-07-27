# INFYPOS Database Architecture & Schema Documentation

## Overview

INFYPOS uses PostgreSQL 17 with Prisma 7 ORM. It is designed around multi-tenant isolation, enterprise soft-deletes, and UUID primary keys.

## Core Models

### 1. Tenant System
- **Tenant**: Top-level organization metadata, subscription plan, currency, timezone.
- **Store**: Physical/digital sales branch associated with a Tenant.

### 2. Security & RBAC
- **User**: Multi-tenant user associated with a tenant and a role.
- **Role**: Custom or system level roles (`ADMIN`, `CASHIER`, `STORE_MANAGER`).
- **Permission**: Granular module action permissions (e.g., `products:read`, `sales:create`).
- **RolePermission**: Junction table binding Roles to Permissions.
- **UserStore**: Multi-store assignment junction for users.

### 3. Catalog & Products
- **Category**: Nested hierarchy for products.
- **Product**: SKUs, pricing, barcodes, VAT assignment, stock track settings.
- **ProductBarcode**: Multiple barcode formats per product.
- **ProductImage**: Media gallery per product.

### 4. Inventory Management
- **Inventory**: Store-level stock levels (current, opening, reserved, damaged).
- **InventoryMovement**: Immutable ledger of stock movements (sales, returns, transfers, adjustments).

### 5. Sales & POS Engine
- **Sale**: Invoice, receipt, cashier, customer, totals, tax, and discount audit.
- **SaleItem**: Individual lines in a sale.
- **Payment**: Split and multi-method payment transactions (Cash, Card, UPI, Store Credit).
- **CashRegister & Shift**: Cash drawer management and register shift reporting.

### 6. System & Infrastructure
- **AuditLog**: Immutable audit trail for administrative and financial mutations.
- **SyncQueue**: Queue entity for offline POS sync reconciliation.
- **Notification**: User and store alerts.
