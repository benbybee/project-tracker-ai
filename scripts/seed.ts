import { db } from '../src/server/db';
import { roles, projects, tasks, users } from '../src/server/db/schema';
import bcrypt from 'bcryptjs';

async function seed() {
  try {
    console.log('🌱 Starting database seed...');

    // Create a demo user first (or use existing)
    const [demoUser] = await db
      .insert(users)
      .values({
        email: 'demo@example.com',
        name: 'Demo User',
        passwordHash: await bcrypt.hash('demo123456', 10),
      })
      .onConflictDoNothing()
      .returning();

    if (!demoUser) {
      console.log('⚠️  Demo user already exists, skipping seed data creation');
      return;
    }

    console.log('✅ Created demo user:', demoUser.email);

    // Create a default role
    const [defaultRole] = await db
      .insert(roles)
      .values({
        userId: demoUser.id,
        name: 'Development',
        color: '#3B82F6',
      })
      .returning();

    console.log('✅ Created default role:', defaultRole.name);

    // Create a sample project
    const [sampleProject] = await db
      .insert(projects)
      .values({
        userId: demoUser.id,
        name: 'Sample Website Project',
        type: 'website',
        description: 'A sample website project to get you started',
        roleId: defaultRole.id,
        notes: 'This is a sample project with some initial notes.',
        domain: 'example.com',
        hostingProvider: 'Vercel',
        dnsStatus: 'Active',
        goLiveDate: '2024-02-01',
        repoUrl: 'https://github.com/username/sample-project',
        stagingUrl: 'https://staging.example.com',
        checklistJson: {
          design: { completed: true, notes: 'Design completed' },
          development: { completed: false, notes: 'In progress' },
          testing: { completed: false, notes: 'Not started' },
          deployment: { completed: false, notes: 'Not started' },
        },
      })
      .returning();

    console.log('✅ Created sample project:', sampleProject.name);

    // Create sample tasks
    const sampleTasks = [
      {
        userId: demoUser.id,
        projectId: sampleProject.id,
        roleId: defaultRole.id,
        title: 'Set up project structure',
        description:
          'Initialize the project with proper folder structure and configuration',
        status: 'completed' as const,
        dueDate: '2024-01-15',
        priorityScore: '1' as const,
      },
      {
        userId: demoUser.id,
        projectId: sampleProject.id,
        roleId: defaultRole.id,
        title: 'Design homepage',
        description:
          'Create the main homepage design with hero section and navigation',
        status: 'in_progress' as const,
        dueDate: '2024-01-20',
        priorityScore: '2' as const,
      },
      {
        userId: demoUser.id,
        projectId: sampleProject.id,
        roleId: defaultRole.id,
        title: 'Implement responsive layout',
        description:
          'Make sure the website works well on mobile and tablet devices',
        status: 'not_started' as const,
        dueDate: '2024-01-25',
        priorityScore: '3' as const,
      },
      {
        userId: demoUser.id,
        projectId: sampleProject.id,
        roleId: defaultRole.id,
        title: 'Set up analytics',
        description: 'Integrate Google Analytics and other tracking tools',
        status: 'blocked' as const,
        dueDate: '2024-01-30',
        priorityScore: '4' as const,
        blockedReason: 'Waiting for analytics account setup',
        blockedDetails:
          'Need to create Google Analytics account and get tracking ID',
      },
    ];

    const createdTasks = await db.insert(tasks).values(sampleTasks).returning();

    console.log('✅ Created sample tasks:', createdTasks.length);

    // Create a general project as well
    const [generalProject] = await db
      .insert(projects)
      .values({
        userId: demoUser.id,
        name: 'Personal Tasks',
        type: 'general',
        description: 'A general project for personal tasks and todos',
        roleId: defaultRole.id,
        notes:
          "Use this project for tasks that don't fit into specific website projects.",
      })
      .returning();

    console.log('✅ Created general project:', generalProject.name);

    // Add some tasks to the general project
    const generalTasks = [
      {
        userId: demoUser.id,
        projectId: generalProject.id,
        roleId: defaultRole.id,
        title: 'Review project documentation',
        description:
          'Go through all project documentation and update as needed',
        status: 'not_started' as const,
        dueDate: '2024-01-18',
        priorityScore: '2' as const,
        isDaily: true,
      },
      {
        userId: demoUser.id,
        projectId: generalProject.id,
        roleId: defaultRole.id,
        title: 'Plan next sprint',
        description:
          'Plan tasks and priorities for the next development sprint',
        status: 'in_progress' as const,
        dueDate: '2024-01-22',
        priorityScore: '1' as const,
      },
    ];

    await db.insert(tasks).values(generalTasks).returning();

    console.log('✅ Created general project tasks');

    console.log('🎉 Database seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

seed()
  .then(() => {
    console.log('Seed script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed script failed:', error);
    process.exit(1);
  });
