const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');

// Mock MongoDB connection
jest.mock('../config/db', () => jest.fn(() => Promise.resolve()));

// Mock mongoose models
jest.mock('../models/Project', () => ({
  findOne: jest.fn(),
  findById: jest.fn(),
}));
jest.mock('../models/DesignDoc', () => ({
  findOne: jest.fn(),
}));

// Mock services
jest.mock('../services/codeGenService', () => ({
  generatePlan: jest.fn(),
  generateFileContent: jest.fn(),
}));
jest.mock('../services/fileService', () => ({
  FileService: jest.fn().mockImplementation(() => ({
    writeFile: jest.fn(),
  })),
}));

// Create a test app without starting the server
const app = express();
app.use(express.json());

// Mock authentication middleware
const mockAuthMiddleware = (req, res, next) => {
  req.user = { userId: '507f1f77bcf86cd799439012' };
  next();
};

// Import and use routes with auth middleware
const codeGenRoutes = require('../routes/codeGenRoutes');
app.use('/api/v1/codegen', mockAuthMiddleware, codeGenRoutes);

describe('CodeGen API Tests', () => {
  let testProjectId = '507f1f77bcf86cd799439011'; // Mock ObjectId
  let testUserId = '507f1f77bcf86cd799439012'; // Mock ObjectId

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock Project.findOne to return a project
    const Project = require('../models/Project');
    const mockProject = {
      _id: testProjectId,
      owner: testUserId,
      name: 'Test Project',
      codegenPlan: { files: [{ path: 'test.js', purpose: 'test' }] },
      codegenStatus: new Map([['test.js', { status: 'completed', attempts: 1, lastAttempt: new Date(), error: null }]]),
      save: jest.fn().mockResolvedValue(this)
    };
    Project.findOne.mockResolvedValue(mockProject);

    // Mock DesignDoc.findOne to return a design doc with sort method
    const DesignDoc = require('../models/DesignDoc');
    DesignDoc.findOne.mockReturnValue({
      sort: jest.fn().mockResolvedValue({
        content: '# Test LLD\nThis is a test LLD document.'
      })
    });

    // Mock codeGenService.generatePlan
    const codeGenService = require('../services/codeGenService');
    codeGenService.generatePlan.mockResolvedValue({
      files: [
        { path: 'server/controllers/authController.js', purpose: 'Handle authentication', language: 'javascript' },
        { path: 'server/models/User.js', purpose: 'User model', language: 'javascript' }
      ]
    });

    // Mock codeGenService.generateFileContent
    codeGenService.generateFileContent.mockResolvedValue({
      code: 'console.log("Hello World");',
      language: 'javascript'
    });

    // Mock fileService.writeFile
    const fileService = require('../services/fileService');
    fileService.FileService.mockImplementation(() => ({
      writeFile: jest.fn().mockResolvedValue('/path/to/file.js')
    }));
  });

  describe('POST /api/v1/codegen/plan', () => {
    test('should create a codegen plan successfully', async () => {
      const response = await request(app)
        .post('/api/v1/codegen/plan')
        .send({ projectId: testProjectId })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.plan).toBeDefined();
      expect(Array.isArray(response.body.plan.files)).toBe(true);
    });

    test('should return 400 if projectId is missing', async () => {
      const response = await request(app)
        .post('/api/v1/codegen/plan')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('projectId is required');
    });
  });

  describe('POST /api/v1/codegen/applyBatch', () => {
    test('should apply batch codegen successfully', async () => {
      const response = await request(app)
        .post('/api/v1/codegen/applyBatch')
        .send({ projectId: testProjectId, dryRun: true })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.dryRun).toBe(true);
      expect(Array.isArray(response.body.files)).toBe(true);
    });

    test('should return 400 if projectId is missing', async () => {
      const response = await request(app)
        .post('/api/v1/codegen/applyBatch')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('projectId is required');
    });
  });

  describe('GET /api/v1/codegen/status', () => {
    test('should get codegen status successfully', async () => {
      const response = await request(app)
        .get('/api/v1/codegen/status')
        .query({ projectId: testProjectId })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(typeof response.body.status).toBe('object');
    });

    test('should return 400 if projectId is missing', async () => {
      const response = await request(app)
        .get('/api/v1/codegen/status')
        .query({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('projectId is required');
    });
  });

  describe('POST /api/v1/codegen/finalize', () => {
    test('should finalize codegen successfully', async () => {
      const response = await request(app)
        .post('/api/v1/codegen/finalize')
        .send({ projectId: testProjectId })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Code generation finalized');
      expect(response.body.results).toBeDefined();
    });

    test('should return 400 if projectId is missing', async () => {
      const response = await request(app)
        .post('/api/v1/codegen/finalize')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('projectId is required');
    });
  });
});
