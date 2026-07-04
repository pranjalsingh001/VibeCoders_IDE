// planningQuestions.ts
// -------------------
// Configuration for planning flow questions
// Defines the complete set of questions for project planning

import { PlanningFlowConfig } from '../types/planning'
import { commonValidations } from '../utils/validation'

export const planningFlowConfig: PlanningFlowConfig = {
  title: 'Project Planning',
  description: 'Help us understand your project requirements and goals',
  estimatedTime: '5-10 minutes',
  questions: [
    {
      id: 'project_name',
      text: 'What is the name of your project?',
      type: 'text',
      hint: 'Choose a clear, descriptive name for your project',
      examples: ['TaskMaster Pro', 'E-commerce Dashboard', 'Social Media Analytics'],
      placeholder: 'Enter your project name',
      required: true,
      validation: commonValidations.text(3, 50, true)
    },
    {
      id: 'project_description',
      text: 'Describe your project in detail',
      type: 'textarea',
      hint: 'Explain what your project does, who it\'s for, and what problems it solves',
      examples: [
        'A task management app for small teams to track project progress',
        'An e-commerce platform for local artisans to sell handmade goods',
        'A social media analytics tool for marketing professionals'
      ],
      placeholder: 'Provide a detailed description of your project...',
      required: true,
      validation: commonValidations.description()
    },
    {
      id: 'target_audience',
      text: 'Who is your target audience?',
      type: 'textarea',
      hint: 'Describe the primary users of your application',
      examples: [
        'Small business owners and their employees',
        'College students managing coursework',
        'Marketing professionals at mid-size companies'
      ],
      placeholder: 'Describe your target users...',
      required: true,
      validation: commonValidations.text(10, 300, true)
    },
    {
      id: 'project_type',
      text: 'What type of application are you building?',
      type: 'select',
      options: [
        'Web Application',
        'Mobile App (React Native)',
        'Desktop Application',
        'API/Backend Service',
        'Full-Stack Application',
        'Static Website',
        'Other'
      ],
      hint: 'Select the primary type of application you want to create',
      required: true,
      validation: commonValidations.required('Please select a project type')
    },
    {
      id: 'key_features',
      text: 'What are the key features you want to include?',
      type: 'textarea',
      hint: 'List the main features and functionality your users will need',
      examples: [
        'User authentication, task creation, team collaboration, progress tracking',
        'Product catalog, shopping cart, payment processing, order management',
        'Data visualization, report generation, user analytics, dashboard'
      ],
      placeholder: 'List the key features you want to include...',
      required: true,
      validation: commonValidations.text(20, 500, true)
    },
    {
      id: 'tech_preferences',
      text: 'Do you have any technology preferences?',
      type: 'textarea',
      hint: 'Specify any preferred programming languages, frameworks, or technologies',
      examples: [
        'React with TypeScript, Node.js backend, PostgreSQL database',
        'Python with Django, SQLite for development',
        'No specific preferences, recommend what\'s best'
      ],
      placeholder: 'Specify your technology preferences or leave blank for recommendations...',
      required: false,
      validation: commonValidations.text(0, 300, false)
    },
    {
      id: 'timeline',
      text: 'What is your expected timeline for this project?',
      type: 'select',
      options: [
        '1-2 weeks',
        '1 month',
        '2-3 months',
        '3-6 months',
        '6+ months',
        'No specific timeline'
      ],
      hint: 'This helps us recommend appropriate scope and complexity',
      required: true,
      validation: commonValidations.required('Please select a timeline')
    },
    {
      id: 'additional_requirements',
      text: 'Any additional requirements or constraints?',
      type: 'textarea',
      hint: 'Include any special requirements, integrations, or constraints we should know about',
      examples: [
        'Must integrate with existing CRM system',
        'Needs to support 1000+ concurrent users',
        'Must be mobile-responsive and accessible'
      ],
      placeholder: 'Describe any additional requirements...',
      required: false,
      validation: commonValidations.text(0, 400, false)
    }
  ]
}

// Helper function to get question by ID
export function getQuestionById(id: string) {
  return planningFlowConfig.questions.find(q => q.id === id)
}

// Helper function to get next question index
export function getNextQuestionIndex(currentIndex: number, answers: Record<string, string>): number {
  const questions = planningFlowConfig.questions
  
  for (let i = currentIndex + 1; i < questions.length; i++) {
    const question = questions[i]
    
    // Check if question should be shown based on dependencies
    if (question.showWhen && !question.showWhen(answers)) {
      continue
    }
    
    return i
  }
  
  return questions.length // End of questions
}

// Helper function to get previous question index
export function getPreviousQuestionIndex(currentIndex: number, answers: Record<string, string>): number {
  const questions = planningFlowConfig.questions
  
  for (let i = currentIndex - 1; i >= 0; i--) {
    const question = questions[i]
    
    // Check if question should be shown based on dependencies
    if (question.showWhen && !question.showWhen(answers)) {
      continue
    }
    
    return i
  }
  
  return -1 // Beginning of questions
}

// Calculate completion percentage
export function calculateCompletionPercentage(answers: Record<string, string>): number {
  const totalQuestions = planningFlowConfig.questions.length
  const answeredQuestions = Object.keys(answers).filter(key => {
    const answer = answers[key]
    return answer && answer.trim().length > 0
  }).length
  
  return Math.round((answeredQuestions / totalQuestions) * 100)
}