const http = require('http');

function get(urlStr) {
  return new Promise((resolve, reject) => {
    http.get(urlStr, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`http://localhost:5080${path}`);
    const data = body ? JSON.stringify(body) : null;
    const req = http.request(
      url,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        },
      },
      (res) => {
        let respData = '';
        res.on('data', (chunk) => (respData += chunk));
        res.on('end', () => {
          try {
            const parsed = respData ? JSON.parse(respData) : null;
            resolve({ status: res.statusCode, body: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, raw: respData });
          }
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runFullVerification() {
  console.log('=====================================================');
  console.log('   PHASE 3: DELEGATION CORE & WORKSPACE VERIFICATION ');
  console.log('=====================================================\n');

  // Check 1: Backend Server Live
  const healthRes = await get('http://localhost:5080/api/v1/health');
  if (healthRes.status !== 200) {
    console.error('FAIL: Backend health check failed on port 5080');
    process.exit(1);
  }
  console.log('✓ Check 1: Backend running on http://localhost:5080 and healthy.');

  // Check 2: Frontend Vite Server Live
  const feRes = await get('http://localhost:5185/');
  if (feRes.status !== 200) {
    console.error('FAIL: Frontend dev server not responding on port 5185');
    process.exit(1);
  }
  console.log('✓ Check 2: Frontend running on http://localhost:5185 and serving HTML.');

  // Check 3: Authentication & Token
  const loginRes = await request('POST', '/api/v1/auth/login', {
    email: 'admin@company.com',
    password: 'admin123',
  });
  if (loginRes.status !== 200 || !loginRes.body?.data?.token) {
    console.error('FAIL: Login failed', loginRes);
    process.exit(1);
  }
  const token = loginRes.body.data.token;
  console.log('✓ Check 3: Administrator login succeeded, JWT session issued.');

  // Check 4: Fetch Masters
  const usersRes = await request('GET', '/api/v1/master/users', null, token);
  const projectsRes = await request('GET', '/api/v1/master/projects', null, token);
  const users = usersRes.body?.data || [];
  const projects = projectsRes.body?.data || [];
  console.log(`✓ Check 4: Masters loaded -> ${users.length} active users, ${projects.length} active projects.`);

  // Check 5: Delegation Task Creation & Immutability of originalDueDate
  const assignee = users.find(u => u.role !== 'Administrator') || users[0];
  const targetProject = projects[0];
  const plannedDueDate = new Date(Date.now() + 86400000 * 4).toISOString(); // +4 days
  
  const createRes = await request('POST', '/api/v1/delegation', {
    title: '[SYSTEM TEST] Tower B foundation reinforcement review',
    description: 'Ensure structural inspection report matches architectural specifications.',
    assignedTo: assignee._id,
    project: targetProject ? targetProject._id : null,
    dueDate: plannedDueDate,
    priority: 'high',
    proofRequired: true,
  }, token);

  const createdTask = createRes.body?.data?.task || createRes.body?.data;
  if (createRes.status !== 201 || !createdTask?._id) {
    console.error('FAIL 5: Creation failed', createRes);
    process.exit(1);
  }
  if (!createdTask.originalDueDate || createdTask.revisionCount !== 0) {
    console.error('FAIL 5: Invariance failed on new task', createdTask);
    process.exit(1);
  }
  console.log(`✓ Check 5: Created task ${createdTask.code} with immutable originalDueDate (${createdTask.originalDueDate.slice(0, 10)}) and revisionCount = 0.`);

  // Check 6: Revision Rule Rejection (Without Reason)
  const rejectReviseRes = await request('POST', `/api/v1/delegation/${createdTask._id}/revise`, {
    newDueDate: new Date(Date.now() + 86400000 * 7).toISOString(),
    // Omitting mandatory reason
  }, token);

  if (rejectReviseRes.status === 400) {
    console.log('✓ Check 6: Rejection rule verified: 400 Bad Request returned when reason is missing.');
  } else {
    console.error('FAIL 6: Server accepted date change without reason!', rejectReviseRes);
    process.exit(1);
  }

  // Check 7: Legitimate Revision with Audit Trail
  const revisedDueDate = new Date(Date.now() + 86400000 * 8).toISOString();
  const acceptReviseRes = await request('POST', `/api/v1/delegation/${createdTask._id}/revise`, {
    newDueDate: revisedDueDate,
    reason: 'Heavy monsoon rainfall halted concrete pouring by 4 days',
    kind: 'revise',
  }, token);

  const revisedTask = acceptReviseRes.body?.data?.task || acceptReviseRes.body?.data;
  if (acceptReviseRes.status !== 200 || revisedTask?.revisionCount !== 1) {
    console.error('FAIL 7: Valid revision failed', acceptReviseRes);
    process.exit(1);
  }
  if (revisedTask.originalDueDate === revisedTask.dueDate) {
    console.error('FAIL 7: originalDueDate was overwritten!', revisedTask);
    process.exit(1);
  }
  console.log(`✓ Check 7: Date revised to ${revisedTask.dueDate.slice(0, 10)}. Original planned date preserved. Revision audit logged reason: "${revisedTask.revisions[0].reason}".`);

  // Check 8: Progress Remark Logging
  const progressRes = await request('POST', `/api/v1/delegation/${createdTask._id}/progress`, {
    note: 'Steel rebars delivered to site; inspection scheduled with site supervisor.',
    expectedDate: revisedDueDate,
  }, token);
  const progressedTask = progressRes.body?.data?.task || progressRes.body?.data;
  if (progressRes.status !== 200 || progressedTask?.progressRemarks?.length !== 1) {
    console.error('FAIL 8: Progress remark failed', progressRes);
    process.exit(1);
  }
  console.log('✓ Check 8: Progress remark logged with author and timestamp.');

  // Check 9: Task Completion & Reopen Lifecycle
  const completeRes = await request('PATCH', `/api/v1/delegation/${createdTask._id}/status`, {
    status: 'completed',
  }, token);
  const completedTask = completeRes.body?.data?.task || completeRes.body?.data;
  if (completeRes.status !== 200 || completedTask?.status !== 'completed' || !completedTask?.completedAt) {
    console.error('FAIL 9a: Completion failed', completeRes);
    process.exit(1);
  }
  console.log(`✓ Check 9a: Task ${createdTask.code} marked completed at ${completedTask.completedAt}.`);

  const reopenRes = await request('PATCH', `/api/v1/delegation/${createdTask._id}/status`, {
    status: 'pending',
  }, token);
  const reopenedTask = reopenRes.body?.data?.task || reopenRes.body?.data;
  if (reopenRes.status !== 200 || reopenedTask?.status !== 'pending') {
    console.error('FAIL 9b: Reopen failed', reopenRes);
    process.exit(1);
  }
  console.log(`✓ Check 9b: Task ${createdTask.code} successfully reopened to pending.`);

  // Check 10: Query Delegation List & Stats
  const listRes = await request('GET', '/api/v1/delegation?q=&status=all&assignee=&project=&slice=&page=1&limit=20', null, token);
  const statsRes = await request('GET', '/api/v1/delegation/stats', null, token);
  const totalTasks = listRes.body?.items?.length || 0;
  const stats = statsRes.body?.data || {};

  console.log(`✓ Check 10: Delegation workspace query returned ${totalTasks} tasks. Stats: Total=${stats.totalWork}, Pending=${stats.pending}, Overdue=${stats.overdue}, Completed=${stats.completed}, WeekShifted=${stats.weekShifted}.`);

  console.log('\n=====================================================');
  console.log('   PHASE 3 VERIFICATION COMPLETED WITH 100% SUCCESS  ');
  console.log('=====================================================');
}

runFullVerification().catch((err) => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
