import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DashboardService } from './modules/dashboard/dashboard.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dashboardService = app.get(DashboardService);

  const tenantId = '82517288-00d8-4d5a-9e29-508089fc061c'; // Tenant 'team'
  console.log('Fetching dashboard overview...');
  const overview = await dashboardService.getOverview(tenantId);
  console.log('Overview counts:', overview);

  console.log('Fetching category distribution...');
  const categorySummary = await dashboardService.getCategoryDistribution(tenantId);
  console.log('Category distribution:', categorySummary);

  console.log('Fetching inventory summary...');
  const inventorySummary = await dashboardService.getInventorySummary(tenantId);
  console.log('Inventory summary:', inventorySummary);

  await app.close();
}

main();
