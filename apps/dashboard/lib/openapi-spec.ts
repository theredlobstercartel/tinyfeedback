export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'TinyFeedback API',
    description: 'REST API for TinyFeedback - Widget de feedback ultra-leve para SaaS',
    version: '1.0.0',
    contact: {
      name: 'TinyFeedback Support',
      email: 'support@tinyfeedback.app',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'Production API',
    },
    {
      url: 'http://localhost:3000/api/v1',
      description: 'Development',
    },
  ],
  security: [
    {
      ApiKeyAuth: [],
    },
  ],
  tags: [
    {
      name: 'Feedbacks',
      description: 'Manage feedback entries',
    },
    {
      name: 'Quota',
      description: 'Check usage quotas',
    },
  ],
  paths: {
    '/feedbacks': {
      get: {
        tags: ['Feedbacks'],
        summary: 'List feedbacks',
        description: 'Retrieve a paginated list of feedbacks for your project',
        operationId: 'listFeedbacks',
        parameters: [
          {
            name: 'type',
            in: 'query',
            description: 'Filter by feedback type',
            schema: {
              type: 'string',
              enum: ['nps', 'suggestion', 'bug'],
            },
          },
          {
            name: 'status',
            in: 'query',
            description: 'Filter by status',
            schema: {
              type: 'string',
              enum: ['new', 'analyzing', 'implemented', 'archived'],
            },
          },
          {
            name: 'from',
            in: 'query',
            description: 'Filter by date (ISO 8601)',
            schema: {
              type: 'string',
              format: 'date-time',
            },
          },
          {
            name: 'to',
            in: 'query',
            description: 'Filter by date (ISO 8601)',
            schema: {
              type: 'string',
              format: 'date-time',
            },
          },
          {
            name: 'page',
            in: 'query',
            description: 'Page number',
            schema: {
              type: 'integer',
              minimum: 1,
              default: 1,
            },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Items per page (max 100)',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              default: 20,
            },
          },
          {
            name: 'cursor',
            in: 'query',
            description: 'Cursor for pagination (base64 encoded)',
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': {
            description: 'List of feedbacks',
            headers: {
              'X-RateLimit-Limit': {
                schema: { type: 'integer' },
                description: 'Rate limit per minute',
              },
              'X-RateLimit-Remaining': {
                schema: { type: 'integer' },
                description: 'Remaining requests',
              },
              'X-RateLimit-Reset': {
                schema: { type: 'integer' },
                description: 'Reset timestamp (Unix)',
              },
            },
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/FeedbackListResponse',
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized - API key missing',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '403': {
            description: 'Forbidden - Invalid API key or domain',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '429': {
            description: 'Rate limit exceeded',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      post: {
        tags: ['Feedbacks'],
        summary: 'Create feedback',
        description: 'Submit a new feedback entry (NPS, suggestion, or bug)',
        operationId: 'createFeedback',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreateFeedbackRequest',
              },
              examples: {
                nps: {
                  summary: 'NPS Feedback',
                  value: {
                    type: 'nps',
                    content: {
                      score: 9,
                      comment: 'Great product!',
                    },
                  },
                },
                suggestion: {
                  summary: 'Feature Suggestion',
                  value: {
                    type: 'suggestion',
                    content: {
                      title: 'Add dark mode',
                      description: 'It would be great to have a dark mode option for better night usage.',
                      category: 'Feature',
                    },
                  },
                },
                bug: {
                  summary: 'Bug Report',
                  value: {
                    type: 'bug',
                    content: {
                      description: 'The login button is not working on mobile devices.',
                      includeTechnicalInfo: true,
                      contactEmail: 'user@example.com',
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Feedback created',
            headers: {
              'X-RateLimit-Limit': { schema: { type: 'integer' } },
              'X-RateLimit-Remaining': { schema: { type: 'integer' } },
              'X-RateLimit-Reset': { schema: { type: 'integer' } },
            },
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/CreateFeedbackResponse',
                },
              },
            },
          },
          '400': {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '403': {
            description: 'Forbidden',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '429': {
            description: 'Rate limit or quota exceeded',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/feedbacks/{id}': {
      get: {
        tags: ['Feedbacks'],
        summary: 'Get feedback',
        description: 'Retrieve a single feedback by ID',
        operationId: 'getFeedback',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Feedback ID',
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Feedback details',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/FeedbackResponse',
                },
              },
            },
          },
          '404': {
            description: 'Feedback not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      patch: {
        tags: ['Feedbacks'],
        summary: 'Update feedback',
        description: 'Update feedback status or priority',
        operationId: 'updateFeedback',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Feedback ID',
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UpdateFeedbackRequest',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Feedback updated',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/FeedbackResponse',
                },
              },
            },
          },
          '404': {
            description: 'Feedback not found',
          },
        },
      },
      delete: {
        tags: ['Feedbacks'],
        summary: 'Delete feedback',
        description: 'Delete a feedback entry',
        operationId: 'deleteFeedback',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Feedback ID',
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Feedback deleted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        deleted: { type: 'boolean' },
                      },
                    },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Feedback not found',
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API key for authentication. Get yours from the dashboard.',
      },
    },
    schemas: {
      Feedback: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          project_id: { type: 'string', format: 'uuid' },
          type: { type: 'string', enum: ['nps', 'suggestion', 'bug'] },
          content: {
            type: 'object',
            description: 'Content varies by type',
          },
          user_id: { type: 'string', nullable: true },
          user_email: { type: 'string', format: 'email', nullable: true },
          user_name: { type: 'string', nullable: true },
          status: { type: 'string', enum: ['new', 'analyzing', 'implemented', 'archived'] },
          priority: { type: 'string', enum: ['low', 'medium', 'high'], nullable: true },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'project_id', 'type', 'content', 'status', 'created_at'],
      },
      CreateFeedbackRequest: {
        type: 'object',
        oneOf: [
          { $ref: '#/components/schemas/NPSFeedbackInput' },
          { $ref: '#/components/schemas/SuggestionFeedbackInput' },
          { $ref: '#/components/schemas/BugFeedbackInput' },
        ],
        discriminator: {
          propertyName: 'type',
          mapping: {
            nps: '#/components/schemas/NPSFeedbackInput',
            suggestion: '#/components/schemas/SuggestionFeedbackInput',
            bug: '#/components/schemas/BugFeedbackInput',
          },
        },
      },
      NPSFeedbackInput: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['nps'] },
          content: {
            type: 'object',
            properties: {
              score: { type: 'number', minimum: 0, maximum: 10 },
              comment: { type: 'string', maxLength: 500 },
            },
            required: ['score'],
          },
          userId: { type: 'string' },
          userEmail: { type: 'string', format: 'email' },
          userName: { type: 'string' },
          anonymousId: { type: 'string' },
        },
        required: ['type', 'content'],
      },
      SuggestionFeedbackInput: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['suggestion'] },
          content: {
            type: 'object',
            properties: {
              title: { type: 'string', minLength: 5, maxLength: 100 },
              description: { type: 'string', minLength: 20, maxLength: 2000 },
              category: { type: 'string' },
            },
            required: ['title', 'description'],
          },
          userId: { type: 'string' },
          userEmail: { type: 'string', format: 'email' },
          userName: { type: 'string' },
          anonymousId: { type: 'string' },
        },
        required: ['type', 'content'],
      },
      BugFeedbackInput: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['bug'] },
          content: {
            type: 'object',
            properties: {
              description: { type: 'string', minLength: 20, maxLength: 2000 },
              includeTechnicalInfo: { type: 'boolean', default: true },
              contactEmail: { type: 'string', format: 'email' },
            },
            required: ['description'],
          },
          userId: { type: 'string' },
          userEmail: { type: 'string', format: 'email' },
          userName: { type: 'string' },
          anonymousId: { type: 'string' },
          technicalContext: { type: 'object' },
        },
        required: ['type', 'content'],
      },
      CreateFeedbackResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              type: { type: 'string' },
              status: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        required: ['success', 'data'],
      },
      FeedbackListResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/Feedback' },
          },
          meta: {
            type: 'object',
            properties: {
              page: { type: 'integer' },
              limit: { type: 'integer' },
              total: { type: 'integer' },
              hasMore: { type: 'boolean' },
              nextCursor: { type: 'string', nullable: true },
            },
          },
        },
        required: ['success', 'data'],
      },
      FeedbackResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: { $ref: '#/components/schemas/Feedback' },
        },
        required: ['success', 'data'],
      },
      UpdateFeedbackRequest: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['new', 'analyzing', 'implemented', 'archived'] },
          priority: { type: 'string', enum: ['low', 'medium', 'high'] },
        },
      },
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'UNAUTHORIZED' },
              message: { type: 'string', example: 'API key is required' },
              details: { type: 'object' },
            },
            required: ['code', 'message'],
          },
        },
        required: ['success', 'error'],
      },
    },
  },
}

export type OpenApiSpec = typeof openApiSpec