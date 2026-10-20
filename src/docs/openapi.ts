export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'Real-Time Sports API',
    version: '1.0.0',
    description:
      'High-performance Real-Time Sports Live Stream & Fast Events Commentary API powered by Express, WebSocket, Drizzle ORM, and Neon Serverless Postgres.',
    contact: {
      name: 'API Support',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local Development Server',
    },
  ],
  tags: [
    { name: 'Matches', description: 'Static Anchor match lifecycle management' },
    { name: 'Commentary', description: 'Dynamic Fast Events story stream' },
    { name: 'System', description: 'Health check and demo utilities' },
  ],
  paths: {
    '/api/matches': {
      get: {
        tags: ['Matches'],
        summary: 'List all matches',
        description: 'Fetch matches ordered by start time, optionally filtered by lifecycle status.',
        parameters: [
          {
            name: 'status',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              enum: ['scheduled', 'live', 'finished'],
            },
            description: 'Filter matches by lifecycle state',
          },
        ],
        responses: {
          '200': {
            description: 'A list of matches',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Match' },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Matches'],
        summary: 'Create a new match',
        description: 'Insert a new static anchor match into the database.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateMatchInput' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Match created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Match' },
              },
            },
          },
          '400': {
            description: 'Validation failed',
          },
        },
      },
    },
    '/api/matches/{id}': {
      get: {
        tags: ['Matches'],
        summary: 'Get match by ID',
        description: 'Retrieve a single match including its full nested commentary timeline.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
            description: 'Match unique ID',
          },
        ],
        responses: {
          '200': {
            description: 'Match found with nested commentary',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MatchWithCommentary' },
              },
            },
          },
          '404': {
            description: 'Match not found',
          },
        },
      },
      patch: {
        tags: ['Matches'],
        summary: 'Update match score or status',
        description: 'Update score or lifecycle state. Broadcasts a SCORE_UPDATED WebSocket event.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
            description: 'Match unique ID',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateMatchInput' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Match updated and WebSocket event broadcast',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Match' },
              },
            },
          },
          '404': {
            description: 'Match not found',
          },
        },
      },
    },
    '/api/matches/{id}/commentary': {
      get: {
        tags: ['Commentary'],
        summary: 'Get match commentary timeline',
        description: 'Retrieve all commentary events for a match ordered chronologically by sequence.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
            description: 'Match unique ID',
          },
        ],
        responses: {
          '200': {
            description: 'Commentary events timeline',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Commentary' },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Commentary'],
        summary: 'Emit commentary event',
        description: 'Record a dynamic commentary event. Automatically broadcasts COMMENTARY_ADDED over WebSocket.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
            description: 'Match unique ID',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateCommentaryInput' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Commentary added and broadcast via WebSocket',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Commentary' },
              },
            },
          },
          '400': {
            description: 'Validation error',
          },
        },
      },
    },
    '/api/health': {
      get: {
        tags: ['System'],
        summary: 'Service health check',
        responses: {
          '200': {
            description: 'Service uptime and status',
          },
        },
      },
    },
    '/api/seed': {
      post: {
        tags: ['System'],
        summary: 'Seed demo match and events',
        description: 'Creates a demo match with sample dynamic commentary in the Neon database.',
        responses: {
          '200': {
            description: 'Demo match seeded',
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Match: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          homeTeam: { type: 'string', example: 'Real Madrid' },
          awayTeam: { type: 'string', example: 'Barcelona' },
          sport: { type: 'string', example: 'Football' },
          startTime: { type: 'string', format: 'date-time', example: '2026-10-20T20:00:00.000Z' },
          status: { type: 'string', enum: ['scheduled', 'live', 'finished'], example: 'live' },
          homeScore: { type: 'integer', example: 2 },
          awayScore: { type: 'integer', example: 1 },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Commentary: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          matchId: { type: 'integer', example: 1 },
          actor: { type: 'string', example: 'Vinicius Jr' },
          message: { type: 'string', example: 'GOAAAL! Stunning finish in bottom corner.' },
          minute: { type: 'integer', example: 23 },
          sequenceNo: { type: 'integer', example: 1 },
          details: {
            type: 'object',
            additionalProperties: true,
            example: { eventType: 'goal', distance: '18m', assistBy: 'Bellingham' },
          },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      MatchWithCommentary: {
        allOf: [
          { $ref: '#/components/schemas/Match' },
          {
            type: 'object',
            properties: {
              commentary: {
                type: 'array',
                items: { $ref: '#/components/schemas/Commentary' },
              },
            },
          },
        ],
      },
      CreateMatchInput: {
        type: 'object',
        required: ['homeTeam', 'awayTeam', 'sport', 'startTime'],
        properties: {
          homeTeam: { type: 'string', example: 'Arsenal' },
          awayTeam: { type: 'string', example: 'Chelsea' },
          sport: { type: 'string', example: 'Football' },
          startTime: { type: 'string', format: 'date-time', example: '2026-10-20T19:00:00.000Z' },
          status: { type: 'string', enum: ['scheduled', 'live', 'finished'], default: 'scheduled' },
          homeScore: { type: 'integer', default: 0 },
          awayScore: { type: 'integer', default: 0 },
        },
      },
      UpdateMatchInput: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['scheduled', 'live', 'finished'] },
          homeScore: { type: 'integer', minimum: 0 },
          awayScore: { type: 'integer', minimum: 0 },
        },
      },
      CreateCommentaryInput: {
        type: 'object',
        required: ['message'],
        properties: {
          actor: { type: 'string', example: 'Bukayo Saka' },
          message: { type: 'string', example: 'Curled shot hit the post!' },
          minute: { type: 'integer', example: 54 },
          sequenceNo: { type: 'integer', description: 'Auto-calculated if omitted' },
          details: {
            type: 'object',
            additionalProperties: true,
            example: { eventType: 'shot', shotSpeed: '95 km/h' },
          },
        },
      },
    },
  },
};
