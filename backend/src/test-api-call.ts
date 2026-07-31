import 'dotenv/config';

async function main() {
  // Login to get token for tenant 'team'
  const response = await fetch('http://localhost:3000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tenantSlug: 'team',
      email: 'naveendseven@gmail.com',
      password: 'password123',
    }),
  });

  const resJson = await response.json() as any;
  if (!response.ok) {
    console.error('Login failed:', resJson);
    return;
  }

  const { accessToken } = resJson.data;
  console.log('Login successful. Token obtained.');

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  };

  console.log('Calling /dashboard/overview...');
  const overviewRes = await fetch('http://localhost:3000/api/v1/dashboard/overview', { headers });
  const overviewJson = await overviewRes.json();
  console.log('Overview response:', JSON.stringify(overviewJson, null, 2));

  console.log('Calling /dashboard/category-distribution...');
  const categoryRes = await fetch('http://localhost:3000/api/v1/dashboard/category-distribution', { headers });
  const categoryJson = await categoryRes.json();
  console.log('Category distribution response:', JSON.stringify(categoryJson, null, 2));
}

main().catch((err) => {
  console.error('API call failed:', err.message);
});
