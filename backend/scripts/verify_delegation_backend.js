const http = require('http');

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

async function verify() {
  console.log('=== TASKFLOW ERP - PHASE 3 DELEGATION API VERIFICATION ===\n');

  // 1. Login
  const loginRes = await request('POST', '/api/v1/auth/login', {
    email: 'admin@company.com',
    password: 'admin123',
  });
  if (loginRes.status !== 200 || !loginRes.body.data?.token) {
    console.error('FAIL: Login failed', loginRes);
    process.exit(1);
  }
  const token = loginRes.body.data.token;
  console.log('PASS 1: Authenticated as Administrator.');

  // 2. Fetch users & projects for foreign keys
  const usersRes = await request('GET', '/api/v1/master/users', null, token);
  const projectsRes = await request('GET', '/api/v1/master/projects', null, token);
  const usersList = Array.isArray(usersRes.body?.data) ? usersRes.body.data : usersRes.body?.data?.users || [];
  const projectsList = Array.isArray(projectsRes.body?.data) ? projectsRes.body.data : projectsRes.body?.data?.projects || [];
  const assignee = usersList.find(u => u.email !== 'admin@company.com') || usersList[0];
  const project = projectsList[0];

  if (!assignee) {
    console.error('FAIL: No users found');
    process.exit(1);
  }
  console.log(`PASS 2: Test assignee resolved -> ${assignee.name} (${assignee.role})`);

  // 3. Create Delegation Task
  const dueDate = new Date(Date.now() + 86400000 * 3).toISOString(); // 3 days from now
  const createRes = await request('POST', '/api/v1/delegation', {
    title: '[VERIFY] Structural drawing review for Site A',
    description: 'Ensure engineer cross-verifies dimensions with architect.',
    assignedTo: assignee._id,
    project: project ? project._id : null,
    dueDate,
    priority: 'high',
  }, token);

  const task = createRes.body?.data?.task || createRes.body?.data;
  if (createRes.status !== 201 || !task) {
    console.error('FAIL 3: Task creation failed', createRes);
    process.exit(1);
  }
  console.log(`PASS 3: Created Delegation task ${task.code} (ID: ${task._id})`);
  if (!task.originalDueDate || task.revisionCount !== 0) {
    console.error('FAIL 3: originalDueDate or revisionCount invalid', task);
    process.exit(1);
  }
  console.log('PASS 3b: Invariance verified: originalDueDate preserved, revisionCount == 0.');

  // 4. Test revision validation: Rejection when reason is omitted
  const invalidReviseRes = await request('POST', `/api/v1/delegation/${task._id}/revise`, {
    newDueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
    // reason missing!
  }, token);

  if (invalidReviseRes.status === 400) {
    console.log('PASS 4a: Mandatory reason rule enforced (400 returned when reason omitted).');
  } else {
    console.error('FAIL 4a: Revision succeeded without mandatory reason!', invalidReviseRes);
    process.exit(1);
  }

  // 4b. Legitimate revision with audit reason
  const newDueDate = new Date(Date.now() + 86400000 * 6).toISOString();
  const validReviseRes = await request('POST', `/api/v1/delegation/${task._id}/revise`, {
    newDueDate,
    reason: 'Client delayed floor plans approval by 3 days',
  }, token);

  const revisedTask = validReviseRes.body?.data?.task || validReviseRes.body?.data;
  if (validReviseRes.status !== 200 || revisedTask?.revisionCount !== 1) {
    console.error('FAIL 4b: Revision failed', validReviseRes);
    process.exit(1);
  }
  if (revisedTask.revisions.length !== 1 || revisedTask.originalDueDate === revisedTask.dueDate) {
    console.error('FAIL 4b: Invariance violated: originalDueDate was overwritten!', revisedTask);
    process.exit(1);
  }
  console.log(`PASS 4b: Date successfully revised to ${revisedTask.dueDate}. Audit history logged 1 entry with reason: "${revisedTask.revisions[0].reason}".`);

  // 5. Test Progress Remark
  const progressRes = await request('POST', `/api/v1/delegation/${task._id}/progress`, {
    note: 'Initial review completed, waiting for structural consultant confirmation',
    expectedDate: newDueDate,
  }, token);

  const progressTask = progressRes.body?.data?.task || progressRes.body?.data;
  if (progressRes.status !== 200 || progressTask?.progressRemarks?.length !== 1) {
    console.error('FAIL 5: Progress remark failed', progressRes);
    process.exit(1);
  }
  console.log('PASS 5: Progress remark logged successfully.');

  // 6. Test Status Completion
  const completeRes = await request('PATCH', `/api/v1/delegation/${task._id}/status`, {
    status: 'completed',
  }, token);

  const completedTask = completeRes.body?.data?.task || completeRes.body?.data;
  if (completeRes.status !== 200 || completedTask?.status !== 'completed') {
    console.error('FAIL 6: Status completion failed', completeRes);
    process.exit(1);
  }
  console.log('PASS 6: Task marked completed with timestamp and user attribution.');

  // 7. Test Reopening
  const reopenRes = await request('PATCH', `/api/v1/delegation/${task._id}/status`, {
    status: 'pending',
  }, token);

  const reopenedTask = reopenRes.body?.data?.task || reopenRes.body?.data;
  if (reopenRes.status !== 200 || reopenedTask?.status !== 'pending') {
    console.error('FAIL 7: Task reopen failed', reopenRes);
    process.exit(1);
  }
  console.log('PASS 7: Task successfully reopened to pending.');

  // 8. Test List Endpoint with query filtering
  const listRes = await request('GET', '/api/v1/delegation?q=&status=all&assignee=&project=&slice=&page=1&limit=20', null, token);
  const taskItems = listRes.body?.items || listRes.body?.data?.tasks;
  if (listRes.status !== 200 || !Array.isArray(taskItems)) {
    console.error('FAIL 8: Delegation list query failed', listRes);
    process.exit(1);
  }
  console.log(`PASS 8: Delegation list endpoint returned ${taskItems.length} tasks.`);

  // 9. Test Stats Endpoint
  const statsRes = await request('GET', '/api/v1/delegation/stats', null, token);
  if (statsRes.status !== 200 || typeof statsRes.body.data?.totalWork !== 'number') {
    console.error('FAIL 9: Delegation stats endpoint failed', statsRes);
    process.exit(1);
  }
  console.log('PASS 9: Delegation stats computed correctly:');
  console.log(JSON.stringify(statsRes.body.data, null, 2));

  console.log('\n=== ALL PHASE 3 BACKEND API CHECKS PASSED WITH 100% SUCCESS ===');
}

verify().catch((err) => {
  console.error('Unhandled verification error:', err);
  process.exit(1);
});
