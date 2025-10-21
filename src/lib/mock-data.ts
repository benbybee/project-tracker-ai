// Mock data for UI-only deployment
export const mockProjects = [
  {
    id: "1",
    name: "Website Redesign",
    type: "website",
    description: "Complete redesign of the company website with modern UI",
    pinned: true,
    created_at: new Date("2024-01-15"),
    updated_at: new Date("2024-01-20"),
  },
  {
    id: "2", 
    name: "Mobile App",
    type: "general",
    description: "Cross-platform mobile application for task management",
    pinned: false,
    created_at: new Date("2024-01-10"),
    updated_at: new Date("2024-01-18"),
  },
  {
    id: "3",
    name: "API Integration",
    type: "general", 
    description: "Integrate third-party APIs for enhanced functionality",
    pinned: false,
    created_at: new Date("2024-01-05"),
    updated_at: new Date("2024-01-12"),
  }
];

export const mockTasks = [
  {
    id: "1",
    project_id: "1",
    title: "Design new homepage layout",
    description: "Create wireframes and mockups for the new homepage",
    status: "in_progress",
    due_date: new Date("2024-02-01"),
    priority_score: 3,
    created_at: new Date("2024-01-15"),
    updated_at: new Date("2024-01-20"),
  },
  {
    id: "2",
    project_id: "1", 
    title: "Implement responsive design",
    description: "Ensure the design works across all device sizes",
    status: "not_started",
    due_date: new Date("2024-02-15"),
    priority_score: 2,
    created_at: new Date("2024-01-16"),
    updated_at: new Date("2024-01-16"),
  },
  {
    id: "3",
    project_id: "2",
    title: "Set up development environment",
    description: "Configure React Native development setup",
    status: "completed",
    due_date: new Date("2024-01-20"),
    priority_score: 1,
    created_at: new Date("2024-01-10"),
    updated_at: new Date("2024-01-18"),
  },
  {
    id: "4",
    project_id: "2",
    title: "Create user authentication",
    description: "Implement secure login and registration system",
    status: "in_progress", 
    due_date: new Date("2024-02-10"),
    priority_score: 3,
    created_at: new Date("2024-01-12"),
    updated_at: new Date("2024-01-19"),
  }
];

export const mockRoles = [
  {
    id: "1",
    name: "Frontend Developer",
    color: "#3B82F6",
    created_at: new Date("2024-01-01"),
    updated_at: new Date("2024-01-01"),
  },
  {
    id: "2", 
    name: "Backend Developer",
    color: "#10B981",
    created_at: new Date("2024-01-01"),
    updated_at: new Date("2024-01-01"),
  },
  {
    id: "3",
    name: "Designer",
    color: "#8B5CF6", 
    created_at: new Date("2024-01-01"),
    updated_at: new Date("2024-01-01"),
  }
];
